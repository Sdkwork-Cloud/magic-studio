use crate::events::pty_output_event;
use crate::session::Session;
use portable_pty::{native_pty_system, CommandBuilder, PtySize, PtySystem};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{mpsc, Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{Emitter, Window};

#[derive(Default)]
pub struct PtyState {
    pub sessions: Arc<Mutex<HashMap<String, Arc<Mutex<Session>>>>>,
    // Maps Window Label -> List of Session IDs owned by that window
    pub window_map: Arc<Mutex<HashMap<String, Vec<String>>>>,
}

#[cfg(not(target_os = "windows"))]
fn is_unix_shell(shell: &str) -> bool {
    let shell_lower = shell.to_lowercase();
    shell_lower.contains("bash") || shell_lower.contains("zsh") || shell_lower.contains("fish")
}

impl PtyState {
    pub fn create(
        &self,
        window: Window,
        shell: String,
        cols: u16,
        rows: u16,
        env: Option<HashMap<String, String>>,
        initial_command: Option<String>,
    ) -> Result<String, String> {
        let pty_system: Box<dyn PtySystem + Send> = native_pty_system();

        let size = PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        };

        let pair = pty_system.openpty(size).map_err(|e| e.to_string())?;

        let mut cmd = CommandBuilder::new(shell.clone());

        // 1. Explicitly inherit current process environment
        for (key, value) in std::env::vars() {
            cmd.env(key, value);
        }

        // 2. Apply custom overrides
        if let Some(custom_env) = env {
            for (key, value) in custom_env {
                cmd.env(key, value);
            }
        }

        // 3. Platform specific adjustments
        #[cfg(not(target_os = "windows"))]
        {
            if is_unix_shell(&shell) {
                cmd.args(&["-l"]);
            }
            cmd.env("TERM", "xterm-256color");
        }

        #[cfg(target_os = "windows")]
        {
            // Ensure proper encoding for ConPTY
            cmd.env("TERM", "xterm-256color");
            // Fix potential PATH issues on Windows
            if let Ok(path) = std::env::var("PATH") {
                cmd.env("PATH", path);
            }
        }

        cmd.env("COLORTERM", "truecolor");
        cmd.env("TERM_PROGRAM", "MagicStudio");
        cmd.env("TERM_PROGRAM_VERSION", "0.1.0");

        #[cfg(not(target_os = "windows"))]
        cmd.env("LANG", "en_US.UTF-8");

        if let Some(home) = dirs::home_dir() {
            cmd.cwd(home);
        }

        let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;

        let reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
        let mut writer = pair.master.take_writer().map_err(|e| e.to_string())?;

        if let Some(icmd) = initial_command {
            let input = format!("{}\r\n", icmd);
            if let Err(e) = writer.write_all(input.as_bytes()) {
                println!("Error writing initial command: {}", e);
            }
        }

        let session_id = uuid::Uuid::new_v4().to_string();

        let session = Session {
            master: pair.master,
            child,
            writer,
            reader: Some(reader),
        };

        // Register session
        self.sessions
            .lock()
            .unwrap()
            .insert(session_id.clone(), Arc::new(Mutex::new(session)));

        // Track ownership by window
        let window_label = window.label().to_string();
        let mut wins = self.window_map.lock().unwrap();
        wins.entry(window_label)
            .or_insert_with(Vec::new)
            .push(session_id.clone());

        Ok(session_id)
    }

    pub fn start(&self, id: &str, window: Window) -> Result<(), String> {
        let session_arc = {
            let sessions = self.sessions.lock().unwrap();
            sessions.get(id).cloned()
        };

        if let Some(session_mutex) = session_arc {
            let mut session = session_mutex.lock().unwrap();

            if let Some(mut reader) = session.reader.take() {
                let session_id = id.to_string();
                let sessions_map = self.sessions.clone();
                let window_map = self.window_map.clone();
                let window_label = window.label().to_string();

                thread::spawn(move || {
                    // Create a channel to buffer data between the blocking reader and the rate-limited emitter
                    let (tx, rx) = mpsc::channel::<Vec<u8>>();

                    // Spawn blocking reader thread
                    let reader_thread = thread::spawn(move || {
                        // Increased buffer size to 16KB for better throughput
                        let mut buf = [0u8; 16384];
                        loop {
                            match reader.read(&mut buf) {
                                Ok(n) if n > 0 => {
                                    if tx.send(buf[..n].to_vec()).is_err() {
                                        break;
                                    }
                                }
                                _ => {
                                    let _ = tx.send(Vec::new()); // EOF marker
                                    break;
                                }
                            }
                        }
                    });

                    // Main Emitter Loop
                    let mut buffer = Vec::new();
                    let mut last_emit = std::time::Instant::now();

                    // Adjusted latency settings
                    let max_latency = Duration::from_millis(16); // 60 FPS limit for bulk data (cat, logs)
                    let min_latency = Duration::from_millis(4); // Small delay to allow batching even small writes
                    let max_buffer_size = 65536; // 64KB aggregation limit

                    loop {
                        // Calculate timeout for next flush
                        let now = std::time::Instant::now();
                        let elapsed = now.duration_since(last_emit);
                        let timeout = if elapsed >= max_latency {
                            Duration::from_millis(0)
                        } else {
                            max_latency - elapsed
                        };

                        // Wait for data or timeout
                        match rx.recv_timeout(timeout) {
                            Ok(data) => {
                                if data.is_empty() {
                                    break;
                                } // EOF

                                // Low Latency Path Optimization:
                                // If buffer is empty AND data chunk is very small (likely keystroke echo),
                                // emit immediately without waiting for max_latency to improve feel.
                                if buffer.is_empty()
                                    && data.len() < 128
                                    && now.duration_since(last_emit) >= min_latency
                                {
                                    let event_name = pty_output_event(&session_id);
                                    if window.emit(&event_name, &data).is_err() {
                                        break;
                                    }
                                    last_emit = std::time::Instant::now();
                                    continue;
                                }

                                buffer.extend_from_slice(&data);

                                // Flush if buffer full
                                if buffer.len() >= max_buffer_size {
                                    let event_name = pty_output_event(&session_id);
                                    if window.emit(&event_name, &buffer).is_err() {
                                        break;
                                    }
                                    buffer.clear();
                                    last_emit = std::time::Instant::now();
                                }
                            }
                            Err(mpsc::RecvTimeoutError::Timeout) => {
                                // Flush on timeout if we have data
                                if !buffer.is_empty() {
                                    let event_name = pty_output_event(&session_id);
                                    if window.emit(&event_name, &buffer).is_err() {
                                        break;
                                    }
                                    buffer.clear();
                                    last_emit = std::time::Instant::now();
                                }
                            }
                            Err(mpsc::RecvTimeoutError::Disconnected) => break,
                        }
                    }

                    // Flush remaining data
                    if !buffer.is_empty() {
                        let event_name = pty_output_event(&session_id);
                        let _ = window.emit(&event_name, &buffer);
                    }

                    // Cleanup threads and maps
                    let _ = reader_thread.join();

                    {
                        let mut map = sessions_map.lock().unwrap();
                        map.remove(&session_id);
                    }
                    {
                        let mut wins = window_map.lock().unwrap();
                        if let Some(ids) = wins.get_mut(&window_label) {
                            if let Some(idx) = ids.iter().position(|x| x == &session_id) {
                                ids.remove(idx);
                            }
                        }
                    }
                });
                Ok(())
            } else {
                // If reader is taken, session is already running or being restored from existing state
                Ok(())
            }
        } else {
            Err(format!("Session not found: {}", id))
        }
    }

    pub fn write(&self, id: &str, data: &str) -> Result<(), String> {
        let session_arc = {
            let sessions = self.sessions.lock().unwrap();
            sessions.get(id).cloned()
        };

        if let Some(session_mutex) = session_arc {
            let mut session = session_mutex.lock().unwrap();
            session
                .writer
                .write_all(data.as_bytes())
                .map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err(format!("Session not found: {}", id))
        }
    }

    pub fn resize(&self, id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let session_arc = {
            let sessions = self.sessions.lock().unwrap();
            sessions.get(id).cloned()
        };

        if let Some(session_mutex) = session_arc {
            let session = session_mutex.lock().unwrap();
            session
                .master
                .resize(PtySize {
                    rows,
                    cols,
                    pixel_width: 0,
                    pixel_height: 0,
                })
                .map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err(format!("Session not found: {}", id))
        }
    }

    pub fn kill(&self, id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().unwrap();
        // The Drop impl of Session handles killing the child process
        if sessions.remove(id).is_some() {
            Ok(())
        } else {
            Err(format!("Session not found: {}", id))
        }
    }

    pub fn kill_all(&self) -> Result<(), String> {
        let mut sessions = self.sessions.lock().unwrap();
        sessions.clear();
        let mut wins = self.window_map.lock().unwrap();
        wins.clear();
        Ok(())
    }

    // Sync: Kill any session belonging to this window that is NOT in the active_ids list
    // This allows the frontend to say "I only know about sessions A, B, C".
    // If Rust has session D for this window, it means D is an orphan (tab closed or FE restart).
    pub fn sync(&self, window_label: &str, active_ids: Vec<String>) -> Result<(), String> {
        let mut wins = self.window_map.lock().unwrap();
        let mut sessions = self.sessions.lock().unwrap();

        if let Some(owned_ids) = wins.get_mut(window_label) {
            // Identify orphans
            let orphans: Vec<String> = owned_ids
                .iter()
                .filter(|id| !active_ids.contains(id))
                .cloned()
                .collect();

            for orphan_id in orphans {
                sessions.remove(&orphan_id); // Drop triggers kill
                                             // Remove from owned list
                if let Some(idx) = owned_ids.iter().position(|x| x == &orphan_id) {
                    owned_ids.remove(idx);
                }
            }
        }
        Ok(())
    }
}

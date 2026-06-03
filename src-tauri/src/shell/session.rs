use portable_pty::{Child, MasterPty};
use std::io::{Read, Write};

pub struct Session {
    pub master: Box<dyn MasterPty + Send>,
    pub child: Box<dyn Child + Send>,
    pub writer: Box<dyn Write + Send>,
    pub reader: Option<Box<dyn Read + Send>>, // Stored here until start_pty is called
}

impl Drop for Session {
    fn drop(&mut self) {
        #[cfg(target_os = "windows")]
        {
            if let Some(pid) = self.child.process_id() {
                // Force kill the process tree on Windows to clean up child processes (e.g. node, python)
                let _ = std::process::Command::new("taskkill")
                    .args(["/F", "/T", "/PID", &pid.to_string()])
                    .output();
            }
        }

        // Ensure the immediate child process is killed
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}


pub const PTY_OUTPUT: &str = "pty-output";

pub fn pty_output_event(id: &str) -> String {
    format!("{}:{}", PTY_OUTPUT, id)
}

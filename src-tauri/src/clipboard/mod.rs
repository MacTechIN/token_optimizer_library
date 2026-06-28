use arboard::Clipboard;

/// Writes the given text to the OS clipboard.
pub fn write_to_clipboard(text: &str) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_text(text.to_owned()).map_err(|e| e.to_string())?;
    Ok(())
}

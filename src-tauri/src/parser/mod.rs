pub mod pdf;
pub mod docx;

use std::fs::File;
use std::io::Read;
use std::path::Path;

/// Helper function to read plain text files.
fn read_txt_file(path: &str) -> Result<String, String> {
    let mut file = File::open(path).map_err(|e| e.to_string())?;
    let mut content = String::new();
    file.read_to_string(&mut content).map_err(|e| e.to_string())?;
    Ok(content)
}

/// Routes the file path to the appropriate parser based on extension.
pub fn parse_file(path: &str) -> Result<String, String> {
    let path_ref = Path::new(path);
    let extension = path_ref
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_lowercase())
        .ok_or_else(|| "No file extension found".to_string())?;

    match extension.as_str() {
        "pdf" => pdf::extract_pdf(path),
        "docx" => docx::extract_docx(path),
        "txt" => read_txt_file(path),
        _ => Err(format!("Unsupported file extension: .{}", extension)),
    }
}

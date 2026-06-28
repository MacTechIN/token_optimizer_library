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

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_parse_txt_file() {
        let temp_dir = std::env::temp_dir();
        let temp_file_path = temp_dir.join("test_file_parser.txt");
        let temp_file_str = temp_file_path.to_string_lossy().to_string();

        // Write sample data
        let mut file = File::create(&temp_file_path).unwrap();
        file.write_all(b"Hello from test parser text file!").unwrap();

        // Test parser
        let parsed = parse_file(&temp_file_str);
        assert!(parsed.is_ok());
        assert_eq!(parsed.unwrap(), "Hello from test parser text file!");

        // Cleanup
        let _ = std::fs::remove_file(temp_file_path);
    }

    #[test]
    fn test_parse_invalid_extension() {
        let parsed = parse_file("nonexistent.xyz");
        assert!(parsed.is_err());
        assert!(parsed.unwrap_err().contains("Unsupported file extension"));
    }
}

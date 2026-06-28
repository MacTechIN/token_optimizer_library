/// Stub for macOS Vision OCR.
pub async fn extract_ocr_macos(_path: &str) -> Result<String, String> {
    Err("macOS Vision OCR is not yet implemented in this build.".to_string())
}

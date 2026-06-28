#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos;

use std::path::Path;

/// Routes the image path to the OS-native OCR engine.
pub async fn ocr_image(path: &str) -> Result<String, String> {
    let path_ref = Path::new(path);
    let extension = path_ref
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_lowercase())
        .ok_or_else(|| "No file extension found".to_string())?;

    match extension.as_str() {
        "png" | "jpg" | "jpeg" | "bmp" => {
            #[cfg(target_os = "windows")]
            {
                windows::extract_ocr_windows(path)
            }
            #[cfg(target_os = "macos")]
            {
                macos::extract_ocr_macos(path).await
            }
            #[cfg(not(any(target_os = "windows", target_os = "macos")))]
            {
                let _ = path;
                Err("OCR is only supported on Windows and macOS.".to_string())
            }
        }
        _ => Err(format!("Unsupported image format: .{}", extension)),
    }
}

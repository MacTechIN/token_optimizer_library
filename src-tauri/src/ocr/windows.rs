use windows::core::HSTRING;
use windows::Graphics::Imaging::BitmapDecoder;
use windows::Media::Ocr::OcrEngine;
use windows::Storage::{FileAccessMode, StorageFile};

/// Performs OCR on an image file using the Windows WinRT OCR API.
pub fn extract_ocr_windows(path: &str) -> Result<String, String> {
    // 1. Get canonical absolute path and strip Windows UNC prefix if present
    let path_buf = std::fs::canonicalize(path).map_err(|e| e.to_string())?;
    let mut absolute_path = path_buf.to_string_lossy().to_string();
    if absolute_path.starts_with(r"\\?\") {
        absolute_path = absolute_path.replace(r"\\?\", "");
    }
    
    // 2. Perform WinRT OCR synchronously using `.get()`
    let run_ocr = || {
        let hstring_path = HSTRING::from(&absolute_path);
        let storage_file = StorageFile::GetFileFromPathAsync(&hstring_path)?.get()?;
        let stream = storage_file.OpenAsync(FileAccessMode::Read)?.get()?;
        let decoder = BitmapDecoder::CreateAsync(&stream)?.get()?;
        let bitmap = decoder.GetSoftwareBitmapAsync()?.get()?;
        
        let engine = OcrEngine::TryCreateFromUserProfileLanguages()?;
        let result = engine.RecognizeAsync(&bitmap)?.get()?;
        
        let mut text = String::new();
        let lines = result.Lines()?;
        let size = lines.Size()?;
        for i in 0..size {
            let line = lines.GetAt(i)?;
            text.push_str(&line.Text()?.to_string());
            text.push('\n');
        }
        Ok::<String, windows::core::Error>(text)
    };

    run_ocr().map_err(|e| e.to_string())
}

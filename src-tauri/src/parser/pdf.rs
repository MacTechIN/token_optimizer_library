use lopdf::Document;

/// Extracts all text content from a PDF file using lopdf.
pub fn extract_pdf(path: &str) -> Result<String, String> {
    let doc = Document::load(path).map_err(|e| e.to_string())?;
    let pages = doc.get_pages();
    let page_numbers: Vec<u32> = (1..=pages.len() as u32).collect();
    let mut text_content = String::new();
    
    for page_num in page_numbers {
        if let Ok(text) = doc.extract_text(&[page_num]) {
            text_content.push_str(&text);
            text_content.push('\n');
        }
    }
    
    Ok(text_content)
}

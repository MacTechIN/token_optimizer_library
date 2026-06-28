use docx_rs::{read_docx, DocumentChild, ParagraphChild, RunChild};
use std::fs::File;
use std::io::Read;

/// Helper function to extract text from a run's children.
fn extract_run_text(run_children: &[RunChild]) -> String {
    let mut run_text = String::new();
    for child in run_children {
        if let RunChild::Text(t) = child {
            run_text.push_str(&t.text);
        }
    }
    run_text
}

/// Extracts all text content from a DOCX (Word) file using docx-rs.
pub fn extract_docx(path: &str) -> Result<String, String> {
    let mut file = File::open(path).map_err(|e| e.to_string())?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf).map_err(|e| e.to_string())?;
    
    let docx = read_docx(&buf).map_err(|e| e.to_string())?;
    let mut text_content = String::new();
    
    for child in &docx.document.children {
        if let DocumentChild::Paragraph(p) = child {
            for p_child in &p.children {
                if let ParagraphChild::Run(r) = p_child {
                    text_content.push_str(&extract_run_text(&r.children));
                }
            }
            text_content.push('\n');
        }
    }
    
    Ok(text_content)
}

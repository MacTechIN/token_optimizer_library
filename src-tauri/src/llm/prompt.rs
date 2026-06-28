use regex::Regex;

/// Collapses redundant whitespaces and newlines to optimize token count.
pub fn clean_text(raw: &str) -> String {
    // 1. Remove trailing spaces on each line
    let mut cleaned: String = raw
        .lines()
        .map(|line| line.trim_end())
        .collect::<Vec<&str>>()
        .join("\n");

    // 2. Collapse consecutive empty lines (3+ lines into max 2 lines)
    if let Ok(re_newlines) = Regex::new(r"\n{3,}") {
        cleaned = re_newlines.replace_all(&cleaned, "\n\n").to_string();
    }

    // 3. Collapse multiple consecutive spaces or tabs into a single space
    if let Ok(re_spaces) = Regex::new(r"[ \t]{2,}") {
        cleaned = re_spaces.replace_all(&cleaned, " ").to_string();
    }

    cleaned.trim().to_string()
}

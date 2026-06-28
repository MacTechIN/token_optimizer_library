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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clean_text_spaces() {
        let input = "hello    world\t\tinfo";
        let expected = "hello world info";
        assert_eq!(clean_text(input), expected);
    }

    #[test]
    fn test_clean_text_newlines() {
        let input = "line1\n\n\n\nline2\n\nline3";
        let expected = "line1\n\nline2\n\nline3";
        assert_eq!(clean_text(input), expected);
    }

    #[test]
    fn test_clean_text_trim() {
        let input = "  hello world  \n  test  ";
        let expected = "hello world\n test";
        assert_eq!(clean_text(input), expected);
    }
}

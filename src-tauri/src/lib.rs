mod clipboard;
mod ocr;
mod parser;
mod llm;
mod cmd;

use tauri::Manager;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, Modifiers, Code, ShortcutState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // 1. Register Alt+Space shortcut to toggle window
            let shortcut = Shortcut::new(Some(Modifiers::ALT), Code::Space);
            let _ = app.global_shortcut().on_shortcut(shortcut, move |app_handle, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let is_visible = window.is_visible().unwrap_or(false);
                        if is_visible {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
            });

            // 2. Hide window when focus is lost (blur)
            if let Some(window) = app.get_webview_window("main") {
                let w_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(focused) = event {
                        if !*focused {
                            let _ = w_clone.hide();
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![cmd::process_input_cmd])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

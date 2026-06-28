# Prompt-Clip 코드 구현 계획서 및 시스템 아키텍처

## 1. 프로젝트 구조 설명 (Project Structure)
본 프로젝트는 시스템 리소스 점유를 최소화하면서 강력한 백그라운드 프로세싱을 수행하기 위해 **Tauri (Rust) + Next.js (React) + Python (Sidecar)** 아키텍처를 채택했습니다. 
* **프론트엔드 (Next.js):** 사용자 입력을 받는 투명/팝업 UI 레이어입니다.
* **백엔드 코어 (Tauri/Rust):** OS 레벨의 글로벌 단축키 제어, 창 전환, 시스템 클립보드 접근 및 프로세스 관리를 담당합니다.
* **데이터 프로세싱 (Python Sidecar):** AI 프롬프트 엔지니어링의 핵심인 텍스트 정제, 다중 파일(OCR, PDF 파싱) 처리 및 LLM API 통신을 수행합니다.

## 2. 디렉토리 구조 (Directory Structure)
```text
prompt-clip/
├── package.json               # 프론트엔드 의존성 관리
├── tauri.conf.json            # Tauri 앱 설정 (창 투명도, Sidecar 바이너리 매핑)
├── src/                       # [Frontend] Next.js (React)
│   ├── app/
│   │   ├── page.tsx           # 메인 UI 컴포넌트 (검색창 형태)
│   │   └── globals.css        # Tailwind 스타일 및 투명 배경 처리
│   └── lib/
│       └── tauri_ipc.ts       # Tauri Rust Core 통신 인터페이스
├── src-tauri/                 # [Backend Core] Rust
│   ├── Cargo.toml             # Rust 의존성 관리
│   └── src/
│       ├── main.rs            # 앱 엔트리 포인트, 글로벌 단축키 바인딩
│       └── cmd.rs             # IPC 명령어 처리 및 파이썬 Sidecar 호출 로직
└── sidecar-python/            # [Data Processing] Python
    ├── requirements.txt       # PyMuPDF, python-docx, openai 등 의존성
    ├── parser.py              # 파일 포맷별(PDF, DOCX, IMG) 텍스트 추출 모듈
    └── llm_optimizer.py       # 텍스트 압축 및 영문 프롬프트 최적화 모듈
```

## 3. 파일명 및 Function 별 기능 명세
### 3.1. `src/app/page.tsx` (프론트엔드 UI)
* **`handleDrop(event: DragEvent) -> void`**
  * **Input:** `DragEvent` (사용자가 드롭한 파일 객체)
  * **Output:** `void` (내부 상태 업데이트)
  * **기능:** 드롭된 파일의 로컬 경로(Path)를 추출하고 로딩 상태(Spinner)를 활성화합니다.
* **`submitInput(text: string, filePath: string | null) -> Promise<void>`**
  * **Input:** `text` (사용자 직접 입력 텍스트), `filePath` (드롭된 파일 경로, 없을 시 null)
  * **Output:** 비동기 완료 처리
  * **기능:** Tauri IPC API인 `process_input_cmd`를 호출하여 데이터를 Rust 코어로 전송합니다.

### 3.2. `src-tauri/src/main.rs` & `cmd.rs` (Rust 코어)
* **`setup_shortcuts(app: &mut App) -> Result<(), Box<dyn Error>>`**
  * **기능:** `Alt+Space` 단축키를 등록하고, 감지 시 `window.toggle()`을 수행합니다.
* **`process_input_cmd(app: AppHandle, text: String, file_path: Option<String>) -> Result<String, String>`**
  * **기능:** Python Sidecar 프로세스를 Spawn하여 인자를 넘기고, 반환받은 텍스트를 `tauri::clipboard`를 이용해 OS 클립보드에 자동 복사합니다.

### 3.3. `sidecar-python/parser.py` (파일 파서)
* **`extract_content(file_path: str) -> str`**
  * **기능:** 확장자를 판별하여 `.pdf`는 `PyMuPDF`, `.docx`는 `python-docx`를 사용하여 텍스트를 추출합니다.

### 3.4. `sidecar-python/llm_optimizer.py` (LLM 최적화 모듈)
* **`optimize_to_prompt(raw_text: str, is_image: bool) -> str`**
  * **기능:** OpenAI(또는 Claude) API를 호출하여 시스템 프롬프트 기반으로 텍스트를 압축합니다.

## 4. 실전 구현을 위한 주요 코드 (Practical Projects with Complete Code)

### [Rust IPC 커맨드 핸들러 리마크 (`cmd.rs`)]
```rust
#[tauri::command]
pub fn process_input_cmd(app: tauri::AppHandle, text: String, file_path: Option<String>) -> Result<String, String> {
    // [변수명] sidecar_command: Tauri 설정에 매핑된 파이썬 실행 파일 명령 객체
    let mut sidecar_command = tauri::api::process::Command::new_sidecar("python-sidecar")
        .map_err(|e| e.to_string())?;
    
    // 파일 경로가 존재하면 파이썬 스크립트의 인자로 추가
    if let Some(path) = file_path {
        sidecar_command = sidecar_command.args(vec!["--file", &path]);
    } else {
        sidecar_command = sidecar_command.args(vec!["--text", &text]);
    }

    let (mut rx, mut _child) = sidecar_command.spawn().map_err(|e| e.to_string())?;
    
    // [변수명] optimized_result: 파이썬으로부터 반환된 최종 영문 텍스트
    let mut optimized_result = String::new();
    while let Some(event) = tauri::async_runtime::block_on(rx.recv()) {
        if let tauri::api::process::CommandEvent::Stdout(line) = event {
            optimized_result.push_str(&line);
        }
    }

    // 클립보드 자동 복사 수행
    app.clipboard_manager().clipboard.write_text(optimized_result.clone()).unwrap();
    Ok(optimized_result)
}
```

### [Python LLM 최적화 리마크 (`llm_optimizer.py`)]
```python
import openai
import os

# [변수명] SYSTEM_INSTRUCTION: LLM에게 부여하는 페르소나 및 압축/번역 규칙
SYSTEM_INSTRUCTION = (
    "You are an AI prompt optimizer. Convert the provided text or document content "
    "into a highly concise, token-efficient English prompt. Remove all filler words, "
    "greetings, and redundant metadata. Output ONLY the optimized prompt."
)

def optimize_to_prompt(raw_text: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    client = openai.OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": raw_text}
        ],
        temperature=0.1
    )
    
    # [변수명] optimized_prompt: LLM이 응답한 최종 텍스트
    optimized_prompt = response.choices[0].message.content.strip()
    return optimized_prompt
```

## 5. 성능 최적화 전략 (Performance optimization strategies)
1. **파이썬 콜드 스타트(Cold Start) 완화:** 파이썬 Sidecar를 백그라운드 데몬(Daemon) 모드나 로컬 REST API(FastAPI)로 띄워두고, Rust에서 HTTP 통신으로 주고받는 방식으로 전환.
2. **동적 프롬프트 청킹(Dynamic Chunking):** 입력된 PDF가 수십 장에 달할 경우 `tiktoken`을 활용해 모델의 입력 토큰 한계에 맞춰 문단을 분할(Chunking)하고 병합(Map-Reduce)하는 로직 적용.

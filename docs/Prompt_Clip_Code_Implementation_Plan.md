# Prompt-Clip 상세 구현 계획서

## 1. 개요 및 마이크로 프로세스 설계
본 문서는 Tauri(Rust)와 Next.js(React) 그리고 파이썬 백그라운드 프로세스를 결합하여 로컬 리소스 소모를 극소화하고 프롬프트 토큰을 절감하는 실시간 위젯 `Prompt-Clip`의 단계별 마이크로 프로세스 구현 계획을 다룹니다.

## 2. 세부 태스크 설계 (Micro-processes)

### Phase 1. 개발 환경 구성 및 프로젝트 초기화
* **Task 1.1: Node.js 프로젝트 설정 및 Tauri 초기화**
  * `create-tauri-app`을 활용하여 React + Tailwind CSS 템벌릿으로 프로젝트를 생성합니다.
  * `src-tauri` 폴더 내부의 `Cargo.toml`에 `tauri-plugin-global-shortcut` 의존성을 추가합니다.
* **Task 1.2: Tauri 윈도우 스타일 조정 (`tauri.conf.json`)**
  * 창의 장식(titlebar 등)을 없애고 투명 배경을 지원하도록 다음과 같이 설정을 변경합니다:
    ```json
    "windows": [
      {
        "title": "Prompt-Clip",
        "width": 600,
        "height": 70,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "center": true
      }
    ]
    ```

### Phase 2. UI 개발 (Spotlight Style)
* **Task 2.1: Frameless 투명 입력창 디자인 (`src/app/page.tsx`)**
  * 모서리가 둥글고(`rounded-2xl`) 반투명한 블러 배경(`backdrop-blur-md bg-black/50`)을 가진 단일 검색창 형태의 UI를 제작합니다.
* **Task 2.2: 드래그 앤 드롭 파일 수신기 구현**
  * HTML5 Drag and Drop API를 사용하여 PDF, Word, Image 파일이 드롭되었을 때 파일의 절대 경로를 획득할 수 있도록 바인딩합니다.
* **Task 2.3: 단축 키 제어 핸들러 추가**
  * `Esc` 키 입력 시 즉시 입력창 비활성화 및 창 숨김 명령어 전송.
  * `Tab` 키 입력 시 프롬프트 목적 프리셋 변경 (기본 요약 $\rightarrow$ 코드 리뷰 $\rightarrow$ 영작 최적화).

### Phase 3. Rust Backend 핵심 모듈 작성
* **Task 3.1: 글로벌 핫키 등록 및 포커스 잃을 시 자동 숨김 (`main.rs`)**
  * `Alt+Space` 단축키를 등록하고 이벤트 핸들러를 정의합니다.
  * 창의 `blur` 이벤트를 감지하여 사용자가 다른 창을 클릭하거나 포커스를 잃으면 즉시 `window.hide()`를 호출하도록 작성합니다.
* **Task 3.2: 파이썬 프로세스 호출 및 클립보드 복사 (`cmd.rs`)**
  * `tauri::command`인 `process_input_cmd`를 정의하여 프론트엔드의 요청을 파이썬 Sidecar로 안전하게 바이패스합니다.
  * 파이썬 프로세스로부터 리턴받은 텍스트를 `tauri::api::clipboard`로 전달해 OS 클립보드에 라이팅합니다.

### Phase 4. Python Sidecar 개발
* **Task 4.1: 파서 모듈 (`parser.py`)**
  * `PyMuPDF`를 사용하여 PDF 파일로부터 순수 텍스트를 추출하고, 헤더/푸터 및 개행 문자를 1차 정제합니다.
  * `python-docx`를 활용하여 Word 문서의 XML 요소를 분석해 서식 정보를 생략한 텍스트 덩어리를 추출합니다.
* **Task 4.2: OpenAI API 통신 및 토큰 최적화 (`llm_optimizer.py`)**
  * 추출된 텍스트를 감지하여 영어로 요약 번역을 요청하는 LLM 호출 인터페이스를 개발합니다.
  * OpenAI `gpt-4o-mini` 모델의 저렴하고 빠른 속도를 활용하며, 정제되지 않은 문자열의 토큰 낭비를 차단하도록 프롬프트를 구성합니다.

### Phase 5. 패키징 및 최종 검증
* **Task 5.1: 파이썬 Sidecar 빌드**
  * PyInstaller를 활용하여 로컬 파이썬 인터프리터 없이도 작동 가능한 독립 바이너리 파일로 빌드하고, 이를 `src-tauri/bin/` 디렉토리에 배치합니다.
* **Task 5.2: 통합 릴리즈 빌드 (`npm run tauri build`)**
  * 개발자 인증서 서명 제외 설정을 켜고 Windows Installer (`.msi`) 형식의 설치 프로그램 패키징을 완료합니다.

---

## 3. 핵심 모듈별 완전한 코드 구조 예시

### [PDF 텍스트 추출 모듈 (`sidecar-python/parser.py`)]
```python
import sys
import os
import fitz  # PyMuPDF
import docx

def parse_pdf(file_path: str) -> str:
    # [변수명] doc: 열려 있는 PDF 문서 객체
    doc = fitz.open(file_path)
    text_content = []
    for page in doc:
        text_content.append(page.get_text())
    return "\n".join(text_content)

def parse_docx(file_path: str) -> str:
    # [변수명] doc: 열려 있는 Word 문서 객체
    doc = docx.Document(file_path)
    text_content = [p.text for p in doc.paragraphs]
    return "\n".join(text_content)

if __name__ == "__main__":
    # 인자로 받은 파일 경로를 파싱하여 표준 출력으로 반환
    if len(sys.argv) > 2 and sys.argv[1] == "--file":
        target_path = sys.argv[2]
        ext = os.path.splitext(target_path)[-1].lower()
        if ext == ".pdf":
            print(parse_pdf(target_path))
        elif ext == ".docx":
            print(parse_docx(target_path))
        else:
            with open(target_path, "r", encoding="utf-8") as f:
                print(f.read())
```

## 4. 성능 최적화 가이드라인 (Performance guidelines)
* **메모리 절약:** 파이썬 데몬 프로세스의 수동 가비지 컬렉션(`gc.collect()`) 주기적 트리거를 통해 대량 문서 파싱 후 메모리 해제 보장.
* **비동기 스레드 풀 적용:** Rust 백엔드에서 파이썬 프로세스를 차단(blocking) 방식으로 대기하지 않고 비동기 `tokio::process::Command`를 사용하여 UI 블로킹 현상을 완벽히 차단.

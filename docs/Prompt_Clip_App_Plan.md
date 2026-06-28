# 📄 [앱 기획서] Prompt-Clip (프롬프트 클립)

## 1. 프로젝트 개요
* **앱 명칭 (가칭):** Prompt-Clip
* **목적:** 텍스트, 문서(Word, PDF), 이미지 등 다양한 포맷의 자료를 입력받아, LLM이 이해하기 쉬운 **최적화된 영문 텍스트(토큰 최소화)로 압축/변환**하여 클립보드에 자동 복사하는 Windows 유틸리티.
* **타겟 UX:** 무거운 네이티브 앱이 아닌, 화면 모서리에 상주하는 위젯 형태. 단축키나 클릭 시 화면 중앙(또는 지정 위치)에 Spotlight 형태의 심플한 입력창으로 팝업.

## 2. 개념적 배경 및 이론 (Conceptual Background & Theory)
LLM API 호출 시 토큰 비용은 텍스트의 길이와 직결되며, 한글은 영문 대비 동일 의미 전달 시 토큰 소모량이 더 큽니다. 다중 파일(PDF, DOCX) 입력 시 구조적 메타데이터를 제거하고 핵심 텍스트만 추출하는 OCR 및 파싱 과정이 필수적입니다. 본 앱은 '입력 -> 멀티모달 파싱 -> LLM 최적화 요약/번역(영문) -> 클립보드 복사'의 전체 파이프라인을 백그라운드에서 자동화하여 생산성을 극대화하는 것을 이론적 배경으로 설계되었습니다.

## 3. 핵심 기능 (Core Features)
1. **플로팅 위젯 & Spotlight UI:** 
   * 평소에는 반투명한 작은 아이콘/위젯 형태로 화면 최상단(Always-on-top)에 대기.
   * 글로벌 단축키(예: `Alt + Space` 또는 `Ctrl + Shift + P`) 입력 시 검색창 형태의 UI로 확장.
2. **멀티모달 Drag & Drop 입력:**
   * 텍스트 붙여넣기 기능.
   * 파일 드래그 앤 드롭 지원 (PDF, DOCX, TXT).
   * 이미지 클립보드 붙여넣기 및 파일 드롭 (PNG, JPG).
3. **토큰 최적화 및 영문 변환 (AI 파이프라인):**
   * 입력된 자료에서 텍스트를 추출 (OCR 및 문서 파싱).
   * LLM API(OpenAI 또는 Claude)를 호출하여 불필요한 서술어를 제거하고, 핵심 지시어 위주의 영문 프롬프트로 압축 번역.
4. **오토 클립보드 & 알림 (Auto-Copy & Notify):**
   * 변환이 완료되면 즉시 OS 클립보드에 텍스트 복사.
   * 우측 하단 Windows 토스트 알림(Toast Notification)으로 완료 및 절약된 토큰 수 안내.

## 4. 기술 스택 (Tech Stack)
| 구분 | 기술 스택 | 선정 이유 |
| :--- | :--- | :--- |
| **Frontend (UI/UX)** | Tauri + Next.js (React) + Tailwind CSS | Electron 대비 빌드 용량과 RAM 사용량이 압도적으로 적음. Spotlight 형태의 Frameless Window 구현 용이. |
| **Backend (OS 통합)** | Rust (Tauri Core) | 글로벌 단축키 바인딩, 클립보드 제어, 시스템 트레이 및 Always-on-top 창 제어. |
| **Data Processing** | Python (FastAPI 또는 독립 스크립트) | `PyMuPDF`(PDF), `python-docx`(Word) 등 문서 파싱 라이브러리 생태계가 가장 강력함. |
| **AI / OCR API** | OpenAI API (gpt-4o-mini) 또는 Anthropic Claude 3.5 Haiku | 빠르고 저렴한 토큰 비용. 이미지(Vision) 처리와 텍스트 압축 번역을 동시에 수행하기에 최적. |

## 5. 단계별 구현 가이드 (Step-by-Step Implementation Guides)
1. **Tauri & Next.js (UI 및 Frameless Window 구성):** Tauri의 `tauri.conf.json`에서 `decorations: false`, `transparent: true`, `alwaysOnTop: true`로 설정하여 OS 기본 창 테두리를 없앱니다. Next.js와 Tailwind를 사용해 둥근 모서리의 심플한 검색창 UI를 디자인합니다.
2. **Rust (글로벌 단축키 및 창 토글 로직 구현):** Tauri의 `global-shortcut` 플러그인을 사용하여 특정 단축키(예: `Alt + Space`)를 등록합니다. 단축키 입력 시 창을 `show()` 하고 포커스를 맞추며, 외부 영역 클릭 시 `hide()` 되도록 이벤트를 바인딩합니다.
3. **Python (멀티모달 파일 파서 모듈 개발):** Next.js에서 파일이 드롭되면 로컬 Python 프로세스(또는 백그라운드 FastAPI 서버)로 파일 경로를 넘깁니다. 
4. **LLM API 연동 (프롬프트 최적화 파이프라인 구축):** 추출된 텍스트/이미지를 LLM에 전송합니다. 이때 시스템 프롬프트가 매우 중요합니다.
5. **Rust / JavaScript (클립보드 자동 복사 및 OS 알림):** Python 모듈에서 최적화된 영문 텍스트를 반환하면, Tauri의 `clipboard` API를 통해 시스템 클립보드에 복사(`writeText`)합니다. 

## 6. 향후 확장 아이디어 (Ideas for further exploration)
* **로컬 SLM 연동:** 민감한 보안 문서나 사내 기밀이 포함된 PDF의 경우 외부 API로 보낼 수 없으므로, 로컬에서 구동되는 가벼운 모델(예: Llama 3 8B, Phi-3)과 연동하는 '오프라인 보안 모드'를 추가할 수 있습니다.
* **프롬프트 템플릿 프리셋:** 위젯에서 탭(Tab) 키를 눌러 "코드 리뷰 모드", "기획서 초안 모드", "버그 수정 모드" 등 변환될 프롬프트의 목적을 사전 지정하는 기능을 추가.

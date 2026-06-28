# Prompt-Clip (프롬프트 클립) 개발 계획서

## 1. 프로젝트 개요
* **앱 명칭:** Prompt-Clip
* **주요 목표:** 문서(Word, PDF), 이미지, 일반 텍스트를 입력받아 LLM 토큰을 절약하는 최적화된 영문 프롬프트로 변환하여 클립보드에 자동 복사하는 경량 유틸리티 개발.
* **UX 지향:** Spotlight/Raycast와 같은 글로벌 단축키 기반의 Frameless UI.

## 2. 개념적 배경 및 이론 (Conceptual Background & Theory)
LLM API 호출 시 토큰 비용은 텍스트의 길이와 직결되며, 한글의 영문 대비 비효율적인 토큰 구조 해결이 중요합니다. 다중 파일(PDF, DOCX) 입력 시 구조적 메타데이터를 제거하고 핵심 텍스트만 추출하는 OCR 및 파싱 과정이 필수적입니다. 데이터 프로세싱 파이프라인의 속도와 경량화를 고려하여 로컬 CPU를 소모하지 않는 네이티브 OCR(WinRT OCR, Vision OCR) 및 Rust 기반 파싱 로직을 백그라운드로 작동하도록 설계하였습니다.

## 3. 개발 기술 스택
* **Frontend:** Next.js, Tailwind CSS (직관적이고 미려한 유리 질감 UI 구현)
* **Backend (Core App):** Tauri (Rust) (네이티브 OS 핫키 제어, 메모리 최소화)
* **Data Processing:** Python (강력한 문서 파싱 형태소 및 LLM API 통신 서브프로세스)
* **AI 연동:** OpenAI API (gpt-4o-mini) 또는 Anthropic API

## 4. 설계 및 구현 가이드 (Step-by-step Implementation Guide)
1. **환경 셋업 및 초기화:** Tauri 앱을 구성하고 Next.js 프론트엔드 연동.
2. **OS 시스템 핫키 연동:** `Alt+Space` 단축키 바인딩 및 창 토글 구현.
3. **윈도우 창 제어:** 포커스 잃을 시 (`blur`) 화면에서 자동 숨김 설정.
4. **문서 파서 구현:** PDF(`fitz`) 및 Word(`docx`) 파일 텍스트 추출 모듈 개발.
5. **텍스트 압축 엔진 연동:** 불필요한 메타데이터 제거 및 LLM 압축 호출.
6. **클립보드 오토 복사:** 압축 완료된 결과물을 OS 클립보드에 복사.

## 5. 핵심 모듈별 완전한 코드 구조 예시

### [Tauri 단축키 및 라이프사이클 관리 (`main.rs`)]
```rust
use tauri::{Manager, SystemTray, SystemTrayMenu};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            
            // 글로벌 단축키 Alt+Space 바인딩
            let mut shortcut_manager = app.global_shortcut_manager();
            shortcut_manager.register("Alt+Space", move || {
                if window.is_visible().unwrap() {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }).unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## 6. 성능 최적화 전략 (Performance Optimization Strategies)
* **사이드카(Sidecar) 패턴 활용:** 파이썬 환경을 내장하여 무거운 가상환경을 지속적으로 띄우지 않고, 빌드된 파이썬 실행 파일을 필요시 호출하여 메모리 상주를 최소화합니다.
* **청크(Chunk) 단위 병렬 처리:** 초고용량 PDF 문서 처리 시 `tiktoken`을 사용하여 모델의 입력 토큰 한도를 체크하며 병렬 가속.
* **이미지 압축 전처리:** 이미지를 드래그 앤 드롭 시 해상도를 자동으로 리사이징하여 Vision API의 토큰 비용과 지연시간을 대폭 감소시킵니다.

## 7. 향후 확장 아이디어 (Ideas for Further Exploration)
* **오프라인 SLM 지원:** 외부 API 사용이 제한적인 환경을 위해 로컬 Ollama 모델(Llama 3, Phi-3 등)과 연동하는 보안 모드 추가.
* **개인 클라우드 동기화:** 변환 내역 히스토리와 자주 쓰는 커스텀 템플릿을 개인 서버(Nextcloud 등)에 백업하여 멀티 기기 동기화 지원.
* **컨텍스트 템플릿 선택:** 팝업 상태에서 Tab 키를 통해 "코드 리뷰용", "영작용", "요약용" 등 목적에 맞는 사전 정의 시스템 프롬프트 전환.
```

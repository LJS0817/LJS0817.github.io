<div align="center">
  
# 🚀 LJS0817 Portfolio

**순수 Vanilla 기술(HTML, CSS, JS)로 구현한 인터랙티브 프론트엔드 웹 포트폴리오**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Glossary/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

</div>

---

## 📌 Overview
이 저장소는 그동안 진행했던 다양한 형태의 프로젝트(Unity, Flutter, Web 등)를 한눈에 볼 수 있도록 구성한 **개인 포트폴리오 웹사이트**입니다.
복잡한 프레임워크나 외부 라이브러리(React, Vue 등)에 의존하지 않고, **순수 웹 기술(Vanilla JS, HTML, CSS)**만을 사용하여 브라우저 성능을 최적화하고 세밀한 애니메이션을 구현하는 데 집중했습니다.

🌐 **Live Demo:** [https://LJS0817.github.io](https://LJS0817.github.io)

---

## ✨ Design & Features
- **Glassmorphism UI:** 반투명한 유리 질감의 디자인(Glassmorphism)을 적용하여 세련되고 현대적인 룩앤필(Look & Feel)을 제공합니다.
- **Responsive Layout:** 모바일 기기(하단 Dock 네비게이션)부터 데스크탑(사이드바)까지 완벽하게 대응하는 반응형 그리드 시스템을 구축했습니다.
- **Scroll Spy & Navigation:** 사용자의 스크롤 위치를 감지하여 네비게이션 바의 활성 상태를 동적으로 업데이트합니다.
- **Accordion Animation:** 프로젝트 상세 정보(Detail)를 부드럽게 펼치고 접을 수 있는 아코디언 애니메이션을 CSS Grid 속성(`grid-template-rows: 0fr -> 1fr`)을 활용해 구현했습니다.
- **Static Hosting:** 정적 파일 기반으로 개발되어 GitHub Pages를 통해 빠르고 가볍게 배포되었습니다.

---

## 📂 Projects Showcase

### 1. Unity Project
- **Boss Rush Game:** 객체 풀링(Object Pooling)을 통한 가비지 컬렉션 최적화 및 커스텀 HLSL 셰이더를 작성한 모바일 60FPS 액션 게임 프로젝트.

### 2. Flutter Projects
- **Card Usage Tracker:** `sqflite`를 사용한 관계형 로컬 데이터베이스 기반 카드 결제 내역 관리 앱. 
- **Public Data Weather App:** 기상청 공공데이터 API를 연동하고 `xml2json` 파이프라인을 구축한 실시간 날씨 위젯 앱.
- **NowPlaying (Desk Clock):** Android Native 통신(`MethodChannel`, `EventChannel`)을 직접 구현하여 백그라운드 뮤직 데이터를 추출하는 탁상시계 앱.

### 3. Web Projects
- **Static Checklist App:** LocalStorage를 활용한 순수 바닐라 환경의 초경량 투두(To-do) 리스트.

---

## 🚀 Getting Started

이 프로젝트는 정적 파일(Static Files)로만 구성되어 있어 별도의 빌드 과정이 필요하지 않습니다.

1. 저장소를 클론합니다.
```bash
git clone https://github.com/LJS0817/LJS0817.github.io.git
```
2. 프로젝트 폴더의 `index.html` 파일을 브라우저로 엽니다.
3. 또는 `Live Server` (VSCode Extension) 등을 사용하여 로컬 환경에서 테스트할 수 있습니다.

---

<div align="center">
  <i>Designed and Developed by <b>LJS0817</b></i>
</div>

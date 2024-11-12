# nugget-app

![plot](./assets/images/screenshot.png)

일렉트론 기반 영상편집 소프트웨어입니다. 기본적인 컷 편집과 애니메이션, 사운드 믹싱, 익스텐션을 통한 외부 라이브러리, 프로젝트 관리, 텍스트 편집 기능이 존재합니다. ffmpeg를 기반으로 렌더링 하며 빠른 속도를 자랑합니다. 상용 프로그램 대비 빠르게 편집할 수 있도록 개발되었습니다.

ui는 LitJS를 사용했습니다. 영상 재생과 편집을 위해 빠른 dom 성능이 필요해 적용했습니다.

스타일은 devent-design-system-v1을 사용합니다. 부트스트랩5의 의존성으로 인해 최근 React 버전인 v2로 업데이트 했으나 다른 언어 종속성을 줄이기 위해 조만간 React, Lit도 지원하는 v3 디자인 시스템을 개발할 예정입니다.

CDN과 인증 서버를 내리면서 몇 가지 기능이 deprecated 되었습니다. 로그인 및 CDN 다운로드 기능이 없어지면서, ffmpeg와 ffprobe를 따로 설치하셔야 합니다.

## 설치

의존성을 설치해 줍니다.

```
npm install
```

TypeScript 컴파일과 번들 파일을 생성해줍니다. 모두 watch가 설정되어 있어 코드가 바뀌면 자동으로 변경됩니다.

ffmpeg와 ffprobe를 bin 폴더에 넣어줍니다. mac&windows 용 바이너리 파일은 https://github.com/cartesiancs/ffmpeg4nugget 에서 다운받으실 수 있습니다.

## 퍼미션 부여

`chmod -R 777 bin`로 ffmpeg, ffprobe의 권한을 부여해줍니다.

## 실행

마지막으로 일렉트론을 실행해줍니다.

```
npm run dev
npm run start
```

# 공용 실시간 문서 사이트

Render에 Node 서버를 배포하고, 문서 데이터는 Firebase Firestore에 저장하는 공용 실시간 슬라이드 문서 사이트입니다.

## 구조

- Frontend: React, Vite, Tiptap
- Server: Express, Socket.IO
- Database: Firebase Firestore
- Hosting: Render Web Service

## 기능

- `/` 비밀번호 입력 페이지
- `/doc` 공용 문서 페이지
- 비밀번호 미입력 시 읽기 전용
- 비밀번호 인증 성공 시 편집 가능
- 가로형 슬라이드 문서
- 슬라이드 추가
- 굵게, 글자 크기, 글자 색상 변경
- Socket.IO 실시간 동기화
- Firestore 자동 저장

## 로컬 실행

```bash
npm install
npm run build
npm start
```

로컬 주소:

```text
http://localhost:10000
```

## 필요한 환경 변수

```text
DOC_PASSWORD=20324
FIREBASE_SERVICE_ACCOUNT_BASE64=Firebase 서비스 계정 JSON을 base64로 바꾼 값
```

## Firebase 설정

1. Firebase Console에서 프로젝트를 만듭니다.
2. Build > Firestore Database로 이동합니다.
3. Create database를 누릅니다.
4. Production mode 또는 Test mode 중 하나를 선택합니다.
5. 위치는 asia-northeast3 또는 가까운 리전을 고릅니다.
6. Project settings > Service accounts로 이동합니다.
7. Generate new private key를 눌러 JSON 파일을 다운로드합니다.
8. 다운로드한 JSON 파일을 base64 문자열로 변환합니다.

PowerShell 예시:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\user\Downloads\service-account.json"))
```

출력된 긴 문자열을 Render 환경 변수 `FIREBASE_SERVICE_ACCOUNT_BASE64`에 넣습니다.

## Render 배포 설정

Render Web Service 설정:

```text
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

Environment Variables:

```text
DOC_PASSWORD=20324
FIREBASE_SERVICE_ACCOUNT_BASE64=위에서 만든 base64 문자열
```

또는 `render.yaml` Blueprint를 사용해 배포할 수 있습니다.

## Firestore 저장 위치

서버는 아래 문서 하나에 슬라이드 데이터를 저장합니다.

```text
collection: document
document: sharedDoc
```

데이터 형태:

```json
{
  "slides": [
    {
      "id": "slide-1",
      "content": "<h2>공용 문서</h2>"
    }
  ],
  "updatedAt": "2026-05-21T00:00:00.000Z"
}
```

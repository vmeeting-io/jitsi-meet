# 모바일 버전 릴리즈 노트

### vmobile-release-v20.5.9
- 모바일 SSO 로그인 시나리오 오류 수정
- 회의방 한글 이름 표시 오류 수정

### ios 빌드 오류시

## RCTOrientation
- Click on Build Settings and then the first item under "Targets"
- Scroll down to 'Search Paths'
- Double click to edit the 'Header Search Paths'
- Add the following entry (click '+'): ${SRCROOT}/../../../ios/Pods/Headers.
- Make sure to set it to recursive. (DOUBLE CLICK)

## node version
- 16버전 사용

## Unexpected token
- metro-react-native-babel-preset: ^0.66.2


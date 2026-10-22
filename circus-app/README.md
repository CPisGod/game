# 원숭이 서커스 안드로이드 앱

`../circus` 웹 게임을 Capacitor로 감싼 네이티브(안드로이드) 앱이다.
APK는 GitHub Actions(`circus-apk` 워크플로)가 빌드한다. 실행 결과의 Artifacts에서 `circus-debug-apk`를 받아 폰에 설치하면 된다.

로컬에서 빌드하려면 (Node 20+, JDK 17, Android SDK 필요):

    cd circus-app
    npm install
    mkdir -p www && cp -r ../circus/. www/
    npx cap add android
    npx capacitor-assets generate --android
    npx cap sync android
    cd android && ./gradlew assembleDebug   # android/app/build/outputs/apk/debug/

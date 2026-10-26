# 모델 출처

- `ferrari.glb` — three.js 저장소의 예제 모델 (`examples/models/gltf/ferrari.glb`, Ferrari 458 Italia).
  원작자·라이선스 표기는 three.js 저장소의 해당 폴더 안내를 따른다. (CC-BY 계열로 알려져 있으나 이 저장소에서는 직접 확인하지 못했으므로, 공개 서비스 전에 원 출처에서 라이선스를 확인할 것)
- `grandeur.glb` 를 추가하면 페라리보다 우선 사용된다.
- `grandeur.glb` — 사용자가 제공한 "Grandeur GN7 inspired Detailed Exterior v2" (외관 전용, 인테리어 없음, 제조사 CAD 아님).
  차체/유리/휠이 재질별 단일 메시로 합쳐져 있어, 로더가 타이어 위치를 기준으로 휠 삼각형을 분리해 조향·회전시킨다.
- `avante_n.glb` — 사용자가 제공한 "AVANTE N independent exterior concept" (외관 전용, 참고 사진 기반 근사 모델, 공식 CAD 아님).
- `suv.glb` — 사용자가 제공한 "SUV CONCEPT independent exterior concept" (외관 전용, 차종/치수 미확인, 후면은 추정).
- `ferrari.glb` — 앞뒤가 반대(뒤쪽이 +Z)여서 루트에 Y축 180° 회전 노드(`FlipY180`)를 넣어 저장함.

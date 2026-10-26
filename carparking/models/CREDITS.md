# 모델 출처

- `grandeur.glb` 를 추가하면 페라리보다 우선 사용된다.
- `grandeur.glb` — 사용자가 제공한 "Grandeur GN7 inspired Detailed Exterior v2" (외관 전용, 인테리어 없음, 제조사 CAD 아님).
  차체/유리/휠이 재질별 단일 메시로 합쳐져 있어, 로더가 타이어 위치를 기준으로 휠 삼각형을 분리해 조향·회전시킨다.
- `avante_n.glb` — 사용자가 제공한 "AVANTE N independent exterior concept" (외관 전용, 참고 사진 기반 근사 모델, 공식 CAD 아님).
- `suv.glb` — 사용자가 제공한 "SUV CONCEPT independent exterior concept" (외관 전용, 차종/치수 미확인, 후면은 추정).
- `ferrari.glb` — 사용자가 제공한 `ferrari_edited.stl` 을 변환한 모델 (이전 three.js 예제 모델을 대체). STL에는 색/재질/휠 정보가 없어, 휠 부품을 위치로 분류해 4개 휠 노드와 차체로 나누고 타이어/림 재질을 지정했다. 법선은 35° 기준으로 재계산, meshopt 압축(원본 STL 17MB → 약 3.5MB). 앞쪽은 +Z. 원작자/라이선스는 사용자 확인 필요.

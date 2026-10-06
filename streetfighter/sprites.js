// 레트로 도트 스프라이트 (코드로 그림). 40x40 픽셀, 오른쪽을 바라봄.
// 프레임: 0 대기, 1 대기2, 2 준비동작, 3 타격, 4 마무리
const SF = (() => {
  const W = 40, H = 40;
  const FRAMES = ['대기', '대기2', '준비', '타격', '마무리'];
  const LEAN = [0, 0, -2, 3, 1];
  const HAND = [[6, 9], [6, 10], [-3, -8], [14, 2], [9, 7]];
  const BACK = [[-5, 9], [-5, 10], [-6, 6], [-4, 6], [-5, 8]];
  const WDIR = [[1, 3], [1, 3], [-1, -4], [4, 0], [2, 2]];

  const mk = () => new Array(W * H).fill(null);
  const px = (g, x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = c; };
  const rect = (g, x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(g, x + i, y + j, c); };
  const ell = (g, cx, cy, rx, ry, c) => {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx + .5) + (y * y) / (ry * ry + .5) <= 1) px(g, cx + x, cy + y, c);
  };
  const line = (g, x0, y0, x1, y1, c, t = 1, c2) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      rect(g, Math.round(x - (t - 1) / 2), Math.round(y - (t - 1) / 2), t, t, c2 && i % 4 > 1 ? c2 : c);
    }
  };
  const tri = (g, x0, y0, x1, y1, x2, y2, c) => {
    const minX = Math.min(x0, x1, x2), maxX = Math.max(x0, x1, x2), minY = Math.min(y0, y1, y2), maxY = Math.max(y0, y1, y2);
    const s = (ax, ay, bx, by, cx, cy) => (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const d1 = s(x, y, x0, y0, x1, y1), d2 = s(x, y, x1, y1, x2, y2), d3 = s(x, y, x2, y2, x0, y0);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) px(g, x, y, c);
    }
  };

  const OUT = '#1a1020';
  const outline = g => {
    const o = g.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y * W + x]) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && g[ny * W + nx]) { o[y * W + x] = OUT; break; }
      }
    }
    return o;
  };

  // 공통 사지(다리/팔)
  const legs = (g, f, cx, col, shoe) => {
    const fw = f === 3 ? 4 : f === 2 ? -2 : 0, bw = f === 3 ? -3 : f === 2 ? 1 : 0;
    rect(g, cx - 6 + bw, 31, 4, 7, col); rect(g, cx - 7 + bw, 37, 6, 2, shoe);
    rect(g, cx + 2 + fw, 31, 4, 7, col); rect(g, cx + 2 + fw, 37, 6, 2, shoe);
  };
  const arm = (g, sx, sy, hx, hy, col, hand) => {
    line(g, sx, sy, hx, hy, col, 3);
    rect(g, hx - 1, hy - 1, 3, 3, hand || col);
  };

  const weapon = (g, f, hx, hy, len, col, t, col2, tip) => {
    const [dx, dy] = WDIR[f]; const m = Math.hypot(dx, dy);
    const ex = hx + dx / m * len, ey = hy + dy / m * len;
    line(g, hx - dx / m * 2, hy - dy / m * 2, ex, ey, col, t, col2);
    if (tip) rect(g, Math.round(ex) - 1, Math.round(ey) - 1, 3, 3, tip);
  };

  const slash = (g, f, sx, sy) => {
    if (f !== 3) return;
    for (let a = -75; a <= 25; a += 4) {
      const r = a * Math.PI / 180;
      px(g, sx + Math.cos(r) * 19, sy + Math.sin(r) * 19, '#ffffff');
      px(g, sx + Math.cos(r) * 17, sy + Math.sin(r) * 17, '#bfe9ff');
    }
  };

  const face = (g, x, y, big) => { // 눈
    rect(g, x, y, big ? 3 : 2, big ? 3 : 2, '#fff'); rect(g, x + 1, y + (big ? 1 : 0), 1, big ? 2 : 2, '#111');
  };

  // ───── 부타(돼지) ─────
  const buta = f => {
    const g = mk(), L = LEAN[f], b = f === 1 ? 1 : 0, cx = 20 + L;
    const P = '#f4a3b8', PD = '#d9708f', PL = '#ffd2dd';
    const sx = cx + 5, sy = 21 + b;
    arm(g, cx - 5, sy, cx + BACK[f][0], sy + BACK[f][1], PD);
    legs(g, f, cx, PD, '#6b3a2a');
    ell(g, cx, 25 + b, 8, 8, P); ell(g, cx + 1, 27 + b, 5, 5, PL);
    rect(g, cx - 8, 31, 17, 2, '#4a6fd8'); // 멜빵 바지 느낌
    // 머리
    ell(g, cx + 1, 12 + b, 9, 7, P);
    tri(g, cx - 6, 4 + b, cx - 2, 3 + b, cx - 4, 8 + b, PD);
    tri(g, cx + 4, 3 + b, cx + 8, 4 + b, cx + 6, 8 + b, PD);
    ell(g, cx + 8, 14 + b, 4, 3, PD); // 코
    px(g, cx + 7, 14 + b, '#5a1f33'); px(g, cx + 9, 14 + b, '#5a1f33');
    face(g, cx + 3, 9 + b, true);
    if (f === 3) { px(g, cx + 5, 10 + b, '#ff4a4a'); }
    arm(g, sx, sy, cx + 5 + HAND[f][0], sy + HAND[f][1] - (f === 3 ? 0 : 0), P, PL);
    if (f === 3) { // 방구가스
      const gc = ['#9be34a', '#6cc02d', '#c8f27a'];
      [[-6, 26, 3], [-10, 24, 4], [-13, 27, 3]].forEach(([x, y, r], i) => ell(g, cx + x - 4, y, r, r, gc[i % 3]));
    }
    return g;
  };

  // ───── 척추 ─────
  const chuk = f => {
    const g = mk(), L = LEAN[f], b = f === 1 ? 1 : 0, cx = 20 + L;
    const B = '#f3ecd2', BD = '#b9ad84', R = '#d8452e';
    const sx = cx + 4, sy = 20 + b;
    // 가시 목털
    tri(g, cx - 3, 18 + b, cx - 12, 11 + b, cx - 5, 14 + b, R);
    tri(g, cx - 3, 20 + b, cx - 13, 17 + b, cx - 4, 17 + b, '#a02a1a');
    tri(g, cx - 3, 22 + b, cx - 11, 22 + b, cx - 3, 19 + b, R);
    arm(g, cx - 3, sy, cx + BACK[f][0], sy + BACK[f][1], BD);
    // 다리뼈
    rect(g, cx - 5 + (f === 3 ? -3 : 0), 31, 3, 7, B); rect(g, cx - 6 + (f === 3 ? -3 : 0), 37, 5, 2, BD);
    rect(g, cx + 2 + (f === 3 ? 4 : f === 2 ? -2 : 0), 31, 3, 7, B); rect(g, cx + 2 + (f === 3 ? 4 : f === 2 ? -2 : 0), 37, 5, 2, BD);
    // 척추 마디 몸통
    for (let i = 0; i < 4; i++) {
      const y = 17 + i * 4 + b * (i < 2 ? 1 : 0);
      rect(g, cx - 3, y, 7, 3, i % 2 ? B : '#fffbe6'); rect(g, cx - 3, y + 2, 7, 1, BD);
      rect(g, cx - 6, y + 1, 3, 1, BD); rect(g, cx + 4, y + 1, 3, 1, BD); // 갈비 가시
    }
    rect(g, cx - 2, 29, 5, 3, BD);
    // 두개골
    ell(g, cx + 1, 10 + b, 8, 7, B); rect(g, cx - 3, 15 + b, 9, 3, B);
    rect(g, cx - 2, 8 + b, 3, 3, '#111'); rect(g, cx + 3, 8 + b, 3, 3, '#111');
    px(g, cx - 1, 9 + b, '#ff3030'); px(g, cx + 4, 9 + b, '#ff3030');
    rect(g, cx + 1, 12 + b, 1, 2, '#111');
    for (let i = 0; i < 4; i++) px(g, cx - 2 + i * 2, 16 + b, '#111');
    arm(g, sx, sy, cx + 4 + HAND[f][0], sy + HAND[f][1] - 1, B, BD);
    weapon(g, f, cx + 4 + HAND[f][0], sy + HAND[f][1] - 1, 15, B, 2, BD, '#fffbe6');
    slash(g, f, sx, sy);
    return g;
  };

  // ───── 원숭이 ─────
  const monkey = f => {
    const g = mk(), L = LEAN[f], b = f === 1 ? 1 : 0, cx = 20 + L;
    const M = '#9a5a2b', MD = '#6e3b16', FACE = '#f2c99a';
    const sx = cx + 4, sy = 20 + b;
    // 꼬리
    line(g, cx - 5, 28 + b, cx - 11, 27 + b, MD, 2); line(g, cx - 11, 27 + b, cx - 13, 21 + b, MD, 2); line(g, cx - 13, 21 + b, cx - 10, 17 + b, MD, 2);
    arm(g, cx - 4, sy, cx + BACK[f][0], sy + BACK[f][1], MD);
    legs(g, f, cx, MD, FACE);
    ell(g, cx, 25 + b, 6, 7, M); ell(g, cx + 1, 26 + b, 3, 4, FACE);
    // 머리
    ell(g, cx - 7, 11 + b, 3, 3, M); ell(g, cx - 7, 11 + b, 1, 1, FACE);
    ell(g, cx + 9, 11 + b, 3, 3, M); ell(g, cx + 9, 11 + b, 1, 1, FACE);
    ell(g, cx + 1, 10 + b, 8, 7, M);
    ell(g, cx + 3, 12 + b, 6, 5, FACE);
    face(g, cx, 8 + b, true); face(g, cx + 5, 8 + b, true);
    px(g, cx + 3, 13 + b, '#6e3b16'); px(g, cx + 5, 13 + b, '#6e3b16');
    rect(g, cx + 3, 15 + b, 4, 1, '#a0522d');
    arm(g, sx, sy, cx + 4 + HAND[f][0], sy + HAND[f][1], M, FACE);
    // 바나나
    weapon(g, f, cx + 4 + HAND[f][0], sy + HAND[f][1], 8, '#ffe135', 3, '#f2c200', '#6e5a10');
    slash(g, f, sx, sy);
    return g;
  };

  // ───── 초록사과나무 ─────
  const apple = f => {
    const g = mk(), L = LEAN[f], b = f === 1 ? 1 : 0, cx = 20 + L;
    const T = '#8a5a2e', TD = '#5e3a18', G = '#3fa045', GD = '#2a7a32', GL = '#7fd36a', AP = '#a6e22e';
    const sx = cx + 5, sy = 21 + b;
    arm(g, cx - 5, sy, cx + BACK[f][0], sy + BACK[f][1], TD);
    // 뿌리 다리
    rect(g, cx - 6 + (f === 3 ? -3 : 0), 31, 4, 6, TD); tri(g, cx - 9 + (f === 3 ? -3 : 0), 38, cx - 5 + (f === 3 ? -3 : 0), 36, cx - 1 + (f === 3 ? -3 : 0), 38, TD);
    rect(g, cx + 2 + (f === 3 ? 4 : 0), 31, 4, 6, TD); tri(g, cx + 1 + (f === 3 ? 4 : 0), 38, cx + 4 + (f === 3 ? 4 : 0), 36, cx + 9 + (f === 3 ? 4 : 0), 38, TD);
    // 줄기 몸통
    rect(g, cx - 6, 17 + b, 13, 15, T);
    for (let y = 18; y < 31; y += 3) px(g, cx - 4 + (y % 2) * 6, y + b, TD), px(g, cx - 3 + (y % 2) * 6, y + 1 + b, TD);
    rect(g, cx - 6, 17 + b, 2, 15, TD);
    // 얼굴
    face(g, cx - 2, 21 + b, true); face(g, cx + 3, 21 + b, true);
    rect(g, cx - 1, 27 + b, 6, 1, '#2a1208'); px(g, cx - 2, 26 + b, '#2a1208'); px(g, cx + 5, 26 + b, '#2a1208');
    // 잎사귀 관
    ell(g, cx, 9 + b, 12, 8, G); ell(g, cx - 6, 12 + b, 6, 5, G); ell(g, cx + 7, 12 + b, 6, 5, G);
    ell(g, cx - 4, 6 + b, 5, 3, GL); ell(g, cx + 5, 7 + b, 3, 2, GL);
    px(g, cx - 10, 14 + b, GD); px(g, cx + 11, 14 + b, GD); rect(g, cx - 3, 15 + b, 7, 1, GD);
    [[-8, 9], [2, 4], [9, 9], [-2, 13]].forEach(([x, y]) => { ell(g, cx + x, y + b, 2, 2, AP); px(g, cx + x - 1, y - 1 + b, '#e8ffa8'); px(g, cx + x, y - 3 + b, TD); });
    arm(g, sx, sy, cx + 5 + HAND[f][0], sy + HAND[f][1], TD, GL);
    // 소설책
    const hx = cx + 5 + HAND[f][0], hy = sy + HAND[f][1];
    const bw = f === 3 ? 9 : 6, bh = f === 3 ? 6 : 9;
    rect(g, hx - 1, hy - bh + 2, bw, bh, '#2f56c9'); rect(g, hx, hy - bh + 3, bw - 2, bh - 2, '#f4efe0');
    rect(g, hx - 1, hy - bh + 2, 1, bh, '#1b3688'); rect(g, hx + 1, hy - bh + 4, Math.max(1, bw - 5), 1, '#999');
    slash(g, f, sx, sy);
    return g;
  };

  // ───── 제빵사 ─────
  const baker = f => {
    const g = mk(), L = LEAN[f], b = f === 1 ? 1 : 0, cx = 20 + L;
    const SK = '#f2c29a', WH = '#ffffff', WS = '#d8dde8', PANT = '#46506b';
    const sx = cx + 5, sy = 21 + b;
    arm(g, cx - 5, sy, cx + BACK[f][0], sy + BACK[f][1], WS, SK);
    legs(g, f, cx, PANT, '#3a2418');
    // 몸통(흰 옷 + 앞치마)
    rect(g, cx - 7, 17 + b, 15, 15, WH); rect(g, cx - 7, 17 + b, 2, 15, WS);
    rect(g, cx - 3, 22 + b, 9, 10, '#e9d9b8'); rect(g, cx - 3, 22 + b, 9, 1, '#c9b78f');
    rect(g, cx + 1, 17 + b, 2, 5, '#d8452e'); rect(g, cx - 2, 17 + b, 8, 1, '#d8452e'); // 스카프
    px(g, cx - 1, 26 + b, '#c9b78f'); px(g, cx + 4, 28 + b, '#c9b78f');
    // 머리
    ell(g, cx + 1, 11 + b, 7, 6, SK);
    face(g, cx + 1, 9 + b, false); face(g, cx + 5, 9 + b, false);
    rect(g, cx + 1, 13 + b, 7, 2, '#3a2418'); px(g, cx, 14 + b, '#3a2418'); px(g, cx + 8, 14 + b, '#3a2418'); // 콧수염
    // 요리사 모자
    ell(g, cx - 3, 3 + b, 4, 3, WH); ell(g, cx + 2, 2 + b, 5, 3, WH); ell(g, cx + 6, 4 + b, 3, 3, WH);
    rect(g, cx - 5, 5 + b, 13, 3, WH); rect(g, cx - 5, 7 + b, 13, 1, WS);
    arm(g, sx, sy, cx + 5 + HAND[f][0], sy + HAND[f][1], WH, SK);
    weapon(g, f, cx + 5 + HAND[f][0], sy + HAND[f][1], 15, '#d99a3f', 4, '#b8741f', '#f0c070');
    slash(g, f, sx, sy);
    return g;
  };

  const CHARS = [
    { id: 'buta', name: '부타', fn: buta },
    { id: 'chuk', name: '척추', fn: chuk },
    { id: 'monkey', name: '원숭이', fn: monkey },
    { id: 'apple', name: '초록사과나무', fn: apple },
    { id: 'baker', name: '제빵사', fn: baker },
  ];

  const frame = (ch, f) => outline(ch.fn(f));
  const draw = (ctx, ch, f, x, y, scale, flip) => {
    const g = frame(ch, f);
    ctx.save();
    if (flip) { ctx.translate(x + W * scale, y); ctx.scale(-1, 1); x = 0; y = 0; ctx.translate(0, 0); } else { ctx.translate(x, y); }
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const c = g[j * W + i]; if (!c) continue;
      ctx.fillStyle = c; ctx.fillRect(i * scale, j * scale, scale, scale);
    }
    ctx.restore();
  };
  return { W, H, FRAMES, CHARS, draw };
})();

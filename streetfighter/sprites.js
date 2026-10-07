// 레트로 도트 스프라이트 (코드로 그림). 56x40 픽셀, 오른쪽을 바라봄.
// 포즈(이름)별로 그린다. 스킬마다 전용 포즈가 있다.
const SF = (() => {
  const W = 68, H = 40, OX = 8;

  // ───── 포즈 정의 ─────
  // lean 몸 기울기, bob 몸 낮춤, hand/back 앞손/뒷손 위치(어깨 기준), wdir 무기 방향,
  // legs: stand/lunge/back/crouch/tuck, prop: default/none/spine/spikes/banana/apple/yeast/pointer,
  // expr: normal/strain/angry/sad/cry/happy/wide, mouth: open/wide/smile, mirror: 뒤돌아섬
  const BASE = { lean: 0, bob: 0, hand: [6, 9], back: [-5, 9], wdir: [1, 3], legs: 'stand', prop: 'default', expr: 'normal', mouth: null };
  const POSES = {
    idle: {}, idle2: { bob: 1, hand: [6, 10], back: [-5, 10] },
    hurt: { lean: -3, bob: 1, hand: [-1, 8], back: [-8, 6], expr: 'strain', prop: 'none', legs: 'back' },
    // 근접 휘두르기
    windup: { lean: -2, hand: [-9, -1], back: [-6, 6], wdir: [-2, -3], legs: 'back' },
    strike: { lean: 3, hand: [14, 2], back: [-4, 6], wdir: [4, 0], legs: 'lunge', slash: true },
    recover: { lean: 1, hand: [9, 7], back: [-5, 8], wdir: [2, 2] },
    // 던지기 공통
    throw_go: { lean: 4, hand: [15, -3], back: [-4, 6], legs: 'lunge', prop: 'none' },
    throw_rec: { lean: 1, hand: [10, 5], back: [-5, 8], prop: 'none' },
    spine_wind: { lean: -3, hand: [-9, -2], back: [-5, 6], wdir: [-1, -3], legs: 'back', prop: 'spine' },
    banana_wind: { lean: -3, hand: [-9, -2], back: [-5, 6], wdir: [-1, -3], legs: 'back', prop: 'banana' },
    apple_wind: { lean: -3, hand: [-9, -3], back: [-5, 6], legs: 'back', prop: 'apple' },
    yeast_wind: { lean: -3, hand: [-9, -3], back: [-5, 6], legs: 'back', prop: 'yeast' },
    spike_wind: { lean: -2, hand: [-6, -8], back: [-5, 8], legs: 'back', prop: 'spikes', expr: 'angry' },
    spike_go: { lean: 3, hand: [13, 11], back: [-4, 6], legs: 'lunge', prop: 'spikes' },
    // 부타
    fart_wind: { mirror: true, bob: 3, hand: [2, 8], back: [-3, 8], legs: 'crouch', expr: 'strain', prop: 'none', gas: 1 },
    fart_go: { mirror: true, bob: 2, lean: 1, hand: [1, 9], back: [-3, 9], legs: 'crouch', expr: 'strain', prop: 'none', gas: 3 },
    fart_rec: { mirror: true, bob: 0, hand: [4, 9], back: [-5, 9], expr: 'happy', prop: 'none', gas: 2 },
    stomp_wind: { bob: 5, lean: -2, hand: [-4, 4], back: [-8, 6], legs: 'crouch', expr: 'angry', prop: 'none' },
    stomp_air: { bob: 0, hand: [9, -10], back: [-8, -10], legs: 'tuck', expr: 'angry', mouth: 'open', prop: 'none' },
    stomp_land: { bob: 6, lean: 1, hand: [11, 8], back: [-8, 8], legs: 'crouch', expr: 'strain', prop: 'none' },
    pout1: { bob: 2, lean: -2, hand: [1, 10], back: [-3, 10], expr: 'sad', prop: 'none' },
    pout2: { bob: 5, lean: -3, hand: [3, 9], back: [-2, 9], legs: 'crouch', expr: 'cry', prop: 'none', cloud: true },
    // 원숭이
    climb: { lean: 1, hand: [4, -12], back: [-4, -12], legs: 'tuck', prop: 'none' },
    fall: { hand: [9, -11], back: [-9, -11], legs: 'tuck', expr: 'wide', mouth: 'open', prop: 'none' },
    land: { bob: 6, lean: 2, hand: [11, 9], back: [-4, 9], legs: 'crouch', expr: 'angry', prop: 'none' },
    dance1: { lean: -2, hand: [7, -10], back: [-7, -3], legs: 'back', expr: 'happy', mouth: 'open', prop: 'none' },
    dance2: { lean: 2, hand: [9, -2], back: [-7, -11], legs: 'lunge', expr: 'happy', mouth: 'open', prop: 'none' },
    dance3: { bob: 3, hand: [13, 1], back: [-13, 1], legs: 'crouch', expr: 'happy', mouth: 'open', prop: 'none' },
    // 초록사과나무
    sing_in: { lean: -3, hand: [-3, 8], back: [-7, 8], expr: 'happy', mouth: 'open', prop: 'none', leaves: 1 },
    sing: { lean: 1, hand: [10, -5], back: [-9, -5], expr: 'happy', mouth: 'wide', prop: 'none', notes: true, leaves: 2 },
    sing_out: { hand: [8, 6], back: [-6, 8], expr: 'happy', mouth: 'smile', prop: 'none', leaves: 1 },
    // 중국인
    noodle_wind: { lean: -3, hand: [-9, -3], back: [-5, 6], legs: 'back', prop: 'noodle' },
    refuse1: { lean: -1, cross: true, expr: 'angry', prop: 'none' },
    refuse2: { lean: 1, xarms: true, expr: 'angry', mouth: 'wide', prop: 'none' },
    refuse3: { lean: -1, cross: true, expr: 'smug', mouth: 'smile', prop: 'none' },
    // 핫바
    poke_wind: { lean: -3, hand: [-4, 3], back: [-6, 7], legs: 'back', prop: 'none', finger2: true, expr: 'angry' },
    poke_go: { lean: 4, hand: [15, 0], back: [-4, 6], legs: 'lunge', prop: 'none', finger2: true, expr: 'angry' },
    poke_rec: { lean: 1, hand: [8, 6], prop: 'none' },
    skewer_wind: { lean: -3, hand: [-8, -5], back: [-5, 6], wdir: [1, -3], legs: 'back', prop: 'skewer', nostick: true, expr: 'angry' },
    skewer_go: { lean: 4, hand: [15, -3], back: [-4, 6], legs: 'lunge', prop: 'none', nostick: true },
    skewer_rec: { lean: 1, hand: [10, 5], prop: 'none', nostick: true },
    micro1: { lean: -2, hand: [7, -1], back: [-4, 6], prop: 'none', expr: 'angry' },
    micro2: { lean: 2, hand: [14, 2], back: [-4, 6], prop: 'none', finger2: true, expr: 'angry', mouth: 'open' },
    micro3: { lean: 1, hand: [10, 4], prop: 'none', expr: 'happy', mouth: 'smile' },
    // 곽티슈
    tball_wind: { lean: -3, hand: [-9, -3], back: [-5, 6], legs: 'back', prop: 'tball' },
    seduce1: { lean: -2, hand: [3, -7], back: [-4, 8], prop: 'none', expr: 'wink', mouth: 'kiss', hearts: 1, sway: 1 },
    seduce2: { lean: 3, hand: [14, -5], back: [-6, 3], prop: 'none', expr: 'wink', mouth: 'kiss', hearts: 2, sway: 3, legs: 'lunge' },
    seduce3: { lean: 1, hand: [9, -1], back: [-5, 8], prop: 'none', expr: 'happy', mouth: 'smile', hearts: 1, sway: 2 },
    // 미술의 악마
    knife_wind: { lean: -3, hand: [-9, -3], back: [-5, 6], wdir: [1, -3], legs: 'back', prop: 'chisel', expr: 'smug' },
    grade1: { lean: -1, hand: [5, -3], back: [-4, 8], prop: 'bcard', expr: 'smug', mouth: 'smile' },
    grade2: { lean: 1, hand: [9, -9], back: [-3, 4], prop: 'bcard', expr: 'smug', mouth: 'wide' },
    grade3: { lean: 0, hand: [8, -5], back: [-5, 8], prop: 'bcard', expr: 'smug', mouth: 'smile' },
    // 제빵사
    lecture1: { lean: -1, hand: [5, -9], back: [-2, 4], expr: 'normal', mouth: 'open', prop: 'none', glasses: true, finger: true },
    lecture2: { lean: 2, hand: [15, -1], back: [-4, 4], mouth: 'open', prop: 'pointer', wdir: [4, -1], glasses: true, legs: 'lunge' },
    lecture3: { lean: 0, hand: [4, -9], back: [-5, 8], mouth: 'smile', prop: 'none', glasses: true, adjust: true },
  };
  const poseOf = (n, over) => Object.assign({}, BASE, POSES[n] || POSES.idle, (over && over[n]) || {});
  const ALIAS = ['idle', 'idle2', 'windup', 'strike', 'recover'];

  let P = poseOf('idle');

  const mk = () => new Array(W * H).fill(null);
  const px = (g, x, y, c) => { x = Math.round(x) + OX; y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = c; };
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
  const mirror = g => { const o = mk(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const nx = 2 * (20 + OX) - x; if (nx >= 0 && nx < W) o[y * W + nx] = g[y * W + x]; } return o; };

  // ───── 공통 부품 ─────
  const legs = (g, cx, col, shoe) => {
    const b = P.bob, m = P.legs;
    if (m === 'tuck') {
      rect(g, cx - 6, 31, 4, 3, col); rect(g, cx - 7, 33, 6, 2, shoe);
      rect(g, cx + 3, 31, 4, 3, col); rect(g, cx + 3, 33, 6, 2, shoe); return;
    }
    let fw = 0, bw = 0, sp = 0;
    if (m === 'lunge') { fw = 4; bw = -3; } else if (m === 'back') { fw = -2; bw = 1; } else if (m === 'crouch') { sp = 2; }
    const top = 31 + b, h = Math.max(2, 7 - b);
    rect(g, cx - 6 + bw - sp, top, 4, h, col); rect(g, cx - 7 + bw - sp, 37, 6, 2, shoe);
    rect(g, cx + 2 + fw + sp, top, 4, h, col); rect(g, cx + 2 + fw + sp, 37, 6, 2, shoe);
  };
  const arm = (g, sx, sy, hx, hy, col, hand) => { line(g, sx, sy, hx, hy, col, 3); rect(g, hx - 1, hy - 1, 3, 3, hand || col); };
  const eye = (g, x, y, big, second) => {
    const e = P.expr, w = big ? 3 : 2, h = big ? 3 : 2;
    if (e === 'wink' && second) { px(g, x, y, '#111'); px(g, x + 1, y + 1, '#111'); px(g, x, y + 2, '#111'); return; }
    if (e === 'strain' || e === 'cry' || e === 'happy') {
      if (e === 'happy') { px(g, x, y + 1, '#111'); px(g, x + 1, y, '#111'); px(g, x + 2, y + 1, '#111'); }
      else { rect(g, x, y + 1, 3, 1, '#111'); if (e === 'strain') { px(g, x - 1, y, '#111'); px(g, x + 3, y, '#111'); } }
      if (e === 'cry') rect(g, x + 1, y + 2, 1, 5, '#6ec6ff');
      return;
    }
    if (e === 'wide') { rect(g, x, y - 1, w, h + 2, '#fff'); px(g, x + 1, y + 1, '#111'); return; }
    rect(g, x, y, w, h, '#fff'); rect(g, x + 1, y + (big ? 1 : 0), 1, 2, '#111');
    if (e === 'angry') rect(g, x - 1, y - 1, w + 2, 1, '#111');
    if (e === 'smug') rect(g, x, y, w, 1, '#111');
    if (e === 'sad') { rect(g, x, y - 1, w, 1, '#111'); rect(g, x + 1, y + h, 1, 2, '#6ec6ff'); }
  };
  const mouth = (g, x, y) => {
    if (P.mouth === 'open') { rect(g, x, y, 5, 3, '#3a0d0d'); rect(g, x + 1, y + 2, 3, 1, '#e0506a'); }
    else if (P.mouth === 'wide') { rect(g, x - 1, y - 1, 7, 5, '#3a0d0d'); rect(g, x + 1, y + 2, 3, 2, '#e0506a'); }
    else if (P.mouth === 'kiss') { rect(g, x + 1, y, 2, 2, '#d04070'); px(g, x + 1, y, '#ff7aa0'); }
    else if (P.mouth === 'smile') { px(g, x, y, '#3a0d0d'); rect(g, x + 1, y + 1, 3, 1, '#3a0d0d'); px(g, x + 4, y, '#3a0d0d'); }
  };
  const note = (g, x, y, c) => { rect(g, x, y + 4, 3, 2, c); rect(g, x + 2, y, 1, 5, c); rect(g, x + 3, y, 2, 1, c); rect(g, x + 4, y + 1, 1, 1, c); };

  // 손에 든 물건
  const weapon = (g, hx, hy, len, col, t, col2, tip) => {
    const [dx, dy] = P.wdir, m = Math.hypot(dx, dy);
    const ex = hx + dx / m * len, ey = hy + dy / m * len;
    line(g, hx - dx / m * 2, hy - dy / m * 2, ex, ey, col, t, col2);
    if (tip) rect(g, Math.round(ex) - 1, Math.round(ey) - 1, 3, 3, tip);
  };
  const prop = (g, name, hx, hy) => {
    if (name === 'spine') weapon(g, hx, hy, 15, '#f3ecd2', 2, '#b9ad84', '#fffbe6');
    else if (name === 'banana') weapon(g, hx, hy, 8, '#ffe135', 3, '#f2c200', '#6e5a10');
    else if (name === 'baguette') weapon(g, hx, hy, 15, '#d99a3f', 4, '#b8741f', '#f0c070');
    else if (name === 'pointer') { weapon(g, hx, hy, 14, '#caa05a', 1); const [dx, dy] = P.wdir, m = Math.hypot(dx, dy); rect(g, Math.round(hx + dx / m * 14), Math.round(hy + dy / m * 14) - 1, 2, 2, '#fff'); }
    else if (name === 'apple') { ell(g, hx + 1, hy - 3, 3, 3, '#6fb81f'); px(g, hx, hy - 5, '#c4f060'); px(g, hx + 1, hy - 7, '#5e3a18'); }
    else if (name === 'yeast') { rect(g, hx - 2, hy - 8, 6, 8, '#e8d29a'); rect(g, hx - 2, hy - 8, 6, 2, '#d8452e'); rect(g, hx, hy - 5, 2, 2, '#8a6a2a'); }
    else if (name === 'spikes') { [[-3, 0], [0, -2], [3, 0]].forEach(([dx, dy]) => tri(g, hx + dx - 2, hy + 2 + dy, hx + dx, hy - 6 + dy, hx + dx + 2, hy + 2 + dy, '#d8452e')); rect(g, hx - 4, hy + 1, 8, 2, '#a02a1a'); }
    else if (name === 'flag') {
      const [dx, dy] = P.wdir, m = Math.hypot(dx, dy), ex = hx + dx / m * 20, ey = hy + dy / m * 20;
      line(g, hx - dx / m * 2, hy - dy / m * 2, ex, ey, '#8a6a3a', 2);
      const fx = dx >= 3 ? Math.round(ex) - 12 : Math.round(ex) + 1, fy = dx >= 3 ? Math.round(ey) + 1 : Math.round(ey);
      rect(g, fx, fy, 12, 8, '#de2910'); rect(g, fx, fy + 7, 12, 1, '#a81d08');
      rect(g, fx + 1, fy + 1, 2, 2, '#ffde00'); [[4, 0], [5, 2], [5, 4], [4, 5]].forEach(([a, c]) => px(g, fx + a, fy + c, '#ffde00'));
    }
    else if (name === 'noodle') {
      ell(g, hx, hy - 4, 5, 3, '#2a1a14'); px(g, hx - 2, hy - 6, '#5a3a24'); px(g, hx + 2, hy - 5, '#5a3a24'); px(g, hx, hy - 7, '#5a3a24');
      rect(g, hx - 5, hy - 3, 11, 5, '#f4f0e6'); rect(g, hx - 5, hy - 3, 11, 1, '#3b6fd0'); rect(g, hx - 3, hy + 2, 7, 1, '#cfc8b8');
    }
    else if (name === 'skewer') weapon(g, hx, hy, 16, '#e0bf80', 2, '#b8924a', '#fff4d0');
    else if (name === 'tspear') weapon(g, hx, hy, 13, '#ffffff', 2, '#bcd9f0', '#ffffff');
    else if (name === 'tball') { ell(g, hx + 1, hy - 3, 3, 3, '#ffffff'); px(g, hx, hy - 4, '#cfe2f3'); px(g, hx + 2, hy - 2, '#cfe2f3'); px(g, hx + 1, hy - 1, '#cfe2f3'); }
    else if (name === 'chisel') {
      const [dx, dy] = P.wdir, m = Math.hypot(dx, dy), ux = dx / m, uy = dy / m;
      line(g, hx, hy, hx + ux * 5, hy + uy * 5, '#7a4a22', 2);
      line(g, hx + ux * 5, hy + uy * 5, hx + ux * 14, hy + uy * 14, '#d5dde5', 2); px(g, hx + ux * 15, hy + uy * 15, '#ffffff');
    }
    else if (name === 'canvas') {
      const horiz = P.wdir[0] >= 4, cw = horiz ? 14 : 10, ch = horiz ? 10 : 14, x0 = hx - 2, y0 = hy - ch + 2;
      rect(g, x0, y0, cw, ch, '#8a5a2e'); rect(g, x0 + 1, y0 + 1, cw - 2, ch - 2, '#f4efe0');
      rect(g, x0 + 1, y0 + 1, cw - 2, Math.floor((ch - 2) / 2), '#7ec8ff'); rect(g, x0 + 1, y0 + 1 + Math.floor((ch - 2) / 2), cw - 2, Math.ceil((ch - 2) / 2), '#5cae4a');
      rect(g, x0 + cw - 4, y0 + 2, 2, 2, '#ffd23f'); px(g, x0 + 3, y0 + ch - 3, '#d8452e');
    }
    else if (name === 'bcard') {
      const x0 = hx - 5, y0 = hy - 14;
      rect(g, x0, y0, 11, 14, '#ffffff'); rect(g, x0, y0, 11, 1, '#cfd6e0'); rect(g, x0, y0 + 13, 11, 1, '#cfd6e0');
      ['1110', '1001', '1001', '1110', '1001', '1001', '1110'].forEach((r, j) => [...r].forEach((c, i) => { if (c === '1') px(g, x0 + 3 + i, y0 + 3 + j, '#d81e1e'); }));
      rect(g, x0 + 2, y0 + 11, 7, 1, '#d81e1e');
    }
    else if (name === 'book') {
      const horiz = P.wdir[0] >= 4, bw = horiz ? 9 : 6, bh = horiz ? 6 : 9;
      rect(g, hx - 1, hy - bh + 2, bw, bh, '#2f56c9'); rect(g, hx, hy - bh + 3, bw - 2, bh - 2, '#f4efe0');
      rect(g, hx - 1, hy - bh + 2, 1, bh, '#1b3688'); rect(g, hx + 1, hy - bh + 4, Math.max(1, bw - 5), 1, '#999');
    }
  };
  const slash = (g, sx, sy) => {
    if (!P.slash) return;
    for (let a = -75; a <= 25; a += 4) {
      const r = a * Math.PI / 180;
      px(g, sx + Math.cos(r) * 19, sy + Math.sin(r) * 19, '#ffffff');
      px(g, sx + Math.cos(r) * 17, sy + Math.sin(r) * 17, '#bfe9ff');
    }
  };
  const held = (def) => P.prop === 'default' ? def : P.prop;

  // ───── 부타(돼지) ─────
  const buta = () => {
    const g = mk(), b = P.bob, cx = 20 + P.lean;
    const C = '#f4a3b8', CD = '#d9708f', CL = '#ffd2dd';
    const sx = cx + 5, sy = 21 + b;
    // 꼬리(뒤쪽)
    px(g, cx - 9, 22 + b, CD); px(g, cx - 10, 21 + b, CD); px(g, cx - 11, 22 + b, CD); px(g, cx - 11, 23 + b, CD);
    arm(g, cx - 5, sy, cx + P.back[0], sy + P.back[1], CD);
    legs(g, cx, CD, '#6b3a2a');
    ell(g, cx, 25 + b, 8, 8, C); ell(g, cx + 1, 27 + b, 5, 5, CL);
    rect(g, cx - 8, 31 + b, 17, 2, '#4a6fd8');
    ell(g, cx + 1, 12 + b, 9, 7, C);
    tri(g, cx - 6, 4 + b, cx - 2, 3 + b, cx - 4, 8 + b, CD);
    tri(g, cx + 4, 3 + b, cx + 8, 4 + b, cx + 6, 8 + b, CD);
    ell(g, cx + 8, 14 + b, 4, 3, CD);
    px(g, cx + 7, 14 + b, '#5a1f33'); px(g, cx + 9, 14 + b, '#5a1f33');
    eye(g, cx + 3, 9 + b, true);
    mouth(g, cx + 3, 17 + b);
    if (P.expr === 'strain') { rect(g, cx - 1, 13 + b, 2, 2, '#ff6a88'); px(g, cx + 9, 5 + b, '#6ec6ff'); px(g, cx + 9, 6 + b, '#6ec6ff'); px(g, cx + 10, 7 + b, '#6ec6ff'); }
    if (P.expr === 'sad' || P.expr === 'cry') { px(g, cx + 1, 18 + b, '#5a1f33'); rect(g, cx + 2, 17 + b, 3, 1, '#5a1f33'); px(g, cx + 5, 18 + b, '#5a1f33'); }
    arm(g, sx, sy, sx + P.hand[0], sy + P.hand[1], C, CL);
    if (P.cloud) { // 우울한 먹구름과 비
      ell(g, cx + 1, 3, 9, 3, '#6b7388'); ell(g, cx - 4, 4, 5, 3, '#59607a'); ell(g, cx + 7, 4, 5, 3, '#59607a');
      for (let i = 0; i < 5; i++) { px(g, cx - 6 + i * 4, 8 + (i % 2) * 2, '#6ec6ff'); px(g, cx - 6 + i * 4, 9 + (i % 2) * 2, '#6ec6ff'); }
    }
    if (P.gas) { // 뒤쪽(= 뒤돌아서면 상대 쪽)으로 방구가스
      const gc = ['#9be34a', '#6cc02d', '#c8f27a', '#7fd13a'];
      const sets = { 1: [[-12, 29, 2], [-15, 28, 2]], 2: [[-14, 29, 4], [-19, 27, 3]], 3: [[-10, 28, 5], [-15, 26, 6], [-20, 28, 5], [-17, 32, 4], [-23, 24, 3]] };
      sets[P.gas].forEach(([x, y, r], i) => ell(g, cx + x, y + b, r, r, gc[i % 4]));
    }
    return g;
  };

  // ───── 척추 ─────
  const chuk = () => {
    const g = mk(), b = P.bob, cx = 20 + P.lean;
    const B = '#f3ecd2', BD = '#b9ad84', R = '#d8452e';
    const sx = cx + 4, sy = 20 + b;
    tri(g, cx - 3, 18 + b, cx - 12, 11 + b, cx - 5, 14 + b, R);
    tri(g, cx - 3, 20 + b, cx - 13, 17 + b, cx - 4, 17 + b, '#a02a1a');
    tri(g, cx - 3, 22 + b, cx - 11, 22 + b, cx - 3, 19 + b, R);
    arm(g, cx - 3, sy, cx + P.back[0], sy + P.back[1], BD);
    legs(g, cx, B, BD);
    for (let i = 0; i < 4; i++) {
      const y = 17 + i * 4 + b * (i < 2 ? 1 : 0);
      rect(g, cx - 3, y, 7, 3, i % 2 ? B : '#fffbe6'); rect(g, cx - 3, y + 2, 7, 1, BD);
      rect(g, cx - 6, y + 1, 3, 1, BD); rect(g, cx + 4, y + 1, 3, 1, BD);
    }
    rect(g, cx - 2, 29, 5, 3, BD);
    ell(g, cx + 1, 10 + b, 8, 7, B); rect(g, cx - 3, 15 + b, 9, 3, B);
    rect(g, cx - 2, 8 + b, 3, 3, '#111'); rect(g, cx + 3, 8 + b, 3, 3, '#111');
    px(g, cx - 1, 9 + b, P.expr === 'angry' ? '#ffcc33' : '#ff3030'); px(g, cx + 4, 9 + b, P.expr === 'angry' ? '#ffcc33' : '#ff3030');
    if (P.expr === 'angry') { rect(g, cx - 3, 7 + b, 4, 1, '#111'); rect(g, cx + 3, 7 + b, 4, 1, '#111'); }
    rect(g, cx + 1, 12 + b, 1, 2, '#111');
    for (let i = 0; i < 4; i++) px(g, cx - 2 + i * 2, 16 + b, '#111');
    const hx = sx + P.hand[0], hy = sy + P.hand[1] - 1;
    arm(g, sx, sy, hx, hy, B, BD);
    prop(g, held('spine'), hx, hy);
    slash(g, sx, sy);
    return g;
  };

  // ───── 원숭이 ─────
  const monkey = () => {
    const g = mk(), b = P.bob, cx = 20 + P.lean;
    const M = '#9a5a2b', MD = '#6e3b16', FACE = '#f2c99a';
    const sx = cx + 4, sy = 20 + b;
    line(g, cx - 5, 28 + b, cx - 11, 27 + b, MD, 2); line(g, cx - 11, 27 + b, cx - 13, 21 + b, MD, 2); line(g, cx - 13, 21 + b, cx - 10, 17 + b, MD, 2);
    arm(g, cx - 4, sy, cx - 4 + P.back[0] + 1, sy + P.back[1], MD, FACE);
    legs(g, cx, MD, FACE);
    ell(g, cx, 25 + b, 6, 7, M); ell(g, cx + 1, 26 + b, 3, 4, FACE);
    ell(g, cx - 7, 11 + b, 3, 3, M); ell(g, cx - 7, 11 + b, 1, 1, FACE);
    ell(g, cx + 9, 11 + b, 3, 3, M); ell(g, cx + 9, 11 + b, 1, 1, FACE);
    ell(g, cx + 1, 10 + b, 8, 7, M);
    ell(g, cx + 3, 12 + b, 6, 5, FACE);
    eye(g, cx, 8 + b, true); eye(g, cx + 5, 8 + b, true);
    px(g, cx + 3, 13 + b, '#6e3b16'); px(g, cx + 5, 13 + b, '#6e3b16');
    if (P.mouth) mouth(g, cx + 3, 15 + b); else rect(g, cx + 3, 15 + b, 4, 1, '#a0522d');
    const hx = sx + P.hand[0], hy = sy + P.hand[1];
    arm(g, sx, sy, hx, hy, M, FACE);
    prop(g, held('banana'), hx, hy);
    slash(g, sx, sy);
    return g;
  };

  // ───── 초록사과나무 ─────
  const apple = () => {
    const g = mk(), b = P.bob, cx = 20 + P.lean;
    const T = '#8a5a2e', TD = '#5e3a18', G = '#3fa045', GD = '#2a7a32', GL = '#7fd36a', AP = '#a6e22e';
    const sx = cx + 5, sy = 21 + b;
    arm(g, cx - 5, sy, cx + P.back[0], sy + P.back[1], TD, GL);
    const lg = P.legs === 'lunge' ? [-3, 4] : P.legs === 'back' ? [1, -2] : [0, 0];
    rect(g, cx - 6 + lg[0], 31 + b, 4, Math.max(2, 6 - b), TD); tri(g, cx - 9 + lg[0], 38, cx - 5 + lg[0], 36, cx - 1 + lg[0], 38, TD);
    rect(g, cx + 2 + lg[1], 31 + b, 4, Math.max(2, 6 - b), TD); tri(g, cx + 1 + lg[1], 38, cx + 4 + lg[1], 36, cx + 9 + lg[1], 38, TD);
    rect(g, cx - 6, 17 + b, 13, 15, T);
    for (let y = 18; y < 31; y += 3) px(g, cx - 4 + (y % 2) * 6, y + b, TD), px(g, cx - 3 + (y % 2) * 6, y + 1 + b, TD);
    rect(g, cx - 6, 17 + b, 2, 15, TD);
    eye(g, cx - 2, 21 + b, true); eye(g, cx + 3, 21 + b, true);
    if (P.mouth) mouth(g, cx, 26 + b); else { rect(g, cx - 1, 27 + b, 6, 1, '#2a1208'); px(g, cx - 2, 26 + b, '#2a1208'); px(g, cx + 5, 26 + b, '#2a1208'); }
    // 잎사귀 관 (노래할 때 흔들림)
    const sw = P.leaves === 2 ? 2 : P.leaves === 1 ? 1 : 0;
    ell(g, cx, 9 + b, 12, 8, G); ell(g, cx - 6 - sw, 12 + b, 6, 5, G); ell(g, cx + 7 + sw, 12 + b, 6, 5, G);
    ell(g, cx - 4, 6 + b, 5, 3, GL); ell(g, cx + 5, 7 + b, 3, 2, GL);
    px(g, cx - 10, 14 + b, GD); px(g, cx + 11, 14 + b, GD); rect(g, cx - 3, 15 + b, 7, 1, GD);
    [[-8, 9], [2, 4], [9, 9], [-2, 13]].forEach(([x, y]) => { ell(g, cx + x, y + b, 2, 2, AP); px(g, cx + x - 1, y - 1 + b, '#e8ffa8'); px(g, cx + x, y - 3 + b, TD); });
    const hx = sx + P.hand[0], hy = sy + P.hand[1];
    arm(g, sx, sy, hx, hy, TD, GL);
    prop(g, held('book'), hx, hy);
    if (P.notes) { note(g, cx + 12, 19, '#ffe066'); note(g, cx + 19, 14, '#ffd23f'); note(g, cx + 25, 21, '#ffe066'); }
    slash(g, sx, sy);
    return g;
  };

  // ───── 제빵사 ─────
  const baker = () => {
    const g = mk(), b = P.bob, cx = 20 + P.lean;
    const SK = '#f2c29a', WH = '#ffffff', WS = '#d8dde8', PANT = '#46506b';
    const sx = cx + 5, sy = 21 + b;
    arm(g, cx - 5, sy, cx + P.back[0], sy + P.back[1], WS, SK);
    legs(g, cx, PANT, '#3a2418');
    rect(g, cx - 7, 17 + b, 15, 15, WH); rect(g, cx - 7, 17 + b, 2, 15, WS);
    rect(g, cx - 3, 22 + b, 9, 10, '#e9d9b8'); rect(g, cx - 3, 22 + b, 9, 1, '#c9b78f');
    rect(g, cx + 1, 17 + b, 2, 5, '#d8452e'); rect(g, cx - 2, 17 + b, 8, 1, '#d8452e');
    px(g, cx - 1, 26 + b, '#c9b78f'); px(g, cx + 4, 28 + b, '#c9b78f');
    ell(g, cx + 1, 11 + b, 7, 6, SK);
    eye(g, cx + 1, 9 + b, false); eye(g, cx + 5, 9 + b, false);
    if (P.glasses) { rect(g, cx, 8 + b, 4, 1, '#111'); rect(g, cx, 11 + b, 4, 1, '#111'); rect(g, cx, 8 + b, 1, 4, '#111'); rect(g, cx + 3, 8 + b, 1, 4, '#111'); rect(g, cx + 4, 8 + b, 4, 1, '#111'); rect(g, cx + 4, 11 + b, 4, 1, '#111'); rect(g, cx + 7, 8 + b, 1, 4, '#111'); }
    rect(g, cx + 1, 13 + b, 7, 2, '#3a2418'); px(g, cx, 14 + b, '#3a2418'); px(g, cx + 8, 14 + b, '#3a2418');
    if (P.mouth) mouth(g, cx + 2, 15 + b);
    ell(g, cx - 3, 3 + b, 4, 3, WH); ell(g, cx + 2, 2 + b, 5, 3, WH); ell(g, cx + 6, 4 + b, 3, 3, WH);
    rect(g, cx - 5, 5 + b, 13, 3, WH); rect(g, cx - 5, 7 + b, 13, 1, WS);
    const hx = sx + P.hand[0], hy = sy + P.hand[1];
    arm(g, sx, sy, hx, hy, WH, SK);
    if (P.finger) rect(g, hx, hy - 4, 1, 4, SK); // 검지 척!
    prop(g, held('baguette'), hx, hy);
    slash(g, sx, sy);
    return g;
  };


  // ───── v2 공통: 팔 처리(팔짱/X자 팔 지원) ─────
  const backArm = (g, x, y, col, hand) => { if (P.xarms || P.cross) return; arm(g, x, y, x + P.back[0], y + P.back[1], col, hand); };
  const frontArm = (g, cx, sx, sy, col, hand) => {
    if (P.xarms) { arm(g, cx - 4, sy, cx + 8, sy - 14, col, hand); arm(g, cx + 5, sy, cx - 6, sy - 14, col, hand); return null; }
    if (P.cross) { arm(g, cx - 4, sy + 1, cx + 6, sy + 5, col, hand); arm(g, cx + 5, sy + 1, cx - 5, sy + 5, col, hand); return null; }
    const hx = sx + P.hand[0], hy = sy + P.hand[1]; arm(g, sx, sy, hx, hy, col, hand); return [hx, hy];
  };
  const heart = (g, x, y, c = '#ff5a8a') => { ['.1.1.', '11111', '11111', '.111.', '..1..'].forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '1') px(g, x + i, y + j, c); })); px(g, x + 1, y + 1, '#ffc1d6'); };

  // ───── 6. 중국인 ─────
  const chinese = () => {
    const g = mk(), b = P.bob, cx = 20 + P.lean;
    const RED = '#d8281c', RD = '#a01810', GOLD = '#f5c542', SK = '#f2c29a', HAIR = '#1d1d24';
    const sx = cx + 5, sy = 21 + b;
    backArm(g, cx - 5, sy, RD, SK);
    legs(g, cx, '#2a2a3a', '#111');
    rect(g, cx - 7, 17 + b, 15, 15, RED); rect(g, cx - 7, 17 + b, 2, 15, RD);
    rect(g, cx, 18 + b, 1, 14, GOLD); [20, 24, 28].forEach(y => rect(g, cx - 1, y + b, 3, 1, GOLD));
    rect(g, cx - 3, 16 + b, 7, 2, GOLD);
    ell(g, cx + 1, 11 + b, 7, 6, SK);
    ell(g, cx + 1, 6 + b, 7, 3, HAIR); rect(g, cx - 6, 7 + b, 3, 5, HAIR); rect(g, cx + 1, 7 + b, 8, 1, HAIR);
    eye(g, cx + 1, 10 + b, false); eye(g, cx + 5, 10 + b, false, true);
    if (P.mouth) mouth(g, cx + 2, 15 + b); else rect(g, cx + 3, 15 + b, 3, 1, '#a0522d');
    if (P.expr === 'angry') { rect(g, cx, 8 + b, 4, 1, HAIR); rect(g, cx + 5, 8 + b, 4, 1, HAIR); }
    const h = frontArm(g, cx, sx, sy, RED, SK);
    if (h) prop(g, held('flag'), h[0], h[1]);
    slash(g, sx, sy);
    return g;
  };

  // ───── 7. 핫바 ─────
  const hotbar = () => {
    const g = mk(), b = P.bob, cx = 20 + P.lean;
    const O = '#d9803a', OD = '#a85a1e', OL = '#f2a65a', Y = '#ffd23f', R = '#d8281c';
    const sx = cx + 7, sy = 22 + b;
    backArm(g, cx - 7, sy, OD, OL);
    legs(g, cx, OD, '#6b3a14');
    rect(g, cx - 8, 10 + b, 17, 20, O); ell(g, cx, 10 + b, 8, 6, O); ell(g, cx, 30 + b, 8, 4, O);
    rect(g, cx - 8, 10 + b, 3, 20, OD); rect(g, cx + 4, 9 + b, 2, 18, OL);
    for (let i = 0; i < 4; i++) rect(g, cx - 5, 17 + b + i * 4, 9, 1, OD);       // 그릴 자국
    for (let x = -7; x <= 7; x++) px(g, cx + x, 25 + b + (Math.abs(x) % 2), Y);   // 머스터드
    for (let x = -7; x <= 7; x++) px(g, cx + x, 28 + b + (Math.abs(x) % 2), R);   // 케첩
    if (!P.nostick) { rect(g, cx - 1, 1 + b, 2, 4, '#e8c88a'); rect(g, cx - 1, 0 + b, 2, 1, '#fff4d0'); }
    else { ell(g, cx, 5 + b, 1, 1, OD); }
    eye(g, cx - 4, 12 + b, true); eye(g, cx + 2, 12 + b, true, true);
    if (P.mouth) mouth(g, cx - 2, 18 + b); else { rect(g, cx - 1, 19 + b, 4, 1, '#5a2a10'); px(g, cx - 2, 18 + b, '#5a2a10'); px(g, cx + 3, 18 + b, '#5a2a10'); }
    if (P.expr === 'angry') { rect(g, cx - 5, 10 + b, 4, 1, '#5a2a10'); rect(g, cx + 2, 10 + b, 4, 1, '#5a2a10'); }
    const h = frontArm(g, cx, sx, sy, OL, OL);
    if (h) {
      if (P.finger2) { rect(g, h[0] + 2, h[1], 3, 1, OL); px(g, h[0] + 5, h[1], '#ffd9b0'); }
      prop(g, held('none'), h[0], h[1]);
    }
    return g;
  };

  // ───── 8. 곽티슈 ─────
  const tissue = () => {
    const g = mk(), b = P.bob, cx = 20 + P.lean;
    const BL = '#6ec6ff', BD = '#3f9ad8', BW = '#ffffff';
    const sx = cx + 8, sy = 23 + b, sw = P.sway || 0;
    backArm(g, cx - 8, sy, BD, BW);
    legs(g, cx, BD, '#2b5f9a');
    rect(g, cx - 9, 14 + b, 19, 18, BL); rect(g, cx - 9, 14 + b, 3, 18, BD); rect(g, cx - 9, 29 + b, 19, 3, BD);
    rect(g, cx - 5, 13 + b, 11, 2, '#1d3a5e');
    // 뽑혀 나온 티슈(머리카락): 유혹할 때 살랑
    ell(g, cx - 3 - sw, 9 + b, 4, 5, '#ffffff'); ell(g, cx + 3 + sw, 8 + b, 4, 6, '#f4f9ff'); ell(g, cx + sw, 5 + b, 3, 4, '#ffffff');
    px(g, cx - 4 - sw, 10 + b, '#cfe2f3'); px(g, cx + 4 + sw, 9 + b, '#cfe2f3'); px(g, cx + sw, 6 + b, '#cfe2f3');
    [[-6, 28], [5, 17], [7, 27], [-5, 18]].forEach(([x, y]) => { px(g, cx + x, y + b, '#ff9ec0'); px(g, cx + x + 1, y + b, '#ffd0e0'); });
    eye(g, cx - 4, 19 + b, true); eye(g, cx + 3, 19 + b, true, true);
    if (P.expr === 'wink' || P.expr === 'happy') { rect(g, cx - 6, 23 + b, 2, 1, '#ff9ec0'); rect(g, cx + 6, 23 + b, 2, 1, '#ff9ec0'); }
    if (P.mouth) mouth(g, cx - 1, 24 + b); else rect(g, cx - 1, 25 + b, 3, 1, '#3a2a4a');
    const h = frontArm(g, cx, sx, sy, BD, BW);
    if (h) prop(g, held('tspear'), h[0], h[1]);
    if (P.hearts) { heart(g, cx + 14, 6 + b); if (P.hearts > 1) { heart(g, cx + 22, 13 + b, '#ff8fb3'); heart(g, cx + 17, 20 + b, '#ff5a8a'); } }
    slash(g, sx, sy);
    return g;
  };

  // ───── 9. 미술의 악마 ─────
  const devil = () => {
    const g = mk(), b = P.bob, cx = 20 + P.lean;
    const R = '#c8362e', RD = '#8f221c', HORN = '#f0e0b0', SM = '#6a3fa0', SMD = '#4b2a78';
    const sx = cx + 5, sy = 21 + b;
    line(g, cx - 6, 29 + b, cx - 12, 27 + b, RD, 2); line(g, cx - 12, 27 + b, cx - 14, 21 + b, RD, 2); tri(g, cx - 17, 21 + b, cx - 11, 21 + b, cx - 14, 16 + b, RD);
    backArm(g, cx - 5, sy, RD, R);
    legs(g, cx, RD, '#3a1a1a');
    rect(g, cx - 7, 17 + b, 15, 15, SM); rect(g, cx - 7, 17 + b, 2, 15, SMD);
    [[2, 22, '#ffd23f'], [-3, 26, '#4ad0e8'], [4, 29, '#ff7aa0'], [-1, 20, '#7ae850'], [5, 25, '#ffd23f']].forEach(([x, y, c]) => rect(g, cx + x, y + b, 2, 2, c));
    rect(g, cx - 7, 24 + b, 15, 1, SMD);
    ell(g, cx + 1, 11 + b, 7, 6, R);
    tri(g, cx - 5, 6 + b, cx - 9, 0 + b, cx - 2, 5 + b, HORN); tri(g, cx + 6, 5 + b, cx + 11, 0 + b, cx + 8, 7 + b, HORN);
    tri(g, cx - 7, 10 + b, cx - 12, 8 + b, cx - 7, 13 + b, R);
    ell(g, cx + 1, 5 + b, 6, 2, '#2a2a3a'); rect(g, cx + 1, 2 + b, 2, 2, '#2a2a3a');
    [[cx, 9], [cx + 5, 9]].forEach(([x, y], i) => {
      if (P.expr === 'wide') { rect(g, x, y - 1 + b, 3, 4, '#ffe066'); px(g, x + 1, y + b, '#111'); return; }
      rect(g, x, y + b, 3, 2, '#ffe066'); px(g, x + 1, y + b, '#111'); px(g, x + 1, y + 1 + b, '#111');
      if (P.expr === 'smug') rect(g, x, y + b, 3, 1, '#7a1a14');
      if (P.expr === 'angry') rect(g, x - 1, y - 1 + b, 5, 1, '#111');
    });
    if (P.mouth) mouth(g, cx + 2, 15 + b); else { rect(g, cx + 3, 15 + b, 4, 1, '#3a0d0d'); px(g, cx + 3, 16 + b, '#fff'); px(g, cx + 6, 16 + b, '#fff'); }
    const h = frontArm(g, cx, sx, sy, RD, R);
    if (h) prop(g, held('canvas'), h[0], h[1]);
    slash(g, sx, sy);
    return g;
  };

  // ───── 이펙트/투사체 스프라이트 ─────
  const fxList = {
    microwave: (g) => { // 전자레인지 (28x24)
      rect(g, 0, 0, 28, 22, '#c9ccd4'); rect(g, 0, 0, 28, 2, '#e8ebf0'); rect(g, 0, 20, 28, 2, '#8e93a0'); rect(g, 1, 22, 4, 2, '#555'); rect(g, 23, 22, 4, 2, '#555');
      rect(g, 2, 3, 18, 15, '#222c38'); rect(g, 3, 4, 16, 13, '#ffb347'); rect(g, 5, 6, 12, 9, '#ff8a2a'); rect(g, 6, 7, 4, 2, '#ffd9a0');
      rect(g, 21, 3, 5, 15, '#a9aeb9'); rect(g, 22, 4, 3, 3, '#2a3a4a'); px(g, 22, 4, '#ff3b30'); px(g, 23, 4, '#ff3b30'); px(g, 24, 4, '#ff3b30');
      rect(g, 22, 9, 3, 2, '#555'); rect(g, 22, 12, 3, 2, '#555'); rect(g, 22, 15, 3, 2, '#d8281c');
    },
    noodle: (g) => { ell(g, 11, 6, 7, 4, '#2a1a14'); [[6, 3], [10, 2], [14, 4], [8, 6], [13, 7]].forEach(([x, y]) => px(g, x, y, '#6a4a34')); rect(g, 4, 8, 15, 7, '#f4f0e6'); rect(g, 4, 8, 15, 1, '#3b6fd0'); rect(g, 7, 15, 9, 1, '#cfc8b8'); },
    skewer: (g) => { rect(g, 0, 3, 22, 2, '#e0bf80'); rect(g, 22, 3, 3, 2, '#fff4d0'); for (let i = 0; i < 3; i++) { rect(g, 4 + i * 5, 1, 4, 6, '#d9803a'); rect(g, 4 + i * 5, 1, 1, 6, '#a85a1e'); } },
    tball: (g) => { ell(g, 6, 6, 5, 5, '#ffffff'); [[3, 4], [8, 3], [5, 8], [9, 7]].forEach(([x, y]) => px(g, x, y, '#cfe2f3')); },
    chisel: (g) => { rect(g, 0, 2, 7, 3, '#7a4a22'); rect(g, 7, 2, 12, 3, '#d5dde5'); rect(g, 7, 2, 12, 1, '#ffffff'); tri(g, 19, 1, 19, 5, 24, 3, '#d5dde5'); },
    bstamp: (g) => { ell(g, 10, 10, 10, 10, '#d81e1e'); ell(g, 10, 10, 8, 8, '#f4efe0'); ['1110', '1001', '1001', '1110', '1001', '1001', '1110'].forEach((r, j) => [...r].forEach((c, i) => { if (c === '1') rect(g, 6 + i * 2, 4 + j * 2 - 0, 2, 2, '#d81e1e'); })); },
    heart: (g) => { heart(g, 2, 2); },
    tspear: (g) => { rect(g, 0, 2, 16, 2, '#ffffff'); rect(g, 2, 2, 2, 2, '#bcd9f0'); rect(g, 8, 2, 2, 2, '#bcd9f0'); tri(g, 16, 1, 16, 5, 20, 3, '#ffffff'); },
  };
  const fxSize = { microwave: [28, 24], noodle: [24, 17], skewer: [26, 8], tball: [12, 12], chisel: [25, 6], bstamp: [21, 21], heart: [9, 9], tspear: [21, 6] };
  const fxCache = {};
  const effect = (name) => {
    if (fxCache[name]) return fxCache[name];
    const [w, h] = fxSize[name];
    const c = document.createElement('canvas'); c.width = w + 2; c.height = h + 2;
    // 임시로 px()를 쓰지 않고 별도 그리드에 그린다
    const gg = mk(); const draw = fxList[name];
    // fx 함수는 px()의 OX 이동을 쓰므로 OX만큼 좌표를 되돌려 읽는다
    draw(gg);
    const x = c.getContext('2d'), o = outline(gg);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const col = o[j * W + i]; if (col) { x.fillStyle = col; x.fillRect(i - OX + 1, j + 1, 1, 1); } }
    return fxCache[name] = c;
  };

  const CHARS = [
    { id: 'buta', name: '부타', fn: buta, poses: ['idle', 'idle2', 'fart_wind', 'fart_go', 'fart_rec', 'stomp_wind', 'stomp_air', 'stomp_land', 'pout1', 'pout2', 'hurt'] },
    { id: 'chuk', name: '척추', fn: chuk, poses: ['idle', 'idle2', 'windup', 'strike', 'recover', 'spine_wind', 'throw_go', 'throw_rec', 'spike_wind', 'spike_go', 'hurt'] },
    { id: 'monkey', name: '원숭이', fn: monkey, poses: ['idle', 'idle2', 'climb', 'dance1', 'dance2', 'dance3', 'fall', 'land', 'banana_wind', 'throw_go', 'hurt'] },
    { id: 'apple', name: '청사과나무', fn: apple, poses: ['idle', 'idle2', 'apple_wind', 'throw_go', 'sing_in', 'sing', 'sing_out', 'windup', 'strike', 'recover', 'hurt'] },
    { id: 'baker', name: '제빵사', fn: baker, poses: ['idle', 'idle2', 'yeast_wind', 'throw_go', 'lecture1', 'lecture2', 'lecture3', 'windup', 'strike', 'recover', 'hurt'] },
  ];

  const NEWCHARS = [
    { id: 'chinese', name: '중국인', fn: chinese, over: { idle: { wdir: [1, -6] }, idle2: { wdir: [1, -6] }, recover: { wdir: [2, -4] } }, poses: ['idle', 'idle2', 'windup', 'strike', 'recover', 'noodle_wind', 'throw_go', 'throw_rec', 'refuse1', 'refuse2', 'refuse3', 'hurt'] },
    { id: 'hotbar', name: '핫바', fn: hotbar, poses: ['idle', 'idle2', 'poke_wind', 'poke_go', 'poke_rec', 'skewer_wind', 'skewer_go', 'skewer_rec', 'micro1', 'micro2', 'micro3', 'hurt'] },
    { id: 'tissue', name: '곽티슈', fn: tissue, poses: ['idle', 'idle2', 'windup', 'strike', 'recover', 'tball_wind', 'throw_go', 'throw_rec', 'seduce1', 'seduce2', 'seduce3', 'hurt'] },
    { id: 'devil', name: '미술의 악마', fn: devil, poses: ['idle', 'idle2', 'windup', 'strike', 'recover', 'knife_wind', 'throw_go', 'throw_rec', 'grade1', 'grade2', 'grade3', 'hurt'] },
  ];
  const frame = (ch, name) => {
    P = poseOf(name, ch.over);
    let g = ch.fn();
    if (P.mirror) g = mirror(g);
    return outline(g);
  };
  const cache = {};
  const canvas = (ch, f) => {
    const name = typeof f === 'number' ? ALIAS[f] : f;
    const k = ch.id + name; if (cache[k]) return cache[k];
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'), g = frame(ch, name);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const col = g[j * W + i]; if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); } }
    return cache[k] = c;
  };
  return { W, H, CX: 20 + OX, CHARS, NEWCHARS, canvas, effect, FX: Object.keys(fxList) };
})();

(() => {
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const W = 960, H = 540, GROUND = 470, SC = 5, MINX = 70, MAXX = 890;
const FONT = '"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif';

// ───────── 입력 ─────────
// 앞 = 상대 쪽, 뒤 = 반대쪽
const KEYS = [
  { jump: 'KeyS', s: ['KeyQ', 'KeyW', 'KeyE'], label: ['Q', 'W', 'E'], jlabel: 'S', left: 'KeyA', right: 'KeyD', ok: 'KeyQ' },
  { jump: 'Numpad5', s: ['Numpad7', 'Numpad8', 'Numpad9'], label: ['7', '8', '9'], jlabel: '5', left: 'Numpad4', right: 'Numpad6', ok: 'Numpad7' },
];
const down = {};
addEventListener('keydown', e => {
  if (/^(Numpad|Key[ADQWES]|Arrow|Space|Enter)/.test(e.code)) e.preventDefault();
  if (down[e.code]) return; down[e.code] = true; onPress(e.code);
});
addEventListener('keyup', e => { down[e.code] = false; });
addEventListener('blur', () => { for (const k in down) down[k] = false; });

// ───────── 캐릭터/스킬 데이터 ─────────
const CH = {
  buta:   { name: '부타',         hp: 100, speed: 510 },
  chuk:   { name: '척추',         hp: 100, speed: 450 },
  monkey: { name: '원숭이',       hp: 100, speed: 645 },
  apple:  { name: '초록사과나무', hp: 125, speed: 345 },
  baker:  { name: '제빵사',       hp: 100, speed: 480 },
};
const SPR = {}; SF.CHARS.forEach(c => SPR[c.id] = c);

// ───────── 상태 ─────────
let phase = 'select';              // select | fight | over
let sel = [{ picks: [], cur: 0, done: false }, { picks: [], cur: 4, done: false }];
let fighters = [], projs = [], traps = [], fx = [], floats = [], trees = [];
let shake = 0, winner = -1, banner = null, time = 0;

const ORDER = SF.CHARS.map(c => c.id);

function onPress(code) {
  if (phase === 'select') {
    sel.forEach((s, i) => {
      const k = KEYS[i]; if (s.done) return;
      if (code === k.left) s.cur = (s.cur + 4) % 5;
      else if (code === k.right) s.cur = (s.cur + 1) % 5;
      else if (code === k.ok) { s.picks.push(ORDER[s.cur]); if (s.picks.length === 2) s.done = true; }
      else if (code === k.s[2] && s.picks.length) s.picks.pop();
    });
    if (sel[0].done && sel[1].done && (code === 'Enter' || code === 'Space')) startFight();
  } else if (phase === 'over' && (code === 'Enter' || code === 'Space')) {
    sel = [{ picks: [], cur: 0, done: false }, { picks: [], cur: 4, done: false }]; phase = 'select';
  }
}

// ───────── 파이터 ─────────
function mkFighter(side, picks) {
  const f = { side, picks, idx: 0, x: side ? 720 : 240, z: 0, vx: 0, face: side ? -1 : 1, hp: 0, maxhp: 0, kind: '',
    act: null, t: 0, cd: [0, 0, 0], st: { stun: 0, confuse: 0, blind: 0, slow: 0, defdown: 0, pity: 0 },
    hurt: 0, inv: 0, jt: -1, ghost: false, dead: 0, flash: 0, vars: {}, anim: 0, dance: false };
  loadChar(f); return f;
}
function loadChar(f) {
  f.kind = f.picks[f.idx]; f.maxhp = f.hp = CH[f.kind].hp; f.act = null; f.cd = [0, 0, 0]; f.z = 0;
  f.hurt = 0; f.jt = -1; f.inv = 1.2; f.dead = 0; f.dance = false; f.ghost = false;
  for (const k in f.st) f.st[k] = 0;
  if (f.kind === 'monkey') growTree(f, true);
}
function startFight() {
  fighters = [mkFighter(0, sel[0].picks), mkFighter(1, sel[1].picks)];
  projs = []; traps = []; fx = []; floats = []; trees = []; winner = -1; phase = 'fight';
  fighters.forEach(f => { if (f.kind === 'monkey') growTree(f, true); });
  banner = { text: 'FIGHT!', t: 1.2 };
}

// 원숭이 패시브: 원숭이가 있는 한 근처에 항상 나무가 있다
function growTree(f, force) {
  let tr = trees.find(t => t.owner === f.side);
  const x = Math.max(MINX + 20, Math.min(MAXX - 20, f.x - f.face * 110));
  if (!tr) trees.push({ owner: f.side, x, grow: force ? 1 : 0 });
  else if (force || Math.abs(tr.x - f.x) > 330) { tr.x = x; tr.grow = 0; }
}

const foe = f => fighters[1 - f.side];
const speedOf = f => CH[f.kind].speed * (f.st.slow > 0 ? 0.5 : 1);

// ───────── 데미지/상태 ─────────
function addFloat(x, y, text, col) { floats.push({ x, y, text, col, t: 0 }); }
function hit(a, d, dmg, o = {}) {
  if (d.dead || d.inv > 0 || d.untouch) return false;
  if (a.st.blind > 0) dmg *= 0.5;
  if (a.st.pity > 0) dmg *= 0.7;
  if (d.st.defdown > 0) dmg *= 1.3;
  dmg = Math.round(dmg);
  d.hp -= dmg; d.flash = 0.15; d.inv = o.noInv ? 0 : 0.35;
  addFloat(d.x, GROUND - 190 - d.z, dmg, '#ffdd55');
  shake = Math.max(shake, 4);
  for (let i = 0; i < 6; i++) fx.push({ k: 'spark', x: d.x, y: GROUND - 90 - d.z, vx: (Math.random() - .5) * 360, vy: -Math.random() * 260, t: 0, life: .35 });
  if (o.stun) d.st.stun = Math.max(d.st.stun, o.stun);
  if (o.confuse) d.st.confuse = Math.max(d.st.confuse, o.confuse);
  if (o.blind) d.st.blind = Math.max(d.st.blind, o.blind);
  if (o.slow) d.st.slow = Math.max(d.st.slow, o.slow);
  if (o.defdown) d.st.defdown = Math.max(d.st.defdown, o.defdown);
  if (!o.noHurt) { d.act = null; d.hurt = Math.max(d.hurt, 0.28); d.dance = false; d.ghost = false; d.jt = -1; if (d.z > 0) d.z = 0; }
  d.vx = (o.kb || 0) * a.face;
  if (d.hp <= 0) { d.hp = 0; d.dead = 0.01; d.act = null; d.vx = 220 * a.face; shake = 10; }
  return true;
}
function inFront(a, reach, pad = 36) {
  const d = foe(a), r = reach * (a.st.blind > 0 ? 0.6 : 1);
  const dx = (d.x - a.x) * a.face;
  return dx > -pad && dx < r + pad && d.z < 90;
}
function melee(reach, dmg, kb, extra) {
  return { onActive(f) { fx.push({ k: 'swing', x: f.x + f.face * 40, y: GROUND - 110, face: f.face, t: 0, life: .18, r: reach });
    if (inFront(f, reach)) hit(f, foe(f), dmg, { kb, ...extra }); } };
}
function shoot(o) {
  return { onActive(f) {
    projs.push({ owner: f.side, kind: o.kind, x: f.x + f.face * 60, h: o.h || 100, vx: f.face * (o.speed * (f.st.blind > 0 ? .8 : 1)), life: o.life || 2, dmg: o.dmg, w: o.w || 26, pierce: !!o.pierce, hitDone: false, opts: o.opts || {}, t: 0, hz: o.hz || 80 });
    if (o.self) { f.hp = Math.max(1, f.hp - o.self); addFloat(f.x, GROUND - 190, o.self, '#ff7777'); }
  } };
}
function putTrap(kind, dist, life, dmg, opts, max) {
  return { onActive(f) {
    const mine = traps.filter(t => t.owner === f.side && t.kind === kind);
    if (mine.length >= max) traps.splice(traps.indexOf(mine[0]), 1);
    traps.push({ owner: f.side, kind, x: Math.max(MINX, Math.min(MAXX, f.x + f.face * dist)), life, dmg, opts, t: 0 });
  } };
}

// ───────── 스킬 ─────────
// startup(준비) → active(타격) → rec(마무리). 준비=프레임2, 타격=프레임3, 마무리=프레임4
const SKILLS = {
  buta: [
    { name: '방구가스', cd: 3, startup: .28, active: .12, rec: .3, ...shoot({ kind: 'gas', speed: 230, dmg: 9, w: 40, h: 70, life: 2.2, pierce: false, opts: { slow: 1.8, kb: 60 } }) },
    { name: '깔아뭉개기', cd: 1, startup: .25, active: .4, rec: .35,
      onActive(f) { f.vars.x0 = f.x; const d = foe(f); f.vars.x1 = Math.max(MINX, Math.min(MAXX, d.x - f.face * 60)); f.vars.dist = Math.min(380, Math.abs(f.vars.x1 - f.x)); f.vars.x1 = f.x + f.face * f.vars.dist; },
      tick(f, ph, p) { if (ph === 'active') { f.x = f.vars.x0 + (f.vars.x1 - f.vars.x0) * p; f.z = Math.sin(p * Math.PI) * 170; } else if (ph === 'startup') f.z = 0; },
      onRec(f) { f.z = 0; shake = 8; fx.push({ k: 'ring', x: f.x, y: GROUND, t: 0, life: .35, col: '#ffe9a0' });
        const d = foe(f); if (Math.abs(d.x - f.x) < 120 && d.z < 40) hit(f, d, 12, { stun: .5, kb: 140 }); } },
    { name: '삐진척', cd: 11, startup: .25, active: .6, rec: .3,
      onActive(f) { const d = foe(f); d.st.pity = 5; d.st.slow = Math.max(d.st.slow, 2); fx.push({ k: 'text', x: d.x, y: GROUND - 200, text: 'T_T', t: 0, life: 1 }); f.vars.pout = 1; } },
  ],
  chuk: [
    { name: '척추 휘두르기', cd: 1, startup: .26, active: .12, rec: .34, ...melee(185, 10, 140) },
    { name: '척추 던지기', cd: 4.5, startup: .3, active: .1, rec: .35, ...shoot({ kind: 'spine', speed: 560, dmg: 19, w: 34, h: 100, life: 1.8, opts: { kb: 120 }, self: 3 }) },
    { name: '가시목털 함정', cd: 15, startup: .3, active: .1, rec: .3, ...putTrap('thorn', 260, 10, 13, { slow: 2, kb: 60 }, 2) },
  ],
  monkey: [
    { name: '나무 춤', cd: 10, startup: .28, active: 1.7, rec: .35,
      onStart(f) { f.vars.x0 = f.x; f.untouch = true; f.dance = false; },
      tick(f, ph, p) { const tr = trees.find(t => t.owner === f.side); const tx = tr ? tr.x : f.x;
        if (ph === 'startup') { f.x = f.vars.x0 + (tx - f.vars.x0) * p; f.z = 150 * p; f.dance = false; }
        else if (ph === 'active') { f.x = tx; f.z = 150; f.dance = true; }
        else { f.dance = false; f.x = tx + (f.vars.x0 > tx ? 1 : -1) * 50 * p; f.z = 150 * (1 - p); } },
      onActive(f) { const d = foe(f); if (Math.abs(d.x - f.x) < 460) { d.st.confuse = Math.max(d.st.confuse, 1.8); fx.push({ k: 'text', x: d.x, y: GROUND - 200, text: '♪♬', t: 0, life: 1 }); } },
      onRec(f) { f.untouch = false; f.z = 0; f.dance = false; } },
    { name: '떨어지는 척', cd: 1, startup: .45, active: .25, rec: .3,
      onStart(f) { f.vars.x0 = f.x; f.untouch = true; f.ghost = false; },
      tick(f, ph, p) { const tr = trees.find(t => t.owner === f.side); const tx = tr ? tr.x : f.x;
        if (ph === 'startup') { f.x = f.vars.x0 + (tx - f.vars.x0) * Math.min(1, p * 1.6); f.z = 520 * p; f.ghost = p > .5; f.vars.tx = foe(f).x; }
        else if (ph === 'active') { f.ghost = false; const tx2 = f.vars.tx; f.x = tx + (tx2 - tx) * p; f.z = 520 * (1 - p * p); }
        else f.z = 0; },
      onRec(f) { f.untouch = false; f.z = 0; f.ghost = false; shake = 7; fx.push({ k: 'ring', x: f.x, y: GROUND, t: 0, life: .3, col: '#ffffff' });
        const d = foe(f); if (Math.abs(d.x - f.x) < 95 && d.z < 40) hit(f, d, 10, { kb: 150 }); } },
    { name: '바나나 껍질', cd: 4, startup: .2, active: .1, rec: .25, ...shoot({ kind: 'peel', speed: 380, dmg: 7, w: 30, h: 60, life: 1.8, opts: { stun: .9, kb: 0 } }) },
  ],
  apple: [
    { name: '초록사과', cd: 1.7, startup: .3, active: .1, rec: .3, ...shoot({ kind: 'apple', speed: 440, dmg: 10, w: 24, h: 120, life: 1.6, opts: { kb: 80 } }) },
    { name: '노래', cd: 10, startup: .55, active: .2, rec: .3,
      onActive(f) { fx.push({ k: 'notes', x: f.x, y: GROUND - 160, face: f.face, t: 0, life: .9 });
        if (inFront(f, 420)) { const d = foe(f);
          if (Math.random() < .5) hit(f, d, 3, { stun: 1.3, kb: 0, noInv: true }); else hit(f, d, 3, { defdown: 5, kb: 0, noInv: true }); } } },
    { name: '소설책', cd: 1, startup: .28, active: .12, rec: .34, ...melee(130, 10, 90) },
  ],
  baker: [
    { name: '이스트 투척', cd: 6.5, startup: .25, active: .1, rec: .3, ...shoot({ kind: 'yeast', speed: 400, dmg: 3, w: 30, h: 110, life: 1.8, opts: { blind: 3.5, kb: 30 } }) },
    { name: '수학 공식', cd: 10, startup: .5, active: .2, rec: .3,
      onActive(f) { const d = foe(f); if (Math.abs(d.x - f.x) < 440 && !d.untouch) { d.st.confuse = Math.max(d.st.confuse, 3); }
        fx.push({ k: 'math', x: d.x, y: GROUND - 220, t: 0, life: 1.4 }); } },
    { name: '바게트 휘두르기', cd: 1, startup: .25, active: .12, rec: .33, ...melee(170, 10, 100) },
  ],
};

function tryUse(f, i) {
  const sk = SKILLS[f.kind][i];
  if (f.act || f.jt >= 0 || f.hurt > 0 || f.st.stun > 0 || f.dead || f.cd[i] > 0 || banner && banner.t > .3) return;
  f.act = { sk, i, t: 0, ph: '', fired: { active: false, rec: false } }; f.cd[i] = sk.cd; f.vx = 0; f.vars = {};
  if (sk.onStart) sk.onStart(f);
}

// ───────── 업데이트 ─────────
function updateAct(f, dt) {
  const a = f.act, sk = a.sk; a.t += dt;
  const s = sk.startup, ac = sk.active, r = sk.rec;
  let ph, p;
  if (a.t < s) { ph = 'startup'; p = a.t / s; }
  else if (a.t < s + ac) { ph = 'active'; p = (a.t - s) / ac; }
  else if (a.t < s + ac + r) { ph = 'rec'; p = (a.t - s - ac) / r; }
  else { if (sk.onRec && !a.fired.rec) sk.onRec(f); f.act = null; return; }
  if (ph === 'active' && !a.fired.active) { a.fired.active = true; if (sk.onActive) sk.onActive(f); }
  if (ph === 'rec' && !a.fired.rec) { a.fired.rec = true; if (sk.onRec) sk.onRec(f); }
  a.ph = ph; if (sk.tick) sk.tick(f, ph, p);
}

function update(dt) {
  time += dt;
  if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
  if (phase !== 'fight') { fx.forEach(e => e.t += dt); return; }
  fighters.forEach(f => {
    const k = KEYS[f.side], o = foe(f);
    f.anim += dt;
    for (let i = 0; i < 3; i++) f.cd[i] = Math.max(0, f.cd[i] - dt);
    for (const s in f.st) f.st[s] = Math.max(0, f.st[s] - dt);
    f.inv = Math.max(0, f.inv - dt); f.flash = Math.max(0, f.flash - dt);
    if (f.dead) {
      f.dead += dt; f.x = Math.max(MINX, Math.min(MAXX, f.x + f.vx * dt)); f.vx *= .92;
      if (f.dead > 1.1) {
        if (f.idx === 0) { f.idx = 1; loadChar(f); f.x = f.side ? 720 : 240; banner = { text: CH[f.kind].name + ' 등장!', t: 1 }; }
        else { phase = 'over'; winner = 1 - f.side; }
      }
      return;
    }
    if (f.hurt > 0) { f.hurt -= dt; f.x += f.vx * dt; f.vx *= .9; if (f.hurt <= 0) f.vx = 0; }
    else if (f.act) { updateAct(f, dt); }
    else if (f.st.stun > 0) { /* 기절 */ }
    else if (!(banner && banner.t > .3)) {
      let dir = 0;
      if (down[k.right]) dir += 1; if (down[k.left]) dir -= 1;
      if (f.st.confuse > 0) dir = -dir;
      f.x += dir * speedOf(f) * dt;
      f.walk = dir !== 0;
      if (f.jt < 0 && down[k.jump]) f.jt = 0;
      if (f.jt >= 0) { f.jt += dt; const p = f.jt / .7; if (p >= 1) { f.jt = -1; f.z = 0; } else f.z = 230 * 4 * p * (1 - p); }
      for (let i = 0; i < 3; i++) if (down[k.s[i]]) { tryUse(f, i); if (f.act) break; }
    }
    if (!f.act) { f.untouch = false; }
    f.x = Math.max(MINX, Math.min(MAXX, f.x));
    if (!f.act && !f.dead && f.jt < 0) f.z = 0;
    if (f.kind === 'monkey' && !f.dead) growTree(f);
  });
  // 서로 겹치지 않게
  const [a, b] = fighters;
  if (!a.dead && !b.dead && a.z < 60 && b.z < 60) {
    const gap = 76, d = b.x - a.x;
    if (Math.abs(d) < gap) { const push = (gap - Math.abs(d)) / 2, s = d >= 0 ? 1 : -1;
      a.x = Math.max(MINX, Math.min(MAXX, a.x - s * push)); b.x = Math.max(MINX, Math.min(MAXX, b.x + s * push)); }
  }
  fighters.forEach(f => { if (!f.act) f.face = foe(f).x >= f.x ? 1 : -1; });

  // 투사체
  projs.forEach(p => {
    p.t += dt; p.x += p.vx * dt; p.life -= dt;
    const d = fighters[1 - p.owner];
    if (!p.hitDone && !d.dead && Math.abs(p.x - d.x) < 40 + p.w / 2 && d.z < p.hz) {
      const att = fighters[p.owner];
      if (hit(att, d, p.dmg, p.opts)) { if (!p.pierce) p.hitDone = true; }
      if (p.hitDone) p.life = 0;
    }
    if (p.x < 0 || p.x > W) p.life = 0;
  });
  projs = projs.filter(p => p.life > 0);

  // 함정
  traps.forEach(t => {
    t.t += dt; t.life -= dt;
    const d = fighters[1 - t.owner];
    if (!d.dead && d.z < 30 && Math.abs(d.x - t.x) < 48 && t.t > .4) {
      if (hit(fighters[t.owner], d, t.dmg, { ...t.opts, noInv: false })) {
        t.life = 0; fx.push({ k: 'ring', x: t.x, y: GROUND, t: 0, life: .3, col: t.kind === 'peel' ? '#ffe135' : '#ff6a5a' });
        if (t.kind === 'peel') { d.vx = 0; }
      }
    }
  });
  traps = traps.filter(t => t.life > 0);
  trees.forEach(t => t.grow = Math.min(1, t.grow + dt * 2.5));
  // 원숭이가 없으면 나무 제거
  trees = trees.filter(t => { const f = fighters[t.owner]; return f && f.kind === 'monkey' && !f.dead; });

  fx.forEach(e => { e.t += dt; if (e.k === 'spark') { e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 900 * dt; } });
  fx = fx.filter(e => e.t < e.life);
  floats.forEach(e => e.t += dt); floats = floats.filter(e => e.t < .9);
  shake = Math.max(0, shake - dt * 24);
}

// ───────── 그리기 ─────────
function txt(s, x, y, size, col, align = 'center', bold = true) {
  ctx.font = `${bold ? '700 ' : ''}${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000'; ctx.fillText(s, x + 2, y + 2); ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function drawStage() {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#3b2a6b'); g.addColorStop(.55, '#d9658a'); g.addColorStop(1, '#ffb36b');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND);
  ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(700, 190, 54, 0, 7); ctx.fill();
  ctx.fillStyle = '#4a2b63'; // 산
  for (let i = 0; i < 8; i++) { const x = i * 150 - 40, h = 100 + (i * 37 % 70); ctx.beginPath(); ctx.moveTo(x, GROUND - 30); ctx.lineTo(x + 90, GROUND - 30 - h); ctx.lineTo(x + 180, GROUND - 30); ctx.fill(); }
  ctx.fillStyle = '#2a1f3d'; ctx.fillRect(0, GROUND - 30, W, 30);
  ctx.fillStyle = '#6b4a35'; ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = '#85603f'; for (let x = 0; x < W; x += 40) ctx.fillRect(x, GROUND, 20, 6);
  ctx.fillStyle = '#4e3524'; for (let x = 20; x < W; x += 40) ctx.fillRect(x, GROUND + 40, 20, 6);
}
function drawTree(t) {
  const s = t.grow, x = t.x, b = GROUND;
  ctx.save(); ctx.translate(x, b); ctx.scale(1, s); ctx.translate(-x, -b);
  ctx.fillStyle = '#5e3a18'; ctx.fillRect(x - 20, b - 240, 40, 240);
  ctx.fillStyle = '#8a5a2e'; ctx.fillRect(x - 12, b - 240, 28, 240);
  ctx.fillStyle = '#5e3a18'; for (let y = b - 220; y < b; y += 36) ctx.fillRect(x - 6 + (y % 3) * 4, y, 4, 14);
  const L = (cx, cy, r, c) => { ctx.fillStyle = c; ctx.fillRect(cx - r, cy - r * .7, r * 2, r * 1.4); ctx.fillRect(cx - r * .7, cy - r, r * 1.4, r * 2); };
  L(x, b - 250, 56, '#2a7a32'); L(x - 42, b - 225, 38, '#3fa045'); L(x + 42, b - 225, 38, '#3fa045'); L(x - 8, b - 280, 32, '#7fd36a');
  ctx.fillStyle = '#ffe135'; [[-36, -235], [26, -265], [48, -222]].forEach(([dx, dy]) => ctx.fillRect(x + dx, b + dy, 14, 18));
  ctx.restore();
}
function drawFighter(f) {
  if (f.dead && f.dead > 1) return;
  const sw = SF.W * SC, sh = SF.H * SC;
  let fr = 0;
  if (f.act) fr = { startup: 2, active: 3, rec: 4 }[f.act.ph] || 2;
  else if (f.hurt > 0 || f.st.stun > 0) fr = 4;
  else fr = (Math.floor(f.anim * (f.walk ? 7 : 2.5)) % 2);
  if (f.dance) fr = [0, 2, 3, 4][Math.floor(f.anim * 8) % 4];
  if (f.dead) fr = 4;
  const img = SF.canvas(SPR[f.kind], fr);
  const cx = SF.CX * SC;
  const y = GROUND - sh - f.z;
  // 그림자
  ctx.fillStyle = '#0005'; ctx.beginPath(); ctx.ellipse(f.x, GROUND + 4, 60 - f.z * .08, 10, 0, 0, 7); ctx.fill();
  if (f.ghost) return;
  ctx.save();
  if (f.inv > 0 && !f.hurt && Math.floor(time * 20) % 2) ctx.globalAlpha = .55;
  if (f.dead) { ctx.globalAlpha = Math.max(0, 1 - f.dead / 1.1); }
  if (f.flash > 0) ctx.filter = 'brightness(3)';
  ctx.translate(f.x, y);
  if (f.face < 0) ctx.scale(-1, 1);
  ctx.drawImage(img, -cx, 0, sw, sh);
  ctx.restore();
  // 상태 아이콘
  const tags = [];
  if (f.st.stun > 0) tags.push(['기절', '#ffd23f']);
  if (f.st.confuse > 0) tags.push(['혼란', '#c77dff']);
  if (f.st.blind > 0) tags.push(['실명', '#e8e0c8']);
  if (f.st.slow > 0) tags.push(['둔화', '#6ec6ff']);
  if (f.st.defdown > 0) tags.push(['방어↓', '#ff7a7a']);
  if (f.st.pity > 0) tags.push(['동정', '#ffa6c9']);
  tags.forEach((t, i) => txt(t[0], f.x, y - 12 - i * 18, 14, t[1]));
  if (f.st.stun > 0) for (let i = 0; i < 3; i++) { const a = f.anim * 6 + i * 2.1; ctx.fillStyle = '#ffe066'; ctx.fillRect(f.x + Math.cos(a) * 34 - 4, y + 18 + Math.sin(a) * 8 - 4, 8, 8); }
}
function drawProj(p) {
  const x = p.x, y = GROUND - p.h;
  if (p.kind === 'gas') { for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#9be34a', '#6cc02d', '#c8f27a', '#7fd13a'][i]; const r = 14 + Math.sin(p.t * 8 + i) * 4; ctx.beginPath(); ctx.arc(x - i * 14 * Math.sign(p.vx), y + Math.sin(p.t * 6 + i * 2) * 6, r, 0, 7); ctx.fill(); } }
  else if (p.kind === 'apple') { ctx.fillStyle = '#6fb81f'; ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.fill(); ctx.fillStyle = '#c4f060'; ctx.fillRect(x - 8, y - 8, 6, 6); ctx.fillStyle = '#5e3a18'; ctx.fillRect(x - 1, y - 20, 4, 8); }
  else if (p.kind === 'yeast') { for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#f1e2b0' : '#d8c38a'; ctx.fillRect(x - i * 7 * Math.sign(p.vx) - 5, y + Math.sin(p.t * 20 + i) * 10 - 5, 10, 10); } }
  else if (p.kind === 'peel') { ctx.save(); ctx.translate(x, y); ctx.rotate(p.t * 14); ctx.fillStyle = '#ffe135'; ctx.fillRect(-16, -5, 32, 10); ctx.fillStyle = '#f2c200'; ctx.fillRect(-12, 1, 24, 4); ctx.fillStyle = '#6e5a10'; ctx.fillRect(14, -7, 6, 6); ctx.restore(); }
  else if (p.kind === 'spine') { ctx.save(); ctx.translate(x, y); ctx.rotate(p.t * 18 * Math.sign(p.vx));
    for (let i = -3; i <= 3; i++) { ctx.fillStyle = i % 2 ? '#f3ecd2' : '#fffbe6'; ctx.fillRect(i * 9 - 5, -6, 10, 12); ctx.fillStyle = '#b9ad84'; ctx.fillRect(i * 9 - 5, 3, 10, 3); } ctx.restore(); }
}
function drawTrap(t) {
  const x = t.x, y = GROUND, bl = t.life < 2 && Math.floor(time * 8) % 2;
  if (bl) return;
  if (t.kind === 'peel') { ctx.fillStyle = '#ffe135'; ctx.fillRect(x - 30, y - 8, 60, 8); ctx.fillRect(x - 20, y - 16, 14, 8); ctx.fillRect(x + 8, y - 16, 14, 8); ctx.fillStyle = '#f2c200'; ctx.fillRect(x - 6, y - 12, 12, 6); ctx.fillStyle = '#6e5a10'; ctx.fillRect(x - 4, y - 18, 8, 6); }
  else { ctx.fillStyle = '#d8452e'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 14 - 8, y); ctx.lineTo(x + i * 14, y - 30 + Math.abs(i) * 6); ctx.lineTo(x + i * 14 + 8, y); ctx.fill(); } ctx.fillStyle = '#a02a1a'; ctx.fillRect(x - 40, y - 4, 80, 4); }
}
function drawFx(e) {
  const p = e.t / e.life;
  if (e.k === 'spark') { ctx.fillStyle = '#fff3a0'; ctx.fillRect(e.x - 3, e.y - 3, 6, 6); }
  else if (e.k === 'ring') { ctx.strokeStyle = e.col; ctx.lineWidth = 6 * (1 - p) + 1; ctx.beginPath(); ctx.ellipse(e.x, e.y, 30 + p * 120, 6 + p * 22, 0, 0, 7); ctx.stroke(); }
  else if (e.k === 'swing') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 8 * (1 - p); ctx.beginPath(); const r = e.r * .6; ctx.arc(e.x - e.face * 20, e.y + 20, r, e.face > 0 ? -1.2 : Math.PI - .4, e.face > 0 ? .4 : Math.PI + 1.2); ctx.stroke(); }
  else if (e.k === 'text') txt(e.text, e.x, e.y - p * 50, 40, '#fff');
  else if (e.k === 'notes') { for (let i = 0; i < 6; i++) { const q = Math.min(1, p * 1.1 + i * .02); txt(['♪', '♬', '♩'][i % 3], e.x + e.face * (60 + q * 380) , e.y + Math.sin(q * 9 + i) * 36 - i * 4, 34, '#ffe066'); } }
  else if (e.k === 'math') { ['∫x²dx', 'Σ', 'π≠3', 'e^iπ+1', '√-1', 'a²+b²'].forEach((s, i) => txt(s, e.x + Math.cos(i * 1.4 + e.t * 2) * 70, e.y + Math.sin(i * 1.9 + e.t * 2) * 50 - p * 30, 22, '#9ef0ff')); }
}
function drawHUD() {
  fighters.forEach((f, i) => {
    const left = i === 0, bx = left ? 30 : W - 30 - 370, by = 24, bw = 370, bh = 26;
    ctx.fillStyle = '#000b'; ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
    ctx.fillStyle = '#3a1a1a'; ctx.fillRect(bx, by, bw, bh);
    const ratio = f.hp / f.maxhp; ctx.fillStyle = ratio > .5 ? '#4cd964' : ratio > .25 ? '#ffcc33' : '#ff4b3a';
    const w = bw * ratio; ctx.fillRect(left ? bx : bx + bw - w, by, w, bh);
    txt(`P${i + 1} ${CH[f.kind].name}  ${Math.ceil(f.hp)}/${f.maxhp}`, bx + bw / 2, by + bh / 2, 17, '#fff');
    // 대기 캐릭터
    const nx = f.idx === 0 ? f.picks[1] : null;
    if (nx) { txt('다음', left ? bx + 20 : bx + bw - 20, by + 46, 13, '#aaa'); const im = SF.canvas(SPR[nx], 0); ctx.drawImage(im, left ? bx + 40 : bx + bw - 40 - 56, by + 30, 56, 40); txt(CH[nx].name, left ? bx + 110 : bx + bw - 110, by + 50, 14, '#ddd', left ? 'left' : 'right'); }
    else txt('마지막 캐릭터!', left ? bx : bx + bw, by + 46, 14, '#ff9a8a', left ? 'left' : 'right');
    txt(`점프 ${KEYS[i].jlabel}`, left ? 30 : W - 150, H - 74, 13, '#9fd0ff', left ? 'left' : 'right');
    // 스킬 쿨타임
    SKILLS[f.kind].forEach((sk, j) => {
      const sx = (left ? 30 : W - 150 - 3 * 126 - 2 * 6) + j * 132, sy = H - 62;
      ctx.fillStyle = '#000b'; ctx.fillRect(sx, sy, 126, 46);
      const ready = f.cd[j] <= 0; ctx.fillStyle = ready ? '#2f6bff' : '#444'; ctx.fillRect(sx, sy, 34, 46);
      txt(KEYS[i].label[j], sx + 17, sy + 23, 22, '#fff');
      txt(sk.name, sx + 38, sy + 16, 12, '#fff', 'left');
      if (!ready) { ctx.fillStyle = '#ffffff30'; ctx.fillRect(sx + 34, sy, 92 * (f.cd[j] / sk.cd), 46); txt(f.cd[j].toFixed(1), sx + 38, sy + 34, 13, '#ffcc66', 'left'); }
      else txt('준비됨', sx + 38, sy + 34, 12, '#7dff9a', 'left');
    });
  });
  txt('VS', W / 2, 38, 28, '#ffd866');
}
function drawSelect() {
  ctx.fillStyle = '#1b1838'; ctx.fillRect(0, 0, W, H);
  txt('스트리트 파이터', W / 2, 44, 36, '#ffd866');
  txt('각자 캐릭터 2명을 고르세요 (고른 순서대로 등장 · 같은 캐릭터 중복 가능)', W / 2, 84, 17, '#ccc');
  ORDER.forEach((id, i) => {
    const x = 70 + i * 170, y = 120;
    ctx.fillStyle = '#2e2b50'; ctx.fillRect(x, y, 160, 150);
    ctx.drawImage(SF.canvas(SPR[id], Math.floor(time * 2.5) % 2), x - 26, y - 6, 56 * 3.2, 40 * 3.2);
    txt(CH[id].name, x + 80, y + 128, 17, '#fff');
    sel.forEach((s, p) => { if (!s.done && s.cur === i) { ctx.strokeStyle = p ? '#ff6a6a' : '#5bb0ff'; ctx.lineWidth = 5; ctx.strokeRect(x + (p ? 6 : 0), y + (p ? 6 : 0), 160 - (p ? 12 : 0), 150 - (p ? 12 : 0)); txt('P' + (p + 1), x + (p ? 140 : 20), y + 14, 16, p ? '#ff6a6a' : '#5bb0ff'); } });
  });
  sel.forEach((s, p) => {
    const y = 300 + p * 100, col = p ? '#ff6a6a' : '#5bb0ff';
    txt(`P${p + 1}`, 60, y + 36, 28, col);
    for (let k = 0; k < 2; k++) {
      const x = 110 + k * 190; ctx.fillStyle = '#2e2b50'; ctx.fillRect(x, y, 170, 76);
      if (s.picks[k]) { ctx.drawImage(SF.canvas(SPR[s.picks[k]], 0), x + 4, y + 4, 56 * 1.8, 40 * 1.8); txt(CH[s.picks[k]].name, x + 130, y + 38, 15, '#fff'); txt(k ? '두번째' : '첫번째', x + 130, y + 62, 12, '#aaa'); }
      else txt(k < s.picks.length + 0 ? '' : (k === s.picks.length ? '선택 중…' : '—'), x + 85, y + 38, 16, '#667');
    }
    txt(s.done ? '준비 완료!' : '', 560, y + 38, 22, '#7dff9a', 'left');
  });
  txt(`P1: A/D 이동 · Q 선택 · E 취소      P2: 4/6 이동 · 7 선택 · 9 취소`, W / 2, 500, 15, '#aab');
  if (sel[0].done && sel[1].done) txt('Enter 또는 Space 로 시작!', W / 2, 525, 20, '#ffd866');
  else txt('조작: 좌/우 이동 · 점프(P1 S / P2 5) · 스킬 3개 (P1 Q W E / P2 넘버패드 7 8 9)', W / 2, 525, 15, '#889');
}
function drawOver() {
  ctx.fillStyle = '#000a'; ctx.fillRect(0, 0, W, H);
  txt(`P${winner + 1} 승리!`, W / 2, 220, 70, winner ? '#ff6a6a' : '#5bb0ff');
  txt('Enter 또는 Space 로 다시 선택', W / 2, 300, 22, '#fff');
}

function render() {
  if (phase === 'select') { drawSelect(); return; }
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
  drawStage();
  trees.forEach(drawTree);
  traps.forEach(drawTrap);
  [...fighters].sort((a, b) => a.z - b.z).forEach(drawFighter);
  projs.forEach(drawProj);
  fx.forEach(drawFx);
  floats.forEach(e => txt(e.text, e.x, e.y - e.t * 60, 26, e.col));
  ctx.restore();
  drawHUD();
  if (banner) txt(banner.text, W / 2, 230, 64, '#ffd866');
  if (phase === 'over') drawOver();
}

let last = performance.now();
function loop(now) { const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now; update(dt); render(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
window.__sf = { get fighters() { return fighters; }, get phase() { return phase; }, down, sel, startFight, onPress };
})();

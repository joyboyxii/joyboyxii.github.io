/* Background · PS2 nebula code rain
   Deep, layered binary rain falling through a slow blue nebula, with coloured light streaks curving past.
   Light and dark palettes follow the site theme (html.dark). Pauses when the tab is hidden; a still frame for reduced motion. */
(() => {
  const root = document.documentElement;
  const calm = () => root.classList.contains("calm") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas"); cv.id = "coderain"; cv.setAttribute("aria-hidden", "true");
  document.body.prepend(cv);
  const g = cv.getContext("2d", { alpha: false });
  const LV = 7, SIZES = [6, 7, 8, 9, 11, 13, 16], BLUR = [0, 0, 0, 0, 0, .7, 1.5];
  const GLYPHS = "01";
  const PAL = {
    dark: { base0: "#02040f", base1: "#000000", neb: [[30, 60, 200, .34], [50, 70, 170, .26], [70, 40, 160, .2]], col: "#3566ff", head: "#e3ecff", glow: 1, streak: ["255,80,100", "80,255,140", "180,110,255", "110,180,255", "255,200,80", "80,240,255"], streakA: 1 },
    light: { base0: "#f4f7ff", base1: "#dfe7ff", neb: [[120, 150, 255, .30], [150, 130, 255, .22], [100, 180, 255, .18]], col: "#3150d8", head: "#0b1a8a", glow: .35, streak: ["225,40,80", "20,160,90", "120,70,230", "40,100,240", "230,150,20", "20,170,210"], streakA: .8 }
  };
  /* the nebula takes on each section's colour as you scroll: blue (intro, experience), crimson (projects), violet (certifications + footer) */
  const SECNEB = {
    dark: { blue: [[30, 60, 200, .34], [50, 70, 170, .26], [70, 40, 160, .2]], red: [[200, 30, 60, .34], [150, 25, 85, .26], [90, 30, 150, .18]], violet: [[115, 50, 215, .36], [160, 60, 205, .25], [70, 50, 190, .2]] },
    light: { blue: [[120, 150, 255, .30], [150, 130, 255, .22], [100, 180, 255, .18]], red: [[255, 120, 145, .30], [245, 140, 185, .22], [170, 150, 255, .16]], violet: [[175, 135, 255, .32], [215, 145, 255, .22], [140, 160, 255, .18]] }
  };
  const SECS = [["top", "blue"], ["experience", "blue"], ["projects", "red"], ["certifications", "violet"]];
  let tops = [], cur = null, painted = null;
  const measure = () => { tops = SECS.map(([id, c]) => { const e = document.getElementById(id); return e ? [e.getBoundingClientRect().top + scrollY, c] : null; }).filter(Boolean); };
  const secTarget = () => {
    const mid = scrollY + innerHeight * .5; let c = "blue";
    for (const [top, k] of tops) if (mid >= top) c = k;
    return SECNEB[root.classList.contains("dark") ? "dark" : "light"][c];
  };
  const blend = (dt, snap) => {
    const tg = secTarget(); if (!cur) cur = tg.map((x) => x.slice());
    const k = snap ? 1 : 1 - Math.exp(-dt * 1.6);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) cur[i][j] += (tg[i][j] - cur[i][j]) * k;
  };
  const drift = () => painted && cur.some((c, i) => c.some((v, j) => Math.abs(v - painted[i][j]) > (j < 3 ? 1.5 : .006)));
  let acc = 0, W = 0, H = 0, dpr = 1, pal, sprites = {}, S = [], P = [], last = 0, t = 0, raf = 0, sy = scrollY;

  const buildSprites = () => {
    sprites = {};
    for (let l = 0; l < LV; l++) for (const ch of GLYPHS) for (const h of [0, 1]) {
      const fs = SIZES[l] * dpr, pad = Math.ceil(fs * .8 + BLUR[l] * 3 * dpr), c = document.createElement("canvas");
      c.width = Math.ceil(fs * .7) + pad * 2; c.height = Math.ceil(fs) + pad * 2; const x = c.getContext("2d");
      x.font = `600 ${fs}px ui-monospace,Menlo,Consolas,monospace`; x.textBaseline = "top";
      if (BLUR[l]) x.filter = `blur(${BLUR[l] * dpr}px)`;
      x.shadowColor = h ? pal.head : pal.col; x.shadowBlur = fs * (h ? .8 : .45) * pal.glow;
      x.fillStyle = h ? pal.head : pal.col; x.fillText(ch, pad, pad);
      if (h) { x.shadowBlur = 0; x.fillText(ch, pad, pad); }
      sprites[ch + l + h] = { c, ox: pad, oy: pad, fs };
    }
  };
  const target = () => Math.round(Math.min(130, (W * H) / (dpr * dpr) / 11000));
  const add = (y0) => {
    const z = Math.pow(Math.random(), 1.7), l = Math.min(LV - 1, Math.round(z * (LV - 1)));
    S.push({ x: Math.random() * W, y: y0 ?? -Math.random() * H * .5, z, l, v: (90 + z * 300) * dpr * (.8 + Math.random() * .4), n: (12 + Math.random() * 15) | 0, ch: Array.from({ length: 26 }, () => GLYPHS[(Math.random() * 2) | 0]), m: 0 });
  };
  const size = () => {
    dpr = Math.min(1.5, devicePixelRatio || 1);
    W = cv.width = Math.round(innerWidth * dpr); H = cv.height = Math.round(innerHeight * dpr);
    buildSprites(); S = []; for (let i = 0; i < target(); i++) add(Math.random() * H * 1.2 - H * .2);
  };
  const theme = () => { pal = root.classList.contains("dark") ? PAL.dark : PAL.light; };
  /* the nebula changes slowly, so it is painted small (1/6 size) a few times a second and stretched: one blit per frame instead of four full-screen gradients */
  const nb = document.createElement("canvas"), nbg = nb.getContext("2d"); let nbT = -1;
  const paintNebula = () => {
    const w = nb.width = Math.max(32, Math.round(W / 6)), h = nb.height = Math.max(24, Math.round(H / 6));
    const bg = nbg.createRadialGradient(w * .5, h * .45, 0, w * .5, h * .5, Math.max(w, h) * .75); bg.addColorStop(0, pal.base0); bg.addColorStop(1, pal.base1);
    nbg.fillStyle = bg; nbg.fillRect(0, 0, w, h);
    if (!cur) blend(0, true);
    cur.forEach(([r, gg, b, a], i) => { r |= 0; gg |= 0; b |= 0;
      const x = w * (.48 + .14 * Math.sin(t * .11 + i * 2.1)), y = h * (.45 + .1 * Math.cos(t * .09 + i * 1.3)), rad = Math.max(w, h) * (.34 + .07 * i);
      const gr = nbg.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${r},${gg},${b},${a})`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      nbg.fillStyle = gr; nbg.fillRect(0, 0, w, h);
    });
    nbT = t; painted = cur.map((x) => x.slice());
  };
  const nebula = () => { if (nbT < 0 || t - nbT > .25 || (t - nbT > .05 && drift()) || nb.width !== Math.max(32, Math.round(W / 6))) paintNebula(); g.imageSmoothingEnabled = true; g.drawImage(nb, 0, 0, W, H); };
  const step = (dt) => {
    // depth parallax on scroll: near code moves more than far code
    const ds = (scrollY - sy) * dpr; sy = scrollY;
    while (S.length < target()) add();
    for (let i = S.length - 1; i >= 0; i--) {
      const s = S[i]; s.y += s.v * dt - ds * (.15 + s.z * .55);
      if ((s.m += dt) > .09) { s.m = 0; s.ch[(Math.random() * 26) | 0] = GLYPHS[(Math.random() * 2) | 0]; }
      if (s.y - s.n * SIZES[s.l] * dpr * 1.1 > H + 20 || s.y < -H * 1.2) S.splice(i, 1);
    }
    S.sort((a, b) => a.z - b.z);
    if (Math.random() < 1.3 * dt) { const z = Math.random(); P.push({ x: (Math.random() * 1.2 - .1) * W, y: (Math.random() * .6 - .3) * H, z, v: (200 + z * 480) * dpr, a: (Math.random() < .5 ? 1 : -1) * (.35 + Math.random() * .35), c: pal.streak[(Math.random() * pal.streak.length) | 0], cu: (Math.random() - .5) * 1.2, t: 0 }); }
    for (const p of P) { p.t += dt; p.a += p.cu * dt; p.x += Math.sin(p.a) * p.v * dt; p.y += Math.cos(p.a) * p.v * dt; }
    for (let i = P.length - 1; i >= 0; i--) if (P[i].y > H + 200 || P[i].x < -300 || P[i].x > W + 300) P.splice(i, 1);
  };
  const draw = () => {
    nebula();
    for (const s of S) {
      const fs = SIZES[s.l] * dpr, gap = fs * 1.12, base = .3 + .7 * s.z;
      for (let k = 0; k < s.n; k++) {
        const y = s.y - k * gap; if (y < -30 || y > H + 30) continue;
        const sp = sprites[s.ch[k % 26] + s.l + (k ? 0 : 1)];
        g.globalAlpha = k ? base * Math.pow(1 - k / s.n, 1.5) * .9 : base; g.drawImage(sp.c, s.x - sp.ox, y - sp.oy);
      }
    }
    g.globalAlpha = 1;
    for (const p of P) {
      const f = Math.min(1, p.t / .45), ux = Math.sin(p.a), uy = Math.cos(p.a), len = (50 + p.z * 160) * dpr * f, tx = p.x - ux * len, ty = p.y - uy * len;
      const gr = g.createLinearGradient(tx, ty, p.x, p.y); gr.addColorStop(0, `rgba(${p.c},0)`); gr.addColorStop(1, `rgba(${p.c},${(.4 + p.z * .55) * pal.streakA * f})`);
      g.strokeStyle = gr; g.lineWidth = (.8 + p.z * 2) * dpr; g.lineCap = "round"; g.beginPath(); g.moveTo(tx, ty); g.lineTo(p.x, p.y); g.stroke();
      const hg = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, (5 + p.z * 13) * dpr); hg.addColorStop(0, `rgba(255,255,255,${(.55 + p.z * .4) * pal.streakA * f})`); hg.addColorStop(.35, `rgba(${p.c},${.38 * pal.streakA * f})`); hg.addColorStop(1, `rgba(${p.c},0)`);
      g.fillStyle = hg; g.fillRect(p.x - 24 * dpr, p.y - 24 * dpr, 48 * dpr, 48 * dpr);
    }
  };
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; t += dt;
    if (calm()) { if (sy !== scrollY) { sy = scrollY; blend(0, true); nbT = -1; draw(); } return; }
    acc += dt; const moving = scrollY !== sy;
    if (!moving && acc < 1 / 32) return;
    blend(acc); step(acc); draw(); acc = 0;
  };
  /* the original star map now only shows behind the footer (signature section stays exactly as it was) */
  const foot = document.querySelector(".footer");
  const clipStarmap = () => {
    const sm = document.getElementById("starmap"); if (!sm || !foot) return;
    const top = foot.getBoundingClientRect().top;
    if (top >= innerHeight) { if (sm.style.visibility !== "hidden") sm.style.visibility = "hidden"; return; }
    sm.style.visibility = ""; sm.style.clipPath = `inset(${Math.max(0, Math.round(top))}px 0 0 0)`;
  };
  addEventListener("scroll", clipStarmap, { passive: true }); addEventListener("resize", clipStarmap); setTimeout(clipStarmap, 50); setTimeout(clipStarmap, 600);
  measure(); addEventListener("load", measure); setInterval(() => { if (!document.hidden) measure(); }, 2000);
  theme(); size(); draw();
  addEventListener("resize", () => { clearTimeout(size.t); size.t = setTimeout(() => { size(); measure(); }, 150); }, { passive: true });
  new MutationObserver(() => { const was = pal; theme(); if (pal !== was) { buildSprites(); blend(0, true); nbT = -1; draw(); } }).observe(root, { attributes: true, attributeFilter: ["class"] });
  raf = requestAnimationFrame(loop);
})();

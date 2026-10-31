/* =====================================================================
   WORLD · "Final Destination: the network"
   A Smash-style stage world behind the whole page:
   · the DARK portion — deep-space nebula, stars, drifting cmdlets, the ROUTER planet
   · the LIGHT portion — a glowing horizon and a reflective data-grid floor that
     rushes toward you as you scroll; its colour phases change per section
     (blue → violet → ember → teal), like FD in Ultimate.
   · floating FD platforms, each carrying a DIFFERENT network topology
     (star LAN, spine-leaf DC, DMZ, SOC/SIEM, AI pipeline, ring, SD-WAN mesh,
     zero trust, site-to-site VPN). A backbone cable drops from each stage to
     the next, so traffic literally flows down the page with the content.
   ===================================================================== */
(() => {
  const root = document.documentElement;
  const reduced = () => root.classList.contains("calm") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(pointer: coarse)").matches || innerWidth < 760;
  const fine = matchMedia("(pointer: fine)").matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];

  const bg = document.createElement("canvas"); bg.id = "world"; bg.setAttribute("aria-hidden", "true");
  const fg = document.createElement("canvas"); fg.id = "world-fg"; fg.setAttribute("aria-hidden", "true");
  document.body.prepend(bg); document.body.appendChild(fg);
  const b = bg.getContext("2d"), f = fg.getContext("2d");

  let W = 0, H = 0, docH = 0, dark = true, P = null;
  let stars = [], stages = [], far = [], trunks = [], texts = [], nets = [], wisps = [], motes = [], fx = [], planet = null, nebula = null;
  let mx = 0, my = 0, smx = 0, smy = 0, lastY = scrollY, vel = 0, fgDirty = true, phaseTops = [];

  /* ---------- palettes ---------- */
  const PAL = {
    dark: { neb: ["107,63,214", "43,85,214", "192,64,143", "31,163,184", "120,80,230", "70,110,240"], nebA: [.025, .075], blend: "lighter",
      star: "#ffffff", starA: 1, stroke: "rgba(175,195,255,.95)", fill: "rgba(26,34,90,.92)", glow: "rgba(120,150,255,.85)", screen: "rgba(8,12,36,.96)", code: "rgba(110,231,168,.95)",
      cable: "rgba(120,150,255,", packetGlow: "127,166,255", text: "rgba(170,195,255,", ping: "127,200,255", red: "255,110,110", ai: "190,140,255",
      planet: ["#5b54c9", "#2b2a86", "#0a0b2a"], ring: "rgba(70,110,230,.9)", ringHi: "rgba(170,200,255,.75)", wisp: ["150,125,240", "60,45,150", "215,150,255"], wispA: .4,
      plat: { top: ["#3a4bb0", "#1b2266"], face: "#0d1240", under: ["#141a52", "#05071c"], rim: "150,200,255", trace: "120,170,255" } },
    light: { neb: ["150,130,240", "120,160,250", "240,170,210", "130,210,225", "180,160,255", "160,190,255"], nebA: [.04, .1], blend: "source-over",
      star: "#3a4a9a", starA: .35, stroke: "#3b52b4", fill: "rgba(255,255,255,.95)", glow: "rgba(90,120,230,.35)", screen: "#0f1638", code: "#6ee7a8",
      cable: "rgba(70,100,210,", packetGlow: "43,85,214", text: "rgba(50,70,160,", ping: "43,85,214", red: "220,60,60", ai: "120,70,220",
      planet: ["#e6eaff", "#a6b3ef", "#5f70c8"], ring: "rgba(60,95,210,.85)", ringHi: "rgba(255,255,255,.85)", wisp: ["205,212,250", "160,170,230", "235,215,255"], wispA: .5,
      plat: { top: ["#ffffff", "#dfe5fb"], face: "#c3cdf3", under: ["#d4dbf7", "#aab6ea"], rim: "70,105,220", trace: "80,110,220" } }
  };
  /* FD-style colour phases, one per section: sky top / sky mid / horizon light / floor / grid */
  const PHASES = {
    dark: [
      { top: [3, 4, 22], mid: [10, 14, 54], glow: [120, 178, 255], floor: [20, 32, 104], grid: [140, 190, 255] },
      { top: [6, 3, 24], mid: [24, 10, 62], glow: [200, 125, 255], floor: [46, 20, 112], grid: [210, 150, 255] },
      { top: [10, 4, 20], mid: [42, 14, 42], glow: [255, 150, 92], floor: [84, 34, 56], grid: [255, 175, 120] },
      { top: [2, 10, 22], mid: [6, 34, 54], glow: [90, 232, 205], floor: [10, 62, 80], grid: [120, 245, 220] },
      { top: [4, 6, 26], mid: [16, 22, 72], glow: [175, 205, 255], floor: [34, 48, 132], grid: [190, 215, 255] }],
    light: [
      { top: [244, 246, 255], mid: [228, 233, 252], glow: [255, 255, 255], floor: [200, 211, 250], grid: [70, 100, 210] },
      { top: [247, 243, 255], mid: [233, 225, 252], glow: [255, 251, 255], floor: [214, 199, 248], grid: [120, 80, 210] },
      { top: [255, 247, 241], mid: [250, 231, 222], glow: [255, 252, 246], floor: [246, 208, 192], grid: [200, 100, 60] },
      { top: [239, 250, 250], mid: [219, 242, 240], glow: [255, 255, 255], floor: [186, 232, 226], grid: [30, 140, 130] },
      { top: [244, 246, 255], mid: [228, 233, 252], glow: [255, 255, 255], floor: [200, 211, 250], grid: [70, 100, 210] }]
  };
  let cur = null;
  const mix = (a, c, k) => a.map((v, i) => v + (c[i] - v) * k);
  const mul = (a, k) => a.map((v) => v * k);
  const rgba = (a, al) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`;

  /* ---------- sprites ---------- */
  const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; };
  const TYPES = ["laptop", "desktop", "server", "rack", "phone", "ai", "router", "switch", "firewall", "globe", "cloud", "siem"];
  function devSprite(type) {
    const S = 140, c = canvas(S, S), x = c.getContext("2d"); x.translate(S / 2, S / 2); x.lineJoin = "round"; x.lineCap = "round";
    const rr = (X, Y, w, h, r = 4) => { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h); };
    const shape = (draw) => { x.save(); x.shadowColor = P.glow; x.shadowBlur = dark ? 16 : 8; x.fillStyle = P.fill; x.strokeStyle = P.stroke; x.lineWidth = 3; draw(); x.fill(); x.stroke(); x.restore(); };
    const led = (X, Y, col) => { x.fillStyle = col; x.beginPath(); x.arc(X, Y, 2.6, 0, 7); x.fill(); };
    const line = (X1, Y1, X2, Y2, col, w = 2) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(X1, Y1); x.lineTo(X2, Y2); x.stroke(); };
    const G = "#56e39a", A = "#ffc65c", B = "#7fa6ff", R = "#ff6e6e";
    switch (type) {
      case "laptop":
        shape(() => rr(-36, -34, 72, 46, 5)); x.fillStyle = P.screen; rr(-30, -28, 60, 34, 2); x.fill();
        [[-24, -20, 12], [-24, -13, 26], [-20, -6, 16], [-24, 1, 8]].forEach(([a, y, l], i) => line(a, y, a + l, y, i % 2 ? B : P.code));
        shape(() => { x.beginPath(); x.moveTo(-46, 14); x.lineTo(46, 14); x.lineTo(40, 22); x.lineTo(-40, 22); x.closePath(); }); break;
      case "desktop":
        shape(() => rr(-42, -36, 60, 42, 4)); x.fillStyle = P.screen; rr(-37, -31, 50, 32, 2); x.fill();
        [[-31, -23, 20], [-31, -16, 32], [-27, -9, 14]].forEach(([a, y, l], i) => line(a, y, a + l, y, i % 2 ? B : P.code));
        shape(() => rr(-18, 8, 12, 10, 2)); shape(() => rr(-28, 18, 32, 5, 2));
        shape(() => rr(24, -32, 20, 54, 3)); led(34, -24, G); led(34, -16, A); line(29, 4, 39, 4, P.stroke, 1.5); line(29, 9, 39, 9, P.stroke, 1.5); break;
      case "server":
        for (let u = 0; u < 3; u++) { shape(() => rr(-44, -30 + u * 21, 88, 17, 3)); led(30, -21.5 + u * 21, u === 1 ? A : G); led(37, -21.5 + u * 21, B); line(-36, -21.5 + u * 21, -4, -21.5 + u * 21, P.stroke, 1.5); } break;
      case "rack":
        shape(() => rr(-28, -48, 56, 96, 4));
        for (let u = 0; u < 5; u++) { x.fillStyle = dark ? "rgba(255,255,255,.06)" : "rgba(59,82,180,.08)"; rr(-22, -42 + u * 18, 44, 14, 2); x.fill(); led(12, -35 + u * 18, u % 3 === 1 ? A : G); led(18, -35 + u * 18, B); } break;
      case "phone":
        shape(() => rr(-18, -36, 36, 70, 7)); x.fillStyle = P.screen; rr(-14, -29, 28, 54, 3); x.fill();
        x.strokeStyle = P.code; x.lineWidth = 2.4; x.beginPath(); x.moveTo(0, -18); x.lineTo(9, -14); x.lineTo(9, -4); x.quadraticCurveTo(9, 6, 0, 10); x.quadraticCurveTo(-9, 6, -9, -4); x.lineTo(-9, -14); x.closePath(); x.stroke(); break;
      case "ai":
        shape(() => rr(-30, -30, 60, 60, 6));
        for (let i = 0; i < 4; i++) { const o = -18 + i * 12; line(o, -30, o, -40, P.stroke); line(o, 30, o, 40, P.stroke); line(-30, o, -40, o, P.stroke); line(30, o, 40, o, P.stroke); }
        x.fillStyle = dark ? "rgba(190,140,255,.95)" : "#6a3fd0"; x.font = "700 22px ui-monospace, Menlo, Consolas, monospace"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("AI", 0, 1); break;
      case "router":
        line(-22, -14, -32, -42, P.stroke, 3); line(22, -14, 32, -42, P.stroke, 3); led(-32, -43, B); led(32, -43, B);
        shape(() => rr(-44, -16, 88, 30, 7)); [-26, -14, -2, 10].forEach((X, i) => led(X, -1, [G, B, G, A][i])); break;
      case "switch":
        shape(() => rr(-50, -14, 100, 26, 4));
        for (let i = 0; i < 8; i++) { x.fillStyle = P.screen; rr(-42 + i * 11, -3, 8, 8, 1.5); x.fill(); led(-38 + i * 11, -8, i % 3 ? G : A); } break;
      case "firewall":
        shape(() => rr(-42, -24, 84, 48, 4));
        x.strokeStyle = dark ? "rgba(255,150,110,.9)" : "#c8602e"; x.lineWidth = 2;
        [[-42, -8, 42, -8], [-42, 8, 42, 8], [-14, -24, -14, -8], [14, -24, 14, -8], [0, -8, 0, 8], [-28, -8, -28, 8], [28, -8, 28, 8], [-14, 8, -14, 24], [14, 8, 14, 24]].forEach(([a, c2, d, e]) => { x.beginPath(); x.moveTo(a, c2); x.lineTo(d, e); x.stroke(); });
        x.fillStyle = "#fff"; x.strokeStyle = P.stroke; x.lineWidth = 2.5; x.beginPath(); x.moveTo(0, -34); x.lineTo(13, -29); x.lineTo(13, -18); x.quadraticCurveTo(13, -7, 0, -2); x.quadraticCurveTo(-13, -7, -13, -18); x.lineTo(-13, -29); x.closePath(); x.fill(); x.stroke();
        x.strokeStyle = "#2fbf62"; x.lineWidth = 3; x.beginPath(); x.moveTo(-6, -18); x.lineTo(-1, -13); x.lineTo(7, -23); x.stroke(); break;
      case "globe":
        shape(() => { x.beginPath(); x.arc(0, 0, 34, 0, 7); });
        x.strokeStyle = P.stroke; x.lineWidth = 1.8;
        [[0, 34], [14, 34], [26, 34]].forEach(([rx]) => { x.beginPath(); x.ellipse(0, 0, Math.max(1, rx), 34, 0, 0, 7); x.stroke(); });
        [-17, 0, 17].forEach((y) => { const w = Math.sqrt(34 * 34 - y * y); line(-w, y, w, y, P.stroke, 1.8); }); break;
      case "cloud":
        shape(() => { x.beginPath(); x.moveTo(-34, 20); x.arc(-26, 4, 16, Math.PI * .5, Math.PI * 1.5); x.arc(-4, -10, 22, Math.PI * 1.05, Math.PI * 1.95); x.arc(24, 2, 18, Math.PI * 1.35, Math.PI * .5); x.closePath(); });
        x.strokeStyle = P.code; x.lineWidth = 2.6; x.beginPath(); x.moveTo(-10, 10); x.lineTo(-10, -2); x.moveTo(-15, 3); x.lineTo(-10, -3); x.lineTo(-5, 3); x.moveTo(10, -2); x.lineTo(10, 10); x.moveTo(5, 5); x.lineTo(10, 11); x.lineTo(15, 5); x.stroke(); break;
      case "siem":
        shape(() => rr(-46, -36, 92, 58, 5)); x.fillStyle = P.screen; rr(-40, -30, 80, 46, 2); x.fill();
        [[-32, 12, B], [-22, 22, B], [-12, 16, G], [-2, 30, A], [8, 20, G], [18, 36, R], [28, 14, B]].forEach(([X, h, col]) => { x.fillStyle = col; x.fillRect(X, 12 - h, 7, h); });
        shape(() => rr(-8, 22, 16, 8, 2)); shape(() => rr(-22, 30, 44, 5, 2)); break;
    }
    return c;
  }
  function glowDot(r, rgb) {
    const c = canvas(r * 2, r * 2), x = c.getContext("2d"), g = x.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.25, `rgba(${rgb},.8)`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); return c;
  }
  function cloudSprite(w, h, [light, shade, warm]) {
    const c = canvas(w, h), x = c.getContext("2d");
    for (let i = 0; i < 22; i++) {
      const cx = w * rnd(.14, .86), cy = h * (.42 + .32 * Math.random() * Math.random()), r = Math.min(w, h) * rnd(.16, .34), g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${light},.85)`); g.addColorStop(.55, `rgba(${light},.45)`); g.addColorStop(1, `rgba(${light},0)`); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
    }
    x.globalCompositeOperation = "source-atop"; const v = x.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, `rgba(${warm},.5)`); v.addColorStop(.45, `rgba(${light},0)`); v.addColorStop(1, `rgba(${shade},.6)`); x.fillStyle = v; x.fillRect(0, 0, w, h);
    return c;
  }
  /* a Final-Destination platform: flat glowing deck, tapered circuit-traced underside, light pouring below */
  function platSprite(Wp) {
    const L = P.plat, sw = Wp * 1.3, sh = Wp * .72, c = canvas(sw, sh), x = c.getContext("2d"), cx = sw / 2, y0 = Wp * .1, th = Wp * .03, dep = Wp * .05;
    // light under the stage
    let g = x.createRadialGradient(cx, y0 + Wp * .2, 0, cx, y0 + Wp * .2, Wp * .62);
    g.addColorStop(0, `rgba(${L.rim},${dark ? .38 : .3})`); g.addColorStop(1, `rgba(${L.rim},0)`);
    x.save(); x.translate(cx, y0 + Wp * .2); x.scale(1, .42); x.translate(-cx, -(y0 + Wp * .2)); x.fillStyle = g; x.fillRect(0, 0, sw, sh * 2); x.restore();
    for (let i = 0; i < 5; i++) {
      const lx = cx + (i - 2) * Wp * .09, lg = x.createLinearGradient(0, y0 + th, 0, sh);
      lg.addColorStop(0, `rgba(${L.rim},${dark ? .45 : .35})`); lg.addColorStop(1, `rgba(${L.rim},0)`); x.fillStyle = lg; x.fillRect(lx - 1.5, y0 + th + Wp * .12, 3, sh);
    }
    // underside
    const u = () => { x.beginPath(); x.moveTo(cx - Wp * .5, y0 + th); x.lineTo(cx + Wp * .5, y0 + th); x.lineTo(cx + Wp * .34, y0 + th + Wp * .11); x.lineTo(cx + Wp * .14, y0 + th + Wp * .2); x.lineTo(cx - Wp * .14, y0 + th + Wp * .2); x.lineTo(cx - Wp * .34, y0 + th + Wp * .11); x.closePath(); };
    g = x.createLinearGradient(0, y0, 0, y0 + Wp * .22); g.addColorStop(0, L.under[0]); g.addColorStop(1, L.under[1]);
    u(); x.fillStyle = g; x.fill(); x.strokeStyle = `rgba(${L.rim},.55)`; x.lineWidth = 1.5; x.stroke();
    x.save(); u(); x.clip(); x.strokeStyle = `rgba(${L.trace},${dark ? .7 : .55})`; x.fillStyle = `rgba(${L.trace},.95)`; x.lineWidth = 1.4;
    for (let i = 0; i < 9; i++) {
      const sx = cx + (i - 4) * Wp * .1, ey = y0 + th + Wp * rnd(.06, .16), bx = sx + rnd(-1, 1) * Wp * .06;
      x.beginPath(); x.moveTo(sx, y0 + th); x.lineTo(sx, ey - Wp * .03); x.lineTo(bx, ey); x.stroke(); x.beginPath(); x.arc(bx, ey, 2.2, 0, 7); x.fill();
    }
    x.restore();
    // deck: front face + top surface (slight perspective)
    x.fillStyle = L.face; x.fillRect(cx - Wp * .5, y0, Wp, th);
    g = x.createLinearGradient(0, y0 - dep, 0, y0); g.addColorStop(0, L.top[0]); g.addColorStop(1, L.top[1]);
    x.beginPath(); x.moveTo(cx - Wp * .46, y0 - dep); x.lineTo(cx + Wp * .46, y0 - dep); x.lineTo(cx + Wp * .5, y0); x.lineTo(cx - Wp * .5, y0); x.closePath(); x.fillStyle = g; x.fill();
    x.strokeStyle = `rgba(${L.rim},.22)`; x.lineWidth = 1;
    for (let i = 1; i < 10; i++) { const t = i / 10; x.beginPath(); x.moveTo(cx - Wp * .46 + Wp * .92 * t, y0 - dep); x.lineTo(cx - Wp * .5 + Wp * t, y0); x.stroke(); }
    // the glowing FD edge
    x.save(); x.shadowColor = `rgba(${L.rim},1)`; x.shadowBlur = 14; x.strokeStyle = dark ? "rgba(210,235,255,.95)" : `rgba(${L.rim},.9)`; x.lineWidth = 2;
    x.beginPath(); x.moveTo(cx - Wp * .5, y0); x.lineTo(cx + Wp * .5, y0); x.stroke(); x.restore();
    x.strokeStyle = `rgba(${L.rim},.6)`; x.lineWidth = 1.2; x.beginPath(); x.moveTo(cx - Wp * .46, y0 - dep); x.lineTo(cx + Wp * .46, y0 - dep); x.stroke();
    return { c, y0, sw };
  }
  const SPR = {};
  function buildSprites() {
    TYPES.forEach((t) => (SPR[t] = devSprite(t)));
    SPR.star = glowDot(12, dark ? "170,190,255" : "90,110,220");
    SPR.packet = glowDot(10, P.packetGlow);
    SPR.red = glowDot(10, P.red);
    SPR.aiDot = glowDot(14, P.ai);
    SPR.mote = glowDot(8, dark ? "200,220,255" : "255,255,255");
    const k = mobile ? .6 : 1;
    SPR.wisp = [0, 1, 2].map(() => cloudSprite(720 * k, 300 * k, P.wisp));
  }

  /* ---------- topologies (unit coords: x −1…1, y −1…0 with 0 = the stage deck) ----------
     edge kinds: 0 cable · 1 deny (red packets die at the 2nd node) · 2 tunnel (dashed) */
  const TOPOS = [
    { name: "HQ-LAN · STAR · 10.0.10.0/24", nodes: [["router", 0, -.55], ["laptop", -.8, -.2], ["desktop", -.48, -.95], ["phone", .5, -.96], ["server", .82, -.24], ["ai", 0, -.04]], edges: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]] },
    { name: "DC-01 · SPINE-LEAF", nodes: [["switch", -.42, -.98], ["switch", .42, -.98], ["switch", -.78, -.52], ["switch", 0, -.52], ["switch", .78, -.52], ["rack", -.78, -.06], ["server", 0, -.08], ["rack", .78, -.06]], edges: [[0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 5], [3, 6], [4, 7]] },
    { name: "EDGE · DMZ · 203.0.113.0/24", nodes: [["firewall", -.1, -.5], ["globe", -.82, -.92], ["server", .78, -.92], ["switch", .5, -.16], ["laptop", -.55, -.08], ["globe", -.88, -.38]], edges: [[1, 0, 1], [5, 0, 1], [0, 2], [0, 3], [3, 4]] },
    { name: "SOC · SIEM + AI TRIAGE", nodes: [["siem", 0, -.55], ["laptop", -.84, -.9], ["server", -.86, -.2], ["phone", .84, -.92], ["firewall", .84, -.2], ["ai", 0, -1.02], ["desktop", 0, -.04]], edges: [[1, 0], [2, 0], [3, 0], [4, 0], [0, 5], [0, 6]] },
    { name: "AI PIPELINE · INFERENCE", ai: true, nodes: [["ai", 0, -.52], ["rack", -.84, -.52], ["server", -.5, -.98], ["cloud", -.5, -.08], ["laptop", .84, -.56], ["phone", .5, -.98], ["siem", .5, -.08]], edges: [[1, 0], [2, 0], [3, 0], [0, 4], [0, 5], [0, 6]] },
    { name: "METRO · RING · OSPF", ring: true, nodes: [["router", 0, -1], ["switch", .8, -.76], ["router", .8, -.24], ["switch", 0, -.02], ["router", -.8, -.24], ["switch", -.8, -.76]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]] },
    { name: "SD-WAN · MESH", nodes: [["cloud", 0, -.52], ["router", -.82, -.95], ["router", .82, -.95], ["router", -.82, -.1], ["router", .82, -.1]], edges: [[1, 2], [1, 3], [2, 4], [3, 4], [1, 4], [2, 3], [0, 1, 2], [0, 2, 2], [0, 3, 2], [0, 4, 2]] },
    { name: "ZERO TRUST · VERIFY EXPLICITLY", nodes: [["firewall", 0, -.52], ["phone", -.84, -.92], ["laptop", -.84, -.14], ["globe", -.4, -1.02], ["cloud", .84, -.92], ["server", .84, -.14], ["ai", .3, -.04]], edges: [[1, 0], [2, 0], [3, 0, 1], [0, 4], [0, 5], [0, 6]] },
    { name: "SITE-TO-SITE · IPsec VPN", nodes: [["router", -.42, -.55], ["router", .42, -.55], ["laptop", -.86, -.94], ["desktop", -.86, -.1], ["server", .86, -.94], ["rack", .86, -.1]], edges: [[0, 1, 2], [0, 2], [0, 3], [1, 4], [1, 5]] }
  ];
  const TRUNK_LABELS = ["10G uplink", "VLAN trunk 802.1Q", "BGP peer · AS65010", "IPsec tunnel", "fiber backbone", "LACP bond 2×25G", "MPLS L3VPN", "WireGuard wg0"];

  /* ---------- placement: an object at depth z moves at 1/z of the scroll speed ---------- */
  const span = (z) => H * 1.5 + Math.max(0, docH - H) / z;
  const place = (z, xmin = -.1, xmax = 1.1) => ({ bx: rnd(xmin, xmax) * W, by: rnd(-H * .25, -H * .25 + span(z)), z });
  const count = (d, z) => Math.max(1, Math.round(d * span(z) / H));
  const proj = (o, dx = 0, dy = 0) => [o.bx + dx - smx * 70 / o.z, o.by + dy - scrollY / o.z - smy * 46 / o.z];
  const anchorAt = (docY, z) => H / 2 + (docY - H / 2) / z; // centred on screen when docY is at the screen centre
  const horizon = () => H * (mobile ? .8 : .75) - smy * 14;

  const CMDS = ["PS C:\\> Get-ADUser -Filter *", "Test-NetConnection fw01 -Port 443", "Get-MgDevice -All", "Invoke-Command -ComputerName srv01",
    "Get-NetIPConfiguration", "Set-MpPreference -EnableNetworkProtection Enabled", "tracert 8.8.8.8", "ping 1.1.1.1 -t", "ipconfig /flushdns",
    "netsh advfirewall show allprofiles", "Get-WinEvent -LogName Security -MaxEvents 50", "nslookup pi.hole", "Get-NetTCPConnection -State Listen",
    "Get-MgUser -Filter \"accountEnabled eq false\"", "Invoke-AIThreatTriage -Severity High", "ai.summarize(alerts) → 3 actionable", "anomaly_score = 0.97",
    "model: threat-classifier · inference 12ms", "embedding: [0.12, -0.83, 0.41, …]", "LLM → alert summary ✓", "show ip route", "vlan 20 name SECURE", "access-list 110 deny tcp any any eq 23"];

  function sectionTops() {
    return ["#experience", "#projects", "#certifications", ".footer"].map((s) => document.querySelector(s)).filter(Boolean).map((el) => el.getBoundingClientRect().top + scrollY);
  }

  function makeCluster(o, topo, Wp, plat, alpha) {
    return { ...o, topo, Wp, plat, alpha, packets: [], last: 0, ph: rnd(0, 7), k: Wp / 380, sprite: null, pos: null };
  }

  function build() {
    dark = root.classList.contains("dark"); P = dark ? PAL.dark : PAL.light;
    const DPR = Math.min(1, devicePixelRatio || 1); W = innerWidth; H = innerHeight; docH = document.documentElement.scrollHeight;
    for (const c of [bg, fg]) { c.width = W * DPR; c.height = H * DPR; }
    b.setTransform(DPR, 0, 0, DPR, 0, 0); f.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildSprites();
    nebula = buildNebula();
    phaseTops = sectionTops();
    if (!cur || cur.dark !== dark) { const p0 = PHASES[dark ? "dark" : "light"][0]; cur = { dark, top: p0.top.slice(), mid: p0.mid.slice(), glow: p0.glow.slice(), floor: p0.floor.slice(), grid: p0.grid.slice() }; }
    const m = mobile ? .5 : 1;
    stars = []; stages = []; far = []; trunks = []; texts = []; nets = []; wisps = []; motes = []; fx = [];
    [[20, 170, .5, 1.1], [8, 60, 1, 1.9], [3.2, 12, 2, 3.2]].forEach(([z, d, r0, r1]) => {
      for (let i = 0; i < count(d * m, z); i++) stars.push({ ...place(z), r: rnd(r0, r1), ph: rnd(0, 7), sp: rnd(.6, 2.2), glow: z < 5 });
    });

    // the stages: one new topology every screen, alternating sides, flowing down the page
    const Zs = 2.4, Wp = mobile ? Math.min(230, W * .52) : Math.min(400, Math.max(280, W * .26));
    const plat = platSprite(Wp), order = TOPOS.map((_, i) => i);
    const step = H * (mobile ? 1.15 : 1.02);
    let i = 0;
    for (let y = H * (mobile ? 1.5 : 1.5); y < docH - H * .25; y += step, i++) {
      const side = i % 2 === 0 ? (mobile ? .8 : .845) : (mobile ? .2 : .155);
      const c = makeCluster({ bx: W * side, by: anchorAt(y, Zs), z: Zs }, TOPOS[order[i % order.length]], Wp, true, mobile ? .55 : 1);
      c.sprite = plat; stages.push(c);
    }
    for (let j = 0; j < stages.length - 1; j++) trunks.push({ a: stages[j], b: stages[j + 1], label: TRUNK_LABELS[j % TRUNK_LABELS.length], packets: [], last: 0 });

    // far-away mini networks in the dark portion (no stage), all different
    const nF = count(mobile ? .35 : .7, 9);
    for (let j = 0; j < nF; j++) { const z = rnd(6.5, 12); far.push(makeCluster(place(z, .03, .97), TOPOS[(j * 4 + 2) % TOPOS.length], 260 * 4 / z, false, Math.min(.75, 1.25 - z / 12))); }

    // drifting PowerShell / network / AI commands, far away
    for (let j = 0; j < count(mobile ? 1.1 : 2.2, 9); j++) { const z = rnd(6, 13); texts.push({ ...place(z, .02, .9), s: pick(CMDS), size: Math.max(9, Math.min(15, 13 * 7 / z)), ph: rnd(0, 20), per: rnd(9, 15), drift: rnd(-6, 6) }); }
    // neural networks that fire
    for (let j = 0; j < count(mobile ? .25 : .4, 7); j++) {
      const z = rnd(5.5, 9), k = 4 / z, layers = [3, 5, 5, 3, 1], gapX = 70 * k, gapY = 34 * k, nodes = [];
      layers.forEach((cnt, li) => { for (let q = 0; q < cnt; q++) nodes.push({ li, dx: li * gapX, dy: (q - (cnt - 1) / 2) * gapY }); });
      nets.push({ ...place(z, .05, .8), nodes, layers: layers.length, per: rnd(3.2, 5), ph: rnd(0, 5), k });
    }
    // the ROUTER planet, hanging in the dark portion of the hero
    planet = { bx: W * (mobile ? .86 : .9), by: H * .3, z: 9, r: Math.min(W, H) * (mobile ? .15 : .13) };
    // light motes rising off the horizon
    for (let j = 0; j < (mobile ? 14 : 30); j++) motes.push({ x: rnd(0, W), ph: rnd(0, 1), sp: rnd(.05, .14), r: rnd(1.5, 4) });
    // fly-through dust at each section boundary
    const Z = .55;
    phaseTops.forEach((top, k) => { const n = mobile ? 3 : 5; for (let q = 0; q < n; q++) wisps.push({ bx: W * (q / (n - 1)) + rnd(-80, 80), by: H / 2 + (top - H / 2) / Z + rnd(-H * .12, H * .12), z: Z, s: SPR.wisp[(q + k) % 3], w: rnd(.9, 1.5) }); });
    fgDirty = true; draw(performance.now());
  }

  function buildNebula() {
    const sc = mobile ? .6 : 1, w = Math.ceil(W * 1.35 * sc), h = Math.ceil((H * 1.7 + Math.max(0, docH - H) / 18) * sc);
    const c = canvas(w, h), x = c.getContext("2d");
    x.globalCompositeOperation = P.blend;
    for (let i = 0; i < 80; i++) {
      const cx = rnd(0, w), cy = rnd(0, h), r = rnd(140, 460) * sc, g = x.createRadialGradient(cx, cy, 0, cx, cy, r), col = P.neb[i % P.neb.length], a = rnd(P.nebA[0], P.nebA[1]);
      g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.6, `rgba(${col},${a * .45})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    const x0 = -w * .1, y0 = h * .08, x1 = w * 1.1, y1 = h * .62;
    for (let i = 0; i < 46; i++) {
      const t = i / 45, cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t, r = rnd(110, 210) * sc, g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      const col = dark ? "210,200,255" : "170,160,240"; g.addColorStop(0, `rgba(${col},${dark ? .07 : .08})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    x.globalCompositeOperation = "source-over";
    const sc2 = dark ? "255,255,255" : "60,75,150";
    for (let i = 0; i < 2600 * sc; i++) {
      const t = Math.random(), off = (Math.random() + Math.random() + Math.random() - 1.5) * 110 * sc;
      x.fillStyle = `rgba(${sc2},${(rnd(.15, .7) * (dark ? 1 : .45)).toFixed(2)})`; x.fillRect(x0 + (x1 - x0) * t + off * .45, y0 + (y1 - y0) * t + off, Math.random() < .1 ? 1.6 : 1, Math.random() < .1 ? 1.6 : 1);
    }
    for (let i = 0; i < (w * h) / 2600; i++) { x.fillStyle = `rgba(${sc2},${(rnd(.1, .55) * (dark ? 1 : .4)).toFixed(2)})`; x.fillRect(rnd(0, w), rnd(0, h), 1, 1); }
    return c;
  }

  /* ---------- drawing ---------- */
  const bez = (a, c, d, t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * d[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * d[1]];
  const cub = (a, c1, c2, d, t) => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * d[1]]; };
  const cableCtrl = (A, B) => [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + Math.hypot(B[0] - A[0], B[1] - A[1]) * .2];
  const nodeXY = (c, cx, cy, n, i, t) => [cx + n[1] * c.Wp * .46, cy + n[2] * c.Wp * .62 - c.Wp * .07 + Math.sin(t * .0008 + i * 1.3 + c.ph) * 4 * c.k];
  const mono = (px) => `${Math.max(9, px).toFixed(0)}px ui-monospace, Menlo, Consolas, monospace`;

  function drawCluster(c, t) {
    const [cx, cy] = proj(c), Wp = c.Wp, k = c.k;
    if (cy < -Wp * .9 || cy > H + Wp * .7) { c.pos = null; return; }
    const al = c.alpha, topo = c.topo;
    const pos = topo.nodes.map((n, i) => nodeXY(c, cx, cy, n, i, t));
    if (c.plat) { b.globalAlpha = al; b.drawImage(c.sprite.c, cx - c.sprite.sw / 2, cy - c.sprite.y0); }
    topo.edges.forEach(([i, j, kind]) => {
      const A = pos[i], B = pos[j], C = topo.ring ? [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2] : cableCtrl(A, B);
      b.globalAlpha = al;
      if (kind === 2) b.setLineDash([7 * k, 6 * k]);
      b.strokeStyle = P.cable + (dark ? ".22)" : ".18)"); b.lineWidth = 6 * k; b.beginPath(); b.moveTo(A[0], A[1]); b.quadraticCurveTo(C[0], C[1], B[0], B[1]); b.stroke();
      b.strokeStyle = kind === 1 ? `rgba(${P.red},.55)` : kind === 2 ? `rgba(${dark ? "110,231,168" : "40,170,110"},.8)` : P.cable + (dark ? ".8)" : ".6)");
      b.lineWidth = 1.8 * k; b.beginPath(); b.moveTo(A[0], A[1]); b.quadraticCurveTo(C[0], C[1], B[0], B[1]); b.stroke();
      b.setLineDash([]);
    });
    if (t - c.last > (c.plat ? 380 : 700) && !reduced()) {
      c.last = t; const e = pick(topo.edges), deny = e[2] === 1;
      c.packets.push({ e, t: 0, dir: deny ? 1 : Math.random() < .5 ? 1 : -1, red: deny, sp: rnd(.5, .85) });
    }
    c.packets = c.packets.filter((p) => {
      p.t += .028 * p.sp; if (p.t >= 1) { if (p.red) fx.push({ kind: "block", c, i: p.e[1], born: t }); return false; }
      const [i, j] = p.e, A = pos[i], B = pos[j], C = topo.ring ? [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2] : cableCtrl(A, B), tt = p.dir > 0 ? p.t : 1 - p.t;
      const [x, y] = bez(A, C, B, tt), r = 7.5 * k; b.globalAlpha = al; b.drawImage(p.red ? SPR.red : topo.ai ? SPR.aiDot : SPR.packet, x - r, y - r, r * 2, r * 2); return true;
    });
    const s = Wp * .235;
    topo.nodes.forEach((n, i) => { const [x, y] = pos[i]; b.globalAlpha = al; b.drawImage(SPR[n[0]], x - s / 2, y - s / 2, s, s); });
    if (c.plat) {
      b.globalAlpha = al * (dark ? .8 : .85); b.font = `600 ${mono(11.5 * Math.max(.85, k))}`; b.textAlign = "center"; b.fillStyle = P.text + "1)";
      b.fillText(topo.name, cx, cy + Wp * .29); b.textAlign = "left";
    }
    c.pos = pos; b.globalAlpha = 1;
  }

  /* the backbone: a cable from under each stage down to the next stage's core, traffic flowing downward */
  function drawTrunk(tr, t) {
    const a = tr.a, c = tr.b, [ax, ay] = proj(a), [bx2, by2] = proj(c);
    const A = [ax, ay + a.Wp * .27], hub = c.topo.nodes[0], B = nodeXY(c, bx2, by2, hub, 0, t);
    if (B[1] < -60 || A[1] > H + 60) { tr.packets.length = 0; return; }
    const d = (B[1] - A[1]) * .55, C1 = [A[0], A[1] + d], C2 = [B[0], B[1] - d], al = Math.min(a.alpha, c.alpha);
    b.globalAlpha = al;
    b.strokeStyle = P.cable + (dark ? ".14)" : ".12)"); b.lineWidth = 10 * a.k; b.beginPath(); b.moveTo(A[0], A[1]); b.bezierCurveTo(C1[0], C1[1], C2[0], C2[1], B[0], B[1]); b.stroke();
    b.strokeStyle = P.cable + (dark ? ".55)" : ".42)"); b.lineWidth = 2.2 * a.k; b.stroke();
    if (t - tr.last > 260 && !reduced()) { tr.last = t; tr.packets.push({ t: 0, sp: rnd(.8, 1.2) }); }
    const boost = Math.min(.03, Math.abs(vel) * .0011);
    tr.packets = tr.packets.filter((p) => {
      p.t += (.0075 + boost) * p.sp; if (p.t >= 1) return false;
      const [x, y] = cub(A, C1, C2, B, p.t), r = 8 * a.k; b.globalAlpha = al; b.drawImage(SPR.packet, x - r, y - r, r * 2, r * 2); return true;
    });
    const [lx, ly] = cub(A, C1, C2, B, .5);
    b.globalAlpha = al * (dark ? .6 : .65); b.font = mono(10.5); b.fillStyle = P.text + "1)"; b.textAlign = "center"; b.fillText(tr.label, lx, ly - 10); b.textAlign = "left";
    b.globalAlpha = 1;
  }

  function drawNet(nt, t) {
    const [cx, cy] = proj(nt); if (cy < -300 || cy > H + 300) return;
    const k = nt.k, cyc = ((t / 1000 + nt.ph) % nt.per) / nt.per * (nt.layers + 1.5);
    const pos = nt.nodes.map((n) => [cx + n.dx, cy + n.dy]);
    b.lineWidth = 1 * k; b.strokeStyle = `rgb(${P.ai})`;
    nt.nodes.forEach((a, i) => nt.nodes.forEach((c2, j) => {
      if (c2.li !== a.li + 1) return;
      const on = Math.max(0, 1 - Math.abs(cyc - (a.li + .5)) * 1.6);
      b.globalAlpha = .12 + on * .5; b.beginPath(); b.moveTo(pos[i][0], pos[i][1]); b.lineTo(pos[j][0], pos[j][1]); b.stroke();
    }));
    nt.nodes.forEach((n, i) => { const on = Math.max(0, 1 - Math.abs(cyc - n.li) * 1.4), r = (5 + on * 7) * k; b.globalAlpha = .45 + on * .55; b.drawImage(SPR.aiDot, pos[i][0] - r, pos[i][1] - r, r * 2, r * 2); });
    b.globalAlpha = 1;
  }

  function drawPlanet(t) {
    const [px, py] = proj(planet), r = planet.r; if (py < -r * 3 || py > H + r * 3) return;
    const ringAt = (th) => { const a = -.32, ex = Math.cos(th) * r * 1.9, ey = Math.sin(th) * r * .46; return [px + ex * Math.cos(a) - ey * Math.sin(a), py + ex * Math.sin(a) + ey * Math.cos(a)]; };
    const ring = (from, to) => {
      b.save(); b.translate(px, py); b.rotate(-.32);
      b.strokeStyle = P.ring; b.lineWidth = r * .085; b.beginPath(); b.ellipse(0, 0, r * 1.9, r * .46, 0, from, to); b.stroke();
      b.strokeStyle = P.ringHi; b.lineWidth = r * .022; b.setLineDash([r * .05, r * .09]); b.beginPath(); b.ellipse(0, 0, r * 1.9, r * .46, 0, from, to); b.stroke(); b.setLineDash([]);
      b.restore();
    };
    const orbit = (back) => { for (let i = 0; i < 7; i++) { const th = t * .00035 + i * (Math.PI * 2 / 7); if ((Math.sin(th) < 0) !== back) continue; const [x, y] = ringAt(th), rr2 = r * .07; b.globalAlpha = 1; b.drawImage(SPR.packet, x - rr2, y - rr2, rr2 * 2, rr2 * 2); } };
    const atm = b.createRadialGradient(px, py, r * .9, px, py, r * 1.6); atm.addColorStop(0, dark ? "rgba(120,140,255,.28)" : "rgba(90,120,230,.18)"); atm.addColorStop(1, "rgba(120,140,255,0)");
    b.fillStyle = atm; b.fillRect(px - r * 2, py - r * 2, r * 4, r * 4);
    ring(Math.PI, Math.PI * 2); orbit(true);
    b.strokeStyle = P.stroke; b.lineCap = "round"; b.lineWidth = r * .05;
    [[-.42, -.86, -.62, -1.42], [.42, -.86, .62, -1.42]].forEach(([a1, b1, a2, b2]) => { b.beginPath(); b.moveTo(px + r * a1, py + r * b1); b.lineTo(px + r * a2, py + r * b2); b.stroke(); b.drawImage(SPR.packet, px + r * a2 - r * .09, py + r * b2 - r * .09, r * .18, r * .18); });
    for (let k = 0; k < 3; k++) { const ph = (t * .0006 + k / 3) % 1; b.globalAlpha = (1 - ph) * .7; b.strokeStyle = `rgb(${P.ping})`; b.lineWidth = r * .03; b.beginPath(); b.arc(px, py - r * 1.05, r * (.25 + ph * .55), Math.PI * 1.22, Math.PI * 1.78); b.stroke(); }
    b.globalAlpha = 1;
    const body = b.createRadialGradient(px - r * .4, py - r * .45, r * .1, px, py, r); P.planet.forEach((c, i) => body.addColorStop(i / 2, c));
    b.fillStyle = body; b.beginPath(); b.arc(px, py, r, 0, 7); b.fill();
    b.save(); b.beginPath(); b.arc(px, py, r, 0, 7); b.clip();
    b.fillStyle = dark ? "rgba(10,12,40,.75)" : "rgba(40,55,130,.55)"; b.beginPath(); b.ellipse(px, py + r * .12, r * 1.05, r * .2, 0, 0, Math.PI * 2); b.fill();
    for (let i = 0; i < 12; i++) {
      const a = Math.PI * (.12 + i * .064), x = px - Math.cos(a) * r * .98, y = py + r * .12 + Math.sin(a) * r * .14;
      const on = Math.sin(t * .006 * (1 + (i % 3) * .5) + i * 1.7) > -.2; b.fillStyle = on ? ["#56e39a", "#56e39a", "#ffc65c", "#7fa6ff"][i % 4] : "rgba(80,90,140,.6)";
      b.fillRect(x - r * .028, y - r * .028, r * .056, r * .056);
    }
    for (let k = 0; k < 4; k++) { b.fillStyle = `rgba(150,140,255,${(dark ? .05 : .08) + k * .012})`; b.fillRect(px - r, py - r * .75 + k * r * .25, r * 2, r * .05); }
    b.restore();
    b.shadowColor = dark ? "rgba(150,210,255,.9)" : "rgba(90,120,230,.6)"; b.shadowBlur = 16; b.strokeStyle = dark ? "rgba(170,215,255,.85)" : "rgba(60,90,200,.7)"; b.lineWidth = 2.2;
    b.beginPath(); b.arc(px, py, r - 1, Math.PI * .95, Math.PI * 1.62); b.stroke(); b.shadowBlur = 0;
    ring(0, Math.PI); orbit(false);
  }

  /* the LIGHT portion: horizon bloom, reflective data-grid floor rushing toward you, rising motes */
  function drawFloor(t) {
    const hy = horizon(), g = cur.glow, fl = cur.floor, gd = cur.grid, depth = H - hy;
    let gr = b.createLinearGradient(0, hy - H * .3, 0, hy);
    gr.addColorStop(0, rgba(g, 0)); gr.addColorStop(.7, rgba(g, dark ? .12 : .3)); gr.addColorStop(1, rgba(g, dark ? .42 : .8));
    b.fillStyle = gr; b.fillRect(0, hy - H * .3, W, H * .3);
    gr = b.createLinearGradient(0, hy, 0, H);
    gr.addColorStop(0, rgba(mix(g, fl, dark ? .5 : .25), 1)); gr.addColorStop(.22, rgba(fl, 1)); gr.addColorStop(1, rgba(mul(fl, dark ? .32 : .94), 1));
    b.fillStyle = gr; b.fillRect(0, hy, W, depth + 2);
    // stage-light reflections on the glossy floor
    stages.forEach((c) => {
      const [cx, cy] = proj(c); if (cy < -H * .5 || cy > H * 1.3) return;
      const rx = cx, ry = hy + depth * .35, rg = b.createRadialGradient(rx, ry, 0, rx, ry, c.Wp * .7);
      rg.addColorStop(0, rgba(g, dark ? .2 : .35)); rg.addColorStop(1, rgba(g, 0));
      b.fillStyle = rg; b.fillRect(rx - c.Wp * .7, hy, c.Wp * 1.4, depth);
    });
    // perspective grid
    const vp = W / 2 - smx * 90, lg = b.createLinearGradient(0, hy, 0, H);
    lg.addColorStop(0, rgba(gd, 0)); lg.addColorStop(.3, rgba(gd, dark ? .22 : .2)); lg.addColorStop(1, rgba(gd, dark ? .5 : .4));
    b.strokeStyle = lg; b.lineWidth = 1; b.beginPath();
    const n = mobile ? 8 : 12, sp = W * .17;
    for (let i = -n; i <= n; i++) { b.moveTo(vp + i * 6, hy); b.lineTo(vp + i * sp, H); }
    const frac = ((scrollY / 150) + t * .00012) % 1;
    for (let k = 1; k < 18; k++) { const y = hy + depth / (k + 1 - frac) * .9; if (y > H || y < hy + 1) continue; b.moveTo(0, y); b.lineTo(W, y); }
    b.stroke();
    // the horizon line
    gr = b.createLinearGradient(0, hy - 12, 0, hy + 16); gr.addColorStop(0, rgba(g, 0)); gr.addColorStop(.42, rgba(g, dark ? .55 : .9)); gr.addColorStop(1, rgba(g, 0));
    b.fillStyle = gr; b.fillRect(0, hy - 12, W, 28);
    b.fillStyle = rgba(mix(g, [255, 255, 255], .6), dark ? .9 : 1); b.fillRect(0, hy - .8, W, 1.6);
    // rising light
    if (dark) b.globalCompositeOperation = "lighter";
    motes.forEach((m) => {
      const p = (t * .001 * m.sp + m.ph) % 1, y = hy - p * H * .42, x = m.x + Math.sin(p * 6 + m.ph * 9) * 14, r = m.r * 2.2;
      b.globalAlpha = Math.sin(p * Math.PI) * (dark ? .7 : .9); b.drawImage(SPR.mote, x - r, y - r, r * 2, r * 2);
    });
    b.globalAlpha = 1; b.globalCompositeOperation = "source-over";
  }

  function drawFX(now) {
    fx = fx.filter((e) => {
      const c = e.c; if (!c.pos) return false;
      const age = (now - e.born) / 1000, k = c.k;
      if (e.kind === "ping") {
        const [x, y] = c.pos[0], life = 1.6; if (age > life) return false; const p = age / life;
        b.globalAlpha = (1 - p) * .85 * c.alpha; b.strokeStyle = `rgb(${P.ping})`; b.lineWidth = 1.6; b.beginPath(); b.arc(x, y, (14 + p * 70) * k, 0, 7); b.stroke();
        b.font = mono(12 * k); b.fillStyle = `rgb(${P.ping})`; b.fillText(e.label, x + 34 * k, y - 26 * k - p * 10); return true;
      }
      if (e.kind === "block") {
        const [x, y] = c.pos[e.i], life = .7; if (age > life) return false; const p = age / life;
        b.globalAlpha = (1 - p) * c.alpha; b.strokeStyle = `rgb(${P.red})`; b.lineWidth = 2;
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, d1 = (10 + p * 20) * k, d2 = d1 + 6 * k; b.beginPath(); b.moveTo(x + Math.cos(a) * d1, y + Math.sin(a) * d1); b.lineTo(x + Math.cos(a) * d2, y + Math.sin(a) * d2); b.stroke(); }
        b.font = mono(11 * k); b.fillStyle = `rgb(${P.red})`; b.fillText("DENY", x - 14 * k, y - 40 * k); return true;
      }
      if (e.kind === "trace") {
        const life = 1.9; if (age > life) return false;
        e.path.forEach((ni, h) => {
          if (age * 4 - h < 0) return; const [x, y] = c.pos[ni];
          b.globalAlpha = Math.max(0, 1 - (age - h / 4) / 1.3) * c.alpha; b.strokeStyle = "#56e39a"; b.lineWidth = 2; b.beginPath(); b.arc(x, y, 30 * k, 0, 7); b.stroke();
          b.font = mono(11 * k); b.fillStyle = "#56e39a"; b.fillText(`hop ${h + 1}`, x - 14 * k, y + 46 * k);
        });
        return true;
      }
      return false;
    });
    b.globalAlpha = 1;
  }

  let lastEvt = 0;
  function events(now) {
    if (reduced() || now - lastEvt < 1300) return; lastEvt = now;
    const vis = (Math.random() < .75 ? stages : far).filter((c) => c.pos && c.pos[0][1] > 40 && c.pos[0][1] < H - 40); if (!vis.length) return;
    const c = pick(vis);
    if (Math.random() < .65) fx.push({ kind: "ping", c, born: now, label: `ping 10.0.${(Math.random() * 9) | 0}.${(Math.random() * 250 + 2) | 0} · ${rnd(1, 24).toFixed(0)}ms` });
    else fx.push({ kind: "trace", c, born: now, path: [0, ...c.topo.nodes.map((_, i) => i).slice(1).sort(() => Math.random() - .5).slice(0, 3)] });
  }

  function drawTexts(t) {
    b.textBaseline = "middle";
    texts.forEach((o) => {
      const [x0, y] = proj(o); if (y < -20 || y > H + 20) return;
      const cyc = ((t / 1000 + o.ph) % o.per) / o.per, a = Math.sin(cyc * Math.PI); if (a < .02) return;
      b.font = `${o.size.toFixed(1)}px ui-monospace, Menlo, Consolas, monospace`; b.globalAlpha = a * (dark ? .55 : .5) * Math.min(1, 1.3 - o.z / 16);
      b.fillStyle = P.text + "1)"; b.fillText(o.s.slice(0, Math.ceil(o.s.length * Math.min(1, cyc * 3))), x0 + o.drift * cyc * 10, y);
    });
    b.globalAlpha = 1; b.textBaseline = "alphabetic";
  }

  function phaseStep() {
    const mid = scrollY + H * .5, list = PHASES[dark ? "dark" : "light"]; let idx = 0;
    phaseTops.forEach((top, i) => { if (top < mid) idx = i + 1; });
    const tgt = list[Math.min(idx, list.length - 1)], e = reduced() ? 1 : .05;
    ["top", "mid", "glow", "floor", "grid"].forEach((key) => { for (let i = 0; i < 3; i++) cur[key][i] += (tgt[key][i] - cur[key][i]) * e; });
  }

  function draw(t) {
    smx += (mx - smx) * .06; smy += (my - smy) * .06; vel = vel * .8 + (scrollY - lastY) * .2; lastY = scrollY;
    phaseStep();
    const hy = horizon();
    // the DARK portion
    const sky = b.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, rgba(cur.top, 1)); sky.addColorStop(.62, rgba(cur.mid, 1)); sky.addColorStop(1, rgba(mix(cur.mid, cur.glow, dark ? .28 : .5), 1));
    b.globalAlpha = 1; b.globalCompositeOperation = "source-over"; b.fillStyle = sky; b.fillRect(0, 0, W, hy + 1);
    if (nebula) { const sc = mobile ? .6 : 1; b.globalCompositeOperation = dark ? "lighter" : "source-over"; b.drawImage(nebula, -W * .17 - smx * 18, -H * .35 - scrollY / 18 - smy * 12, nebula.width / sc, nebula.height / sc); b.globalCompositeOperation = "source-over"; }
    stars.forEach((o) => {
      const [x, y] = proj(o); if (y < -10 || y > hy || x < -10 || x > W + 10) return;
      const tw = .55 + .45 * Math.sin(t * .001 * o.sp + o.ph);
      if (o.glow) { const r = o.r * 3.2; b.globalAlpha = tw * P.starA; b.drawImage(SPR.star, x - r, y - r, r * 2, r * 2); }
      else { b.globalAlpha = tw * (o.z > 10 ? .7 : .95) * P.starA; b.fillStyle = P.star; b.fillRect(x, y, o.r, o.r); }
      if (dark && Math.abs(vel) > 6 && o.z < 9) { b.globalAlpha = .3 * tw; b.strokeStyle = "#cfd9ff"; b.lineWidth = o.r * .7; b.beginPath(); b.moveTo(x, y); b.lineTo(x, y + vel * 1.4 / o.z); b.stroke(); }
    });
    b.globalAlpha = 1;
    drawTexts(t);
    drawPlanet(t);
    nets.forEach((n) => drawNet(n, t));
    far.forEach((c) => drawCluster(c, t));
    // the LIGHT portion
    drawFloor(t);
    // the stages + the backbone flowing down between them
    trunks.forEach((tr) => drawTrunk(tr, t));
    stages.forEach((c) => drawCluster(c, t));
    events(t); drawFX(t);
    drawFront();
  }

  function drawFront() {
    const vis = wisps.filter((o) => { const [, y] = proj(o); return y > -260 && y < H + 260; });
    if (vis.length || fgDirty) { f.clearRect(0, 0, W, H); fgDirty = false; }
    vis.forEach((o) => {
      const [x, y] = proj(o), w = o.s.width * o.w, h = o.s.height * o.w, center = 1 - Math.min(1, Math.abs(y - H / 2) / (H * .62));
      f.globalAlpha = P.wispA * center; if (f.globalAlpha < .01) return; f.drawImage(o.s, x - w / 2, y - h / 2, w, h); fgDirty = true;
    });
    f.globalAlpha = 1;
  }

  /* ---------- loop ---------- */
  let last = 0;
  const loop = (t) => {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    if (reduced() && scrollY === lastY && Math.abs(mx - smx) < .002 && Math.abs(my - smy) < .002) return;
    if (t - last < (mobile ? 42 : 33) * (document.body.classList.contains("jumping") ? 1.6 : 1)) return; last = t;
    draw(reduced() ? 0 : t);
  };
  if (fine) addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  let rt; const rebuild = () => { clearTimeout(rt); rt = setTimeout(build, 200); };
  addEventListener("resize", rebuild, { passive: true });
  new MutationObserver(() => { if (root.classList.contains("dark") !== dark) { bg.classList.add("swap"); setTimeout(() => { build(); bg.classList.remove("swap"); }, 260); } })
    .observe(root, { attributes: true, attributeFilter: ["class"] });
  let lastDoc = 0;
  new ResizeObserver(() => { const h = document.documentElement.scrollHeight; if (Math.abs(h - lastDoc) > 200) { lastDoc = h; rebuild(); } }).observe(document.body);
  build(); requestAnimationFrame(loop);
})();

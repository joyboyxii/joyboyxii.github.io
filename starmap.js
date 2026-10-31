/* =====================================================================
   STAR MAP · one continuous constellation wallpaper behind the whole page
   Network, security, Active Directory, VM-cluster and AI topologies drawn
   as constellations on three depth layers (far · mid · near). Lines draw in
   the first time a constellation comes into view, stars twinkle, packets run
   along the lines and hubs ping. It never paints over the floating islands or
   the section constellations, and it follows each section's colour.
   ===================================================================== */
(() => {
  const root = document.documentElement;
  const calm = () => root.classList.contains("calm") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = innerWidth < 760 || matchMedia("(pointer: coarse)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  const cv = document.createElement("canvas"); cv.id = "starmap"; cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  // one canvas for stars and clouds: one layer for the browser to blend while scrolling
  const x = cv.getContext("2d"), xc = x;

  /* ---------- the topologies (unit box: x 0…1, y 0…1 × aspect) ----------
     node: [x, y, major?, label]   edge: [a, b, dashed?] */
  const ring = (n, cx, cy, r, a0 = -Math.PI / 2, ry = r) => Array.from({ length: n }, (_, i) => [cx + Math.cos(a0 + i * 2 * Math.PI / n) * r, cy + Math.sin(a0 + i * 2 * Math.PI / n) * ry, 0]);
  const chain = (from, n, close) => { const e = []; for (let i = 0; i < n - (close ? 0 : 1); i++) e.push([from + i, from + (i + 1) % n]); return e; };
  const T = {
    net: [
      { name: "Star LAN", a: 1, n: [[.5, .5, 1, "SW"], ...ring(6, .5, .5, .44)], e: [1, 2, 3, 4, 5, 6].map((i) => [0, i]) },
      { name: "Spine · Leaf", a: .78, n: [[.28, .04, 1, "SPINE"], [.72, .04, 1, "SPINE"], [.06, .5, 0], [.35, .5, 0], [.65, .5, 0], [.94, .5, 0], [.06, .96, 0], [.35, .96, 0], [.65, .96, 0], [.94, .96, 0]],
        e: [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 6], [3, 7], [4, 8], [5, 9]] },
      { name: "Ring · OSPF", a: 1, n: ring(7, .5, .5, .45).map((p, i) => (i === 0 ? [p[0], p[1], 1, "R1"] : p)), e: chain(0, 7, true) },
      { name: "3-Tier Campus", a: .8, n: [[.5, .03, 1, "CORE"], [.25, .38, 1], [.75, .38, 1], [.08, .72, 0], [.38, .72, 0], [.62, .72, 0], [.92, .72, 0], [.02, .98, 0], [.16, .98, 0], [.84, .98, 0], [.98, .98, 0]],
        e: [[0, 1], [0, 2], [1, 2, 1], [1, 3], [1, 4], [2, 5], [2, 6], [3, 7], [3, 8], [6, 9], [6, 10]] },
      { name: "Full Mesh · WAN", a: 1, n: ring(5, .5, .53, .45).map((p) => [p[0], p[1], 1]), e: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]] },
      { name: "SD-WAN Hub", a: 1, n: [[.5, .5, 1, "HQ"], ...ring(6, .5, .5, .45, -Math.PI / 3)], e: [1, 2, 3, 4, 5, 6].map((i) => [0, i, 1]) },
      { name: "Bus", a: .45, n: [[0, .5, 0], [.2, .5, 0], [.4, .5, 0], [.6, .5, 0], [.8, .5, 0], [1, .5, 0], [.2, .04, 0], [.4, .96, 0], [.6, .04, 0], [.8, .96, 0]],
        e: [...chain(0, 6), [1, 6], [2, 7], [3, 8], [4, 9]] }
    ],
    sec: [
      { name: "DMZ", a: .72, n: [[.02, .5, 0, "WAN"], [.3, .5, 1, "FW"], [.5, .06, 0, "WEB"], [.76, .06, 0, "MAIL"], [.6, .62, 1, "FW"], [.88, .46, 0], [.97, .82, 0], [.74, .97, 0]],
        e: [[0, 1, 1], [1, 2], [1, 3], [2, 3], [1, 4], [4, 5], [4, 6], [4, 7]] },
      { name: "Defense in Depth", a: 1, n: [[.5, .5, 1, "DATA"], ...ring(6, .5, .5, .22), ...ring(8, .5, .5, .46, -Math.PI / 8)],
        e: [...chain(1, 6, true), ...chain(7, 8, true), [0, 1], [0, 3], [0, 5], [2, 8], [4, 11], [6, 13]] },
      { name: "Zero Trust", a: .72, n: [[.04, .14, 0], [.04, .5, 0], [.04, .86, 0], [.36, .5, 1, "PEP"], [.36, .03, 1, "PDP"], [.96, .14, 0], [.96, .5, 0], [.96, .86, 0]],
        e: [[0, 3], [1, 3], [2, 3], [3, 4, 1], [3, 5], [3, 6], [3, 7]] },
      { name: "SIEM · SOC", a: 1, n: [[.5, .5, 1, "SIEM"], ...ring(7, .5, .5, .44).map((p, i) => [p[0], p[1], 0, ["FW", "DC", "EDR", "", "M365", "", "DNS"][i]])], e: [1, 2, 3, 4, 5, 6, 7].map((i) => [i, 0]) },
      { name: "VLAN Segments", a: .82, n: [[.5, .03, 1, "L3"], [.14, .48, 1, "VLAN 10"], [.04, .95, 0], [.26, .95, 0], [.5, .52, 1, "VLAN 20"], [.4, .97, 0], [.6, .97, 0], [.86, .48, 1, "VLAN 30"], [.74, .95, 0], [.96, .95, 0]],
        e: [[0, 1], [0, 4], [0, 7], [1, 2], [1, 3], [2, 3], [4, 5], [4, 6], [5, 6], [7, 8], [7, 9], [8, 9]] },
      { name: "Honeypot", a: .6, n: [[.03, .5, 0, "?"], [.55, .5, 1, "TRAP"], ...ring(5, .55, .5, .17, 0, .28), [.96, .1, 0, "SOC"]],
        e: [[0, 1, 1], ...chain(2, 5, true), [1, 7]] }
    ],
    ad: [
      { name: "AD Forest", a: .8, n: [[.5, .04, 1, "DC"], [.2, .44, 1, "DC"], [.8, .44, 1, "DC"], [.06, .94, 0], [.34, .94, 0], [.66, .94, 0], [.94, .94, 0]],
        e: [[0, 1, 1], [0, 2, 1], [1, 3], [1, 4], [3, 4, 1], [2, 5], [2, 6], [5, 6, 1]] },
      { name: "AD Replication", a: .9, n: [[.1, .14, 1, "PDC"], [.3, .34, 0], [.9, .14, 1, "DC"], [.7, .34, 0], [.5, .97, 1, "DC"], [.5, .74, 0]],
        e: [[0, 1], [2, 3], [4, 5], [1, 3, 1], [3, 5, 1], [5, 1, 1]] },
      { name: "Kerberos", a: .7, n: [[.05, .9, 0, "USER"], [.5, .05, 1, "KDC"], [.95, .9, 1, "SVC"], [.28, .48, 0], [.72, .48, 0], [.5, .9, 0]],
        e: [[0, 3], [3, 1], [1, 4, 1], [4, 2, 1], [0, 5], [5, 2]] }
    ],
    vm: [
      { name: "VM Cluster", a: .85, n: [[.18, .44, 1, "HOST"], [.5, .44, 1, "HOST"], [.82, .44, 1, "HOST"], [.07, .05, 0], [.18, .02, 0], [.29, .05, 0], [.39, .05, 0], [.5, .02, 0], [.61, .05, 0], [.71, .05, 0], [.82, .02, 0], [.93, .05, 0], [.5, .96, 1, "SAN"]],
        e: [[0, 3], [0, 4], [0, 5], [1, 6], [1, 7], [1, 8], [2, 9], [2, 10], [2, 11], [0, 12], [1, 12], [2, 12], [0, 1, 1], [1, 2, 1]] },
      { name: "Kubernetes", a: .85, n: [[.5, .03, 1, "K8s"], [.14, .48, 1], [.5, .48, 1], [.86, .48, 1], [.06, .95, 0], [.22, .95, 0], [.42, .95, 0], [.58, .95, 0], [.78, .95, 0], [.94, .95, 0]],
        e: [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 6], [2, 7], [3, 8], [3, 9]] },
      { name: "HCI · vSAN", a: 1, n: [[.5, .5, 1, "vSAN"], [.12, .12, 1], [.88, .12, 1], [.88, .88, 1], [.12, .88, 1], [.02, .3, 0], [.98, .3, 0], [.98, .7, 0], [.02, .7, 0]],
        e: [[1, 2], [2, 3], [3, 4], [4, 1], [0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 6], [3, 7], [4, 8]] }
    ],
    ai: [
      { name: "Neural Network", a: .8, n: [], e: [], nn: [3, 4, 4, 2] },
      { name: "RAG Pipeline", a: .5, n: [[.02, .1, 0], [.02, .5, 0], [.02, .9, 0], [.27, .5, 0, "EMBED"], [.52, .5, 1, "VECTOR DB"], [.78, .5, 1, "LLM"], [.98, .5, 0, "ANSWER"], [.78, .02, 0, "PROMPT"]],
        e: [[0, 3], [1, 3], [2, 3], [3, 4], [4, 5], [5, 6], [7, 5]] },
      { name: "AI Agent", a: 1, n: [[.5, .5, 1, "AGENT"], ...ring(6, .5, .5, .44).map((p, i) => [p[0], p[1], 0, ["SIEM", "EDR", "AD", "TICKETS", "EMAIL", "KB"][i]])], e: [1, 2, 3, 4, 5, 6].map((i) => [0, i, 1]) },
      { name: "Self-Attention", a: .55, n: [...[0, 1, 2, 3, 4].map((i) => [.04 + i * .23, .04, 0]), ...[0, 1, 2, 3, 4].map((i) => [.04 + i * .23, .96, 0])], e: [], attn: true }
    ]
  };
  // fill in the generated ones
  T.ai.forEach((t) => {
    if (t.nn) { const xs = [.04, .36, .66, .96]; t.nn.forEach((cnt, li) => { for (let j = 0; j < cnt; j++) t.n.push([xs[li], .5 + (j - (cnt - 1) / 2) * .26, li === 3 ? 1 : 0]); });
      let o = 0; t.nn.forEach((cnt, li) => { if (li < t.nn.length - 1) for (let a = 0; a < cnt; a++) for (let b = 0; b < t.nn[li + 1]; b++) t.e.push([o + a, o + cnt + b]); o += cnt; }); }
    if (t.attn) for (let a = 0; a < 5; a++) for (let b = 5; b < 10; b++) if (Math.abs(a - (b - 5)) < 3) t.e.push([a, b]);
  });
  // interleave categories so neighbours are always different kinds
  const CATS = ["net", "sec", "ad", "vm", "ai"], ALL = [];
  for (let i = 0; ALL.length < 23; i++) CATS.forEach((c) => { const t = T[c][i]; if (t) ALL.push(t); });

  /* ---------- layers ---------- */
  let built = false;
  let W = 0, H = 0, docH = 0, dark = false, gutter = 0, items = [], secs = [], excl = [], fhead = "Georgia, serif";
  let col = [80, 110, 220], sy = scrollY, mx = 0, my = 0, smx = 0, smy = 0, packets = [], lastFx = 0, exclAt = 0, deck = 0;

  const LAYERS = () => mobile
    ? [{ z: 3, w: [70, 92], al: .55, names: false, labels: false, zone: "all", gap: 200 }, { z: 1.6, w: [104, 130], al: .8, names: true, labels: false, zone: "all", gap: 430 }]
    : [{ z: 3.4, w: [66, 88], al: .45, names: false, labels: false, zone: "all", gap: 300 },
       { z: 1.8, w: [104, 128], al: .72, names: true, labels: false, zone: "all", gap: 520 },
       { z: 1.12, w: [Math.max(130, Math.min(200, gutter * .86)), Math.max(130, Math.min(210, gutter * .9))], al: 1, names: true, labels: true, zone: "gut", gap: 560 }];

  function build() {
    W = innerWidth; H = innerHeight; docH = root.scrollHeight; dark = root.classList.contains("dark");
    const DPR = Math.min(1.5, devicePixelRatio || 1); cv.width = W * DPR; cv.height = H * DPR; x.setTransform(DPR, 0, 0, DPR, 0, 0);
    fhead = getComputedStyle(root).getPropertyValue("--f-head").trim() || fhead;
    const ref = document.querySelector("#profile-card") || document.querySelector(".section-inner");
    gutter = ref ? Math.max(0, ref.getBoundingClientRect().left) : Math.max(0, (W - 1120) / 2);
    secs = [document.querySelector(".hero"), ...document.querySelectorAll(".section, .footer")].filter(Boolean).map((el) => ({ top: el.getBoundingClientRect().top + scrollY, el }));
    items = []; deck = 0; packets = []; buildClouds();
    LAYERS().forEach((L, li) => {
      if (L.zone === "gut" && gutter < 110) return;
      const lo = H / 2 - (H / 2 + 260) * L.z, hi = docH - H / 2 + (H / 2 + 260) * L.z, step = L.gap * L.z;
      const sides = L.zone === "gut" ? ["l", "r"] : ["a"];
      sides.forEach((side, si) => {
        for (let d = lo + si * step / 2 + rnd(0, step * .3); d < hi; d += step * rnd(.85, 1.15)) {
          const w = rnd(L.w[0], L.w[1]);
          let cx;
          if (side === "a") cx = rnd(.04, .96) * W;
          else { const g = Math.max(w * .6, gutter); cx = side === "l" ? g / 2 + rnd(-6, 6) : W - g / 2 + rnd(-6, 6); }
          items.push({ L, li, w, bx: cx - w / 2, docY: d, born: 0, ph: rnd(0, 7) });
        }
      });
    });
    // give each spot a topology that none of its on-screen neighbours is showing
    items.sort((a, b) => a.docY - b.docY);
    items.forEach((it, i) => {
      const near = new Set(items.slice(Math.max(0, i - 12), i).filter((o) => Math.abs(o.docY - it.docY) < H * 1.4).map((o) => o.t));
      let t = ALL[deck++ % ALL.length], tries = 0;
      while (near.has(t) && tries++ < ALL.length) t = ALL[deck++ % ALL.length];
      it.t = t; it.h = it.w * t.a; it.tw = t.n.map(() => [rnd(0, 7), rnd(1.2, 2.6)]);
    });
    items.sort((a, b) => b.L.z - a.L.z);
    refreshExcl(true);
    draw(performance.now(), true);
  }

  /* the islands and the section constellations stay clear of the star map */
  const EXCL_SEL = ".sb-isles .isle-bob svg, .sb-cst:not(.x) svg, .sec-head, .credits > *, .footer-note, .shinx-sleep, .proj-tools, #project-filters, .hero .name-logo, .hero .lockup-pre, .title-menu";
  /* ---------- clouds (bright mode): three depths, sunlit tops, slow drift ---------- */
  let clouds = [], cloudSpr = [], isles = [];
  const foot = document.querySelector(".footer");
  function cloudSprite(w, h) {
    const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
    for (let i = 0; i < 26; i++) {
      const cx = w * rnd(.12, .88), cy = h * (.5 + .22 * (Math.random() - .3)), r = h * rnd(.18, .36) * (1 - Math.abs(cx / w - .5) * .8);
      const rg = g.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, "rgba(255,255,255,.95)"); rg.addColorStop(.6, "rgba(255,255,255,.6)"); rg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    }
    g.globalCompositeOperation = "source-atop"; const v = g.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, "rgba(255,249,236,.9)"); v.addColorStop(.42, "rgba(255,255,255,0)"); v.addColorStop(1, "rgba(176,190,236,.55)");
    g.fillStyle = v; g.fillRect(0, 0, w, h); return c;
  }
  function buildClouds() {
    if (!cloudSpr.length) cloudSpr = [0, 1, 2, 3].map(() => cloudSprite(420, 150));
    clouds = [];
    const CL = mobile ? [{ z: 4.2, w: [150, 210], al: .5, gap: 380 }, { z: 1.8, w: [240, 320], al: .62, gap: 520 }]
      : [{ z: 4.6, w: [200, 280], al: .48, gap: 330 }, { z: 2.5, w: [300, 420], al: .6, gap: 460 }, { z: 1.45, w: [440, 600], al: .66, gap: 640 }];
    CL.forEach((L) => {
      const lo = H / 2 - (H / 2 + 200) * L.z, hi = docH - H / 2 + (H / 2 + 200) * L.z;
      for (let d = lo + rnd(0, L.gap * L.z); d < hi; d += L.gap * L.z * rnd(.7, 1.3)) {
        const w = rnd(L.w[0], L.w[1]); clouds.push({ L, w, h: w * .36, bx: rnd(-.2, 1.1) * W, docY: d, s: cloudSpr[(Math.random() * 4) | 0], v: rnd(3, 7) / L.z, flip: Math.random() < .5 });
      }
    });
    clouds.sort((a, b) => b.L.z - a.L.z);
  }
  function drawClouds(now) {
    if (dark) return;
    // clouds belong to the day sky: none over the footer's night (footer position cached, no layout reads)
    const fs = secs.find((q) => q.el === foot), ft = fs ? fs.top - scrollY + 30 : H; if (ft <= 0) return;
    xc.save(); xc.globalCompositeOperation = "destination-over";   // tuck the clouds behind the stars
    xc.beginPath(); xc.rect(0, 0, W, Math.min(H, ft)); xc.clip();
    clouds.forEach((c) => {
      const y = H / 2 + (c.docY - scrollY - H / 2) / c.L.z - smy * 24 / c.L.z; if (y > H || y + c.h < 0) return;
      const span = W + c.w * 2, xx = ((c.bx + (calm() ? 0 : now / 1000 * c.v) - smx * 36 / c.L.z) % span + span) % span - c.w;
      // islands stay visible: a cloud in front of one thins out
      const over = isles.some((r) => r.left < xx + c.w && r.right > xx && r.top < y + c.h && r.bottom > y);
      xc.globalAlpha = c.L.al * (over ? .3 : 1);
      if (c.flip) { xc.save(); xc.translate(xx + c.w, y); xc.scale(-1, 1); xc.drawImage(c.s, 0, 0, c.w, c.h); xc.restore(); } else xc.drawImage(c.s, xx, y, c.w, c.h);
    });
    xc.globalAlpha = 1; xc.restore();
  }

  let exclDoc = [], exclY = -1;
  function measureExcl() {
    exclDoc = [];
    document.querySelectorAll(EXCL_SEL).forEach((el) => { const r = el.getBoundingClientRect(); if (r.width > 4) exclDoc.push({ l: r.left, r: r.right, t: r.top + scrollY, b: r.bottom + scrollY, isle: !!el.closest(".sb-isles"), fixed: !!el.closest(".title-menu, .nav") }); });
    exclAt = performance.now(); exclY = -1;
  }
  function refreshExcl(force) {
    const now = performance.now();
    // re-measure only when idle (islands bob, menus open); while the page glides, reuse the cached layout
    if (force === true && !document.body.classList.contains("jumping")) measureExcl();
    else if (now - exclAt > 1500 && !document.body.classList.contains("jumping") && scrollY === lastSY) measureExcl();
    if (scrollY === exclY && !force) return; exclY = scrollY;
    excl = []; isles = [];
    exclDoc.forEach((d) => { const top = d.t - scrollY, bot = d.b - scrollY; if (bot > -40 && top < H + 40) { const rr = { left: d.l, right: d.r, top, bottom: bot, width: d.r - d.l, height: bot - top }; excl.push(rr); if (d.isle) isles.push(rr); } });
  }
  let lastSY = scrollY;

  const screenY = (it) => H / 2 + (it.docY - scrollY - H / 2) / it.L.z - smy * 30 / it.L.z;
  const screenX = (it) => it.bx - smx * 44 / it.L.z;

  let secEl = null, secDark = null, secTarget = null;
  function secColor() {
    const mid = scrollY + H * .5; let el = secs[0] && secs[0].el;
    secs.forEach((s) => { if (s.top < mid) el = s.el; });
    if (el !== secEl || dark !== secDark) { secEl = el; secDark = dark; secTarget = parse(el ? getComputedStyle(el).getPropertyValue("--sec").trim() : ""); }
    let rgb = secTarget || (dark ? [127, 166, 255] : [43, 85, 214]);
    if (dark) rgb = rgb.map((v) => v + (255 - v) * .38);
    for (let i = 0; i < 3; i++) col[i] += (rgb[i] - col[i]) * (calm() ? 1 : .08);
  }
  const pcache = {};
  function parse(c) {
    if (!c) return null; if (pcache[c]) return pcache[c];
    const p = document.createElement("i"); p.style.color = c; document.body.appendChild(p); const m = getComputedStyle(p).color.match(/\d+/g); p.remove();
    return (pcache[c] = m ? m.slice(0, 3).map(Number) : null);
  }
  const rgba = (a) => `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a})`;
  // by day: lines and names in deep ink tinted by the section, stars and comets in gold
  const inkA = (a) => (dark ? rgba(a) : `rgba(${(col[0] * .35 + 22) | 0},${(col[1] * .35 + 26) | 0},${(col[2] * .35 + 70) | 0},${a})`);
  const goldA = (a) => (dark ? rgba(a) : `rgba(240,${(150 + col[1] * .12) | 0},40,${a})`);

  function drawItem(it, now) {
    const sx = screenX(it), sy2 = screenY(it), { t, w, h, L } = it;
    if (sy2 > H + 40 || sy2 + h < -40 || sx > W || sx + w < 0) return false;
    // fade the whole constellation out while it would overlap an island, a section constellation or text
    const bx0 = sx - 10, by0 = sy2 - 14, bx1 = sx + w + 10, by1 = sy2 + h + (L.names ? 32 : 10);
    const hit = excl.some((r) => r.left - 6 < bx1 && r.right + 6 > bx0 && r.top - 6 < by1 && r.bottom + 6 > by0);
    it.f = it.f === undefined ? (hit ? 0 : 1) : it.f + ((hit ? 0 : 1) - it.f) * (calm() ? 1 : .14);
    if (it.f < .02) { it.P = null; return false; }
    if (!it.born) it.born = now;
    const p = calm() ? 1 : clamp((now - it.born) / 1700), al = L.al * it.f, k = w / 150;
    const P = t.n.map(([u, v]) => [sx + u * w, sy2 + v * h]);
    // lines: faint threads between the stars, drawn in the first time they're seen
    x.lineWidth = 1; x.lineCap = "round";
    t.e.forEach(([a, b2, dash], i) => {
      const q = clamp(p * 1.5 - (i / t.e.length) * .5); if (q <= 0) return;
      const A = P[a], B = P[b2];
      x.strokeStyle = inkA((dark ? .2 : .26) * al * (t.attn ? .6 : 1)); x.setLineDash(dash ? [2, 4] : []);
      x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(A[0] + (B[0] - A[0]) * q, A[1] + (B[1] - A[1]) * q); x.stroke();
    });
    x.setLineDash([]);
    // stars: a soft glow and a bright point; the big ones get sparkle spikes, and they flare when a packet lands
    if (dark) x.globalCompositeOperation = "lighter";
    t.n.forEach((n, i) => {
      const [tp, sp] = it.tw[i], twk = calm() ? 1 : .62 + .38 * Math.sin(now * .001 * sp + tp) * Math.sin(now * .00037 * sp + tp * 2);
      const fl = it.fl && it.fl[i] ? clamp(1 - (now - it.fl[i]) / 700) : 0, A = P[i], kk = Math.max(.8, Math.min(1.2, k));
      const sz = (n[2] ? 15 : 9) * kk * (.85 + .25 * twk + fl * .9);
      x.globalAlpha = clamp(al * (.55 + .45 * twk + fl)); x.drawImage(SPR.glow, A[0] - sz / 2, A[1] - sz / 2, sz, sz);
      if (n[2] || fl > .2) { const sl = sz * (1.5 + fl * 1.2); x.globalAlpha = clamp(al * (.35 + .35 * twk + fl)); x.drawImage(SPR.spike, A[0] - sl / 2, A[1] - sl / 2, sl, sl); }
      x.globalAlpha = 1;
    });
    x.globalCompositeOperation = "source-over";
    if (L.labels && p > .6) t.n.forEach((n, i) => {
      if (!n[3]) return; const A = P[i];
      x.font = `600 ${7.5 * Math.max(.9, Math.min(1.15, k))}px ui-monospace, Menlo, Consolas, monospace`; x.fillStyle = inkA((dark ? .42 : .5) * al * clamp((p - .6) * 2.5)); x.textAlign = "center";
      x.fillText(n[3], clamp(A[0], 18, W - 18), A[1] + (A[1] - sy2 > h * .6 ? 13 : -8) * (n[2] ? 1.15 : 1));
    });
    // the constellation's name
    if (L.names && p > .5) {
      x.font = `italic 600 ${L.li === 2 ? 12 : 10.5}px ${fhead}`; x.textAlign = "center"; x.fillStyle = inkA((dark ? .42 : .55) * al * clamp((p - .5) * 2));
      try { x.letterSpacing = "1.6px"; } catch (e) {}
      const nm = t.name.toUpperCase(), tw = x.measureText(nm).width / 2 + 8;
      x.fillText(nm, clamp(sx + w / 2, tw, W - tw), sy2 + h + (L.labels ? 26 : 18));
      try { x.letterSpacing = "0px"; } catch (e) {}
    }
    x.textAlign = "left";
    it.P = P; return true;
  }

  const adj = (t) => t.adj || (t.adj = t.n.map((_, i) => t.e.filter((e) => e[0] === i || e[1] === i).map((e) => (e[0] === i ? e[1] : e[0]))));
  function spawn(now, vis) {
    const pool = vis.filter((v) => v.P && v.f > .5 && v.t.e.length && (now - v.born) > 900); if (!pool.length) return;
    const it = pool.filter((v) => v.L.li > 0).length && Math.random() < .8 ? pool.filter((v) => v.L.li > 0)[(Math.random() * pool.filter((v) => v.L.li > 0).length) | 0] : pool[(Math.random() * pool.length) | 0];
    const A = adj(it.t); let cur = it.t.e[(Math.random() * it.t.e.length) | 0][Math.random() < .5 ? 0 : 1];
    const route = [cur], hops = 2 + ((Math.random() * 4) | 0);
    for (let h = 0; h < hops; h++) { const nx = A[cur].filter((j) => j !== route[route.length - 2]); if (!nx.length) break; cur = nx[(Math.random() * nx.length) | 0]; route.push(cur); }
    if (route.length < 2) return;
    packets.push({ it, route, seg: 0, q: 0, trail: [], speed: rnd(.07, .11) * (it.w / 150), last: now });
  }
  function fx(now, vis) {
    if (!calm() && now - lastFx > (mobile ? 600 : 380) && packets.length < (mobile ? 4 : 9)) { lastFx = now; spawn(now, vis); }
    if (dark) x.globalCompositeOperation = "lighter";
    packets = packets.filter((pk) => {
      const it = pk.it; if (!it.P || it.f < .05) return false;
      const dt = Math.min(80, now - pk.last); pk.last = now;
      let A, B, len;
      if (!pk.done) { A = it.P[pk.route[pk.seg]]; B = it.P[pk.route[pk.seg + 1]]; len = Math.max(1, Math.hypot(B[0] - A[0], B[1] - A[1])); pk.q += pk.speed * dt / len; }
      while (!pk.done && pk.q >= 1) {
        pk.q -= 1; pk.seg++; (it.fl || (it.fl = []))[pk.route[pk.seg]] = now;
        if (pk.seg >= pk.route.length - 1) { pk.done = now; break; }
        A = it.P[pk.route[pk.seg]]; B = it.P[pk.route[pk.seg + 1]]; len = Math.max(1, Math.hypot(B[0] - A[0], B[1] - A[1])); pk.q *= 1;
      }
      const al = it.L.al * it.f;
      if (!pk.done) { const hx = A[0] + (B[0] - A[0]) * pk.q, hy = A[1] + (B[1] - A[1]) * pk.q; pk.trail.unshift([hx, hy]); if (pk.trail.length > 18) pk.trail.pop(); }
      else { pk.trail.pop(); if (!pk.trail.length) return false; }
      // the comet tail
      for (let i = pk.trail.length - 1; i > 0; i--) {
        const [x1, y1] = pk.trail[i], [x2, y2] = pk.trail[i - 1], f = 1 - i / pk.trail.length;
        x.strokeStyle = i < 3 ? `rgba(255,255,255,${(dark ? .8 : .9) * f * al})` : goldA((dark ? .7 : .85) * f * al); x.lineWidth = 3 * f + .5;
        x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
      }
      // the head
      if (!pk.done) { const [hx, hy] = pk.trail[0], sz = 20 * Math.max(.8, Math.min(1.2, it.w / 150)); x.globalAlpha = clamp(al * 1.1); x.drawImage(SPR.glow, hx - sz / 2, hy - sz / 2, sz, sz); x.globalAlpha = clamp(al * .7); x.drawImage(SPR.spike, hx - sz * .8, hy - sz * .8, sz * 1.6, sz * 1.6); x.globalAlpha = 1; }
      return true;
    });
    x.globalCompositeOperation = "source-over";
  }

  /* star sprites, re-tinted when the section colour changes */
  const SPR = {}; let sprKey = "";
  function sprites() {
    const key = col.map((v) => (v / 8) | 0).join() + dark; if (key === sprKey) return; sprKey = key;
    const c = (s2) => { const e = document.createElement("canvas"); e.width = e.height = s2; return e; }, S = 64, m = S / 2;
    const c1 = dark ? (a) => `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a})` : goldA;
    SPR.glow = c(S); let g = SPR.glow.getContext("2d"), r = g.createRadialGradient(m, m, 0, m, m, m);
    if (dark) { r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.12, "rgba(255,255,255,.95)"); r.addColorStop(.3, c1(.45)); r.addColorStop(1, c1(0)); }
    else { r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.1, "rgba(255,255,255,1)"); r.addColorStop(.2, c1(.9)); r.addColorStop(.42, c1(.28)); r.addColorStop(1, c1(0)); }
    g.fillStyle = r; g.fillRect(0, 0, S, S);
    SPR.spike = c(S); g = SPR.spike.getContext("2d");
    [[0, m, S, m], [m, 0, m, S]].forEach(([x1, y1, x2, y2]) => {
      const lg = g.createLinearGradient(x1, y1, x2, y2); lg.addColorStop(0, c1(0)); lg.addColorStop(.5, dark ? "rgba(255,255,255,.95)" : c1(.9)); lg.addColorStop(1, c1(0));
      g.strokeStyle = lg; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    });
  }

  function draw(now, force) {
    smx += (mx - smx) * .08; smy += (my - smy) * .08;
    secColor(); sprites(); refreshExcl(force); lastSY = sy; sy = scrollY;
    x.clearRect(0, 0, W, H);
    const vis = items.filter((it) => drawItem(it, now));
    fx(now, vis);
    // keep the islands, section constellations and text clear (works however the zones overlap)
    excl.forEach((r) => x.clearRect(r.left - 8, r.top - 8, r.width + 16, r.height + 16));
    drawClouds(now);
  }

  /* ---------- loop: ~30 fps, paused when hidden; static with reduced motion ---------- */
  let last = 0, lastScroll = -1;
  const loop = (t) => {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    if (cv.style.visibility === "hidden") { lastScroll = -1; return; }   // only drawn while the footer is on screen
    if (calm()) { if (scrollY === lastScroll) return; lastScroll = scrollY; draw(t, true); return; }
    // while the page moves, redraw every frame so the stars stay locked to the scroll;
    // when it's still, ~30 fps is plenty for twinkles and comets
    const moved = scrollY !== lastScroll; lastScroll = scrollY;
    if (!moved && t - last < (mobile ? 45 : 33)) return; last = t;
    draw(t);
  };
  if (fine) addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  let rt; const rebuild = () => { clearTimeout(rt); rt = setTimeout(build, 220); };
  addEventListener("resize", rebuild, { passive: true });
  function sweep(toDark) {
    if (calm()) return;
    const sw = document.createElement("div"); sw.className = "theme-sweep " + (toDark ? "to-dark" : "to-light"); sw.setAttribute("aria-hidden", "true");
    const sp = document.createElement("div"); sp.className = "theme-sparks"; sp.setAttribute("aria-hidden", "true");
    for (let i = 0; i < (mobile ? 14 : 26); i++) {
      const s2 = document.createElement("i"), yy = rnd(4, 96);
      s2.style.cssText = `left:${rnd(2, 98)}%;top:${yy}%;--d:${((toDark ? yy : 100 - yy) / 100 * .8 + rnd(0, .15)).toFixed(2)}s;--c:${toDark ? "rgba(170,195,255,.9)" : "rgba(255,196,90,.9)"}`;
      sp.appendChild(s2);
    }
    document.body.append(sw, sp); setTimeout(() => { sw.remove(); sp.remove(); }, 2300);
  }
  new MutationObserver(() => { if (root.classList.contains("dark") !== dark) { dark = !dark; sprKey = ""; if (built) sweep(dark); draw(performance.now(), true); } }).observe(root, { attributes: true, attributeFilter: ["class"] });
  let lastDoc = 0;
  new ResizeObserver(() => { const h = root.scrollHeight; if (Math.abs(h - lastDoc) > 200) { lastDoc = h; rebuild(); } }).observe(document.body);
  build(); built = true; requestAnimationFrame(loop);
})();

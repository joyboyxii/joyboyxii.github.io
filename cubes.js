/* Floating reflective cubes: a background layer drawn on one canvas.
   Sits above the section skies and star map, below all content. No libraries. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const cv = document.createElement("canvas");
  cv.id = "cubes"; cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, DPR = 1;
  const fit = () => { DPR = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); };
  // width of the empty space beside the content column
  let gutter = 60;
  const measure = () => { const el = document.querySelector("#experience .sec-head, .sec-head"); const l = el ? el.getBoundingClientRect().left : 0; gutter = Math.max(14, Math.min(l, W - (el ? el.getBoundingClientRect().right : W))); };
  fit(); addEventListener("resize", () => { fit(); measure(); if (still()) draw(0); });
  addEventListener("load", measure); setTimeout(measure, 600);

  // ---- settings (preview switcher writes these) ----
  const style = "chrome";   // mirrored cubes reflecting the site's blue and violet
  const still = () => reduce || root.classList.contains("calm");

  // ---- cubes ----
  const rnd = (a, b) => a + Math.random() * (b - a);
  const N = innerWidth < 760 ? 6 : 12;
  const cubes = [];
  for (let i = 0; i < N; i++) {
    const z = rnd(0, 1);                                  // 0 = far, 1 = near
    // every cube lives in the empty margin beside the content, so text stays clear
    cubes.push({ side: i % 2, u: rnd(.2, .8), y: rnd(0, 1), z, s0: 18 + z * z * 64 + rnd(-4, 6),
      ax: rnd(0, 6.28), ay: rnd(0, 6.28), az: rnd(0, 6.28),
      vx: rnd(-.18, .18), vy: rnd(-.22, .22), vz: rnd(-.12, .12),
      dx: rnd(-.004, .004), dy: rnd(-.006, -.002), ph: rnd(0, 6.28), hue: rnd(0, 1) });
  }
  cubes.sort((a, b) => a.z - b.z);

  const V = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  const F = [[0,1,2,3,[0,0,-1]],[5,4,7,6,[0,0,1]],[4,0,3,7,[-1,0,0]],[1,5,6,2,[1,0,0]],[4,5,1,0,[0,-1,0]],[3,2,6,7,[0,1,0]]];
  const rot = (p, a, b, c) => {
    let [x, y, z] = p, t;
    t = y * Math.cos(a) - z * Math.sin(a); z = y * Math.sin(a) + z * Math.cos(a); y = t;
    t = x * Math.cos(b) + z * Math.sin(b); z = -x * Math.sin(b) + z * Math.cos(b); x = t;
    t = x * Math.cos(c) - y * Math.sin(c); y = x * Math.sin(c) + y * Math.cos(c); x = t;
    return [x, y, z];
  };

  // environment the cubes "reflect": a sky above, violet horizon, deep navy below
  const env = (n, day) => {
    const up = -n[1];                       // screen y points down
    const top = day ? [235, 242, 255] : [150, 185, 255], mid = day ? [190, 175, 255] : [120, 90, 230], low = day ? [120, 140, 210] : [12, 16, 48];
    const k = (up + 1) / 2, m = k > .5 ? (k - .5) * 2 : k * 2, A = k > .5 ? mid : low, B = k > .5 ? top : mid;
    return [A[0] + (B[0] - A[0]) * m, A[1] + (B[1] - A[1]) * m, A[2] + (B[2] - A[2]) * m];
  };
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const hsl = (h, s, l, a) => `hsla(${(h * 360) % 360},${s}%,${l}%,${a})`;

  let mx = 0, my = 0, smx = 0, smy = 0;
  addEventListener("pointermove", (e) => { mx = e.clientX / W - .5; my = e.clientY / H - .5; }, { passive: true });

  function drawCube(c, t, day) {
    const depth = .35 + c.z * .65;                       // far cubes are smaller, dimmer, slower
    const sy = scrollY * (.04 + c.z * .12);              // parallax with scroll
    const narrow = gutter < 70;                          // phones: no real margin, so cubes stay tiny and faint
    const S = narrow ? 7 + c.z * 9 : Math.min(c.s0, gutter * .34);
    const cxm = gutter * c.u + Math.sin(t * .05 + c.ph) * gutter * .06;
    let px = (c.side ? cxm : W - cxm) + smx * c.z * Math.min(40, gutter * .1);
    let py = (((c.y + t * c.dy) * (H + 240) - sy) % (H + 240) + (H + 240)) % (H + 240) - 120 + Math.sin(t * .4 + c.ph) * 10 * depth + smy * c.z * 30;
    const a = c.ax + t * c.vx, b = c.ay + t * c.vy, g = c.az + t * c.vz;
    const f = 4.2;
    const P = V.map((v) => { const r = rot(v, a, b, g), k = f / (f + r[2] * .6); return [px + r[0] * S * k, py + r[1] * S * k, r[2]]; });
    const faces = F.map(([i0, i1, i2, i3, n]) => ({ q: [P[i0], P[i1], P[i2], P[i3]], n: rot(n, a, b, g) }))
      .filter((fc) => fc.n[2] < 0).sort((u, v) => v.n[2] - u.n[2]);
    const alphaBase = (.28 + c.z * .62) * (narrow ? .5 : 1);
    // soft glow under each cube
    const glow = ctx.createRadialGradient(px, py, 0, px, py, S * 2.2);
    glow.addColorStop(0, day ? `rgba(120,140,255,${.10 * alphaBase})` : `rgba(130,110,255,${.16 * alphaBase})`); glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow; ctx.fillRect(px - S * 2.2, py - S * 2.2, S * 4.4, S * 4.4);

    for (const fc of faces) {
      const q = fc.q, n = fc.n, facing = -n[2];        // 1 = facing us, 0 = edge-on
      const fres = Math.pow(1 - facing, 2);
      ctx.save(); ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]); ctx.closePath();
      // gradient across the face, oriented by its normal, so it reads as a mirrored surface
      const cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2, L = S * 1.3;
      const gx = n[0] * L, gy = n[1] * L;
      const gr = ctx.createLinearGradient(cx - gx - L * .5, cy - gy - L * .5, cx + gx + L * .5, cy + gy + L * .5);
      const e1 = env(n, day), e2 = env([n[0], -n[1], n[2]], day);
      if (style === "chrome") {
        gr.addColorStop(0, rgba(e1, alphaBase)); gr.addColorStop(.48, rgba(e2, alphaBase)); gr.addColorStop(.5, rgba([10, 12, 30], alphaBase)); gr.addColorStop(1, rgba(e1, alphaBase * .9));
      } else if (style === "holo") {
        const h = c.hue + n[0] * .25 + n[1] * .15 + t * .02;
        gr.addColorStop(0, hsl(h, 90, 72, alphaBase * .55)); gr.addColorStop(.5, hsl(h + .18, 85, 62, alphaBase * .4)); gr.addColorStop(1, hsl(h + .36, 90, 70, alphaBase * .55));
      } else { // glass
        gr.addColorStop(0, rgba(e1, alphaBase * (.16 + fres * .35))); gr.addColorStop(1, rgba(e2, alphaBase * (.05 + fres * .25)));
      }
      ctx.fillStyle = gr; ctx.fill();
      // moving specular streak, clipped to the face
      ctx.clip();
      const sp = ((t * .12 + c.ph + n[0]) % 2) - .5;   // sweeps across every few seconds
      const sx = cx + (sp - .5) * L * 2.4;
      const sg = ctx.createLinearGradient(sx - L * .35, cy - L, sx + L * .35, cy + L);
      const shine = (style === "chrome" ? .7 : style === "holo" ? .5 : .55) * alphaBase * (.4 + facing * .6);
      sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(.5, `rgba(255,255,255,${shine})`); sg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sg; ctx.fillRect(cx - L * 2, cy - L * 2, L * 4, L * 4);
      ctx.restore();
      // edges: bright rim, stronger at grazing angles (fresnel)
      ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]); ctx.closePath();
      ctx.lineWidth = .6 + c.z * .9;
      ctx.strokeStyle = style === "holo" ? hsl(c.hue + n[0] * .3, 95, 82, alphaBase * (.45 + fres * .5)) : day ? `rgba(70,90,200,${alphaBase * (.35 + fres * .4)})` : `rgba(215,228,255,${alphaBase * (.35 + fres * .55)})`;
      ctx.stroke();
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const day = !root.classList.contains("dark");
    smx += (mx - smx) * .04; smy += (my - smy) * .04;
    for (const c of cubes) drawCube(c, t, day);
  }

  let T = 0, last = performance.now();
  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!document.hidden && !still()) { T += dt; draw(T); }
    requestAnimationFrame(loop);
  }
  draw(0); requestAnimationFrame(loop);

})();

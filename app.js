/* =========================================================
   Security Career Portfolio — app logic
   You shouldn't need to edit this file; see data.js.
   ========================================================= */
(() => {
  "use strict";

  const DATA = window.PORTFOLIO || {};
  const profile = DATA.profile || {};
  const roles = (DATA.experience || []).slice().sort((a, b) => String(a.from).localeCompare(String(b.from)));
  const projects = DATA.projects || [];
  const certs = DATA.certifications || [];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- helpers ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (s) => {
    if (!s) return "";
    if (String(s).toLowerCase() === "present") return "Present";
    const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(s);
    if (!m) return s;
    const d = new Date(+m[1], +m[2] - 1, +(m[3] || 1));
    return d.toLocaleDateString("en-US", m[3] ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", year: "numeric" });
  };
  const yr = (s) => String(s).toLowerCase() === "present" ? "Now" : String(s || "").slice(0, 4);
  const ym = (s) => String(s || "").slice(0, 7);
  const byDateDesc = (a, b) => String(b.date || "").localeCompare(String(a.date || ""));
  // fade images in over their blurred placeholder once loaded (CSP-safe: no inline handlers)
  document.addEventListener("load", (e) => { if (e.target.tagName === "IMG") e.target.classList.add("ok"); }, true);
  const markLoaded = (root) => $$("img", root).forEach((im) => { if (im.complete && im.naturalWidth) im.classList.add("ok"); });
  const OPT = window.IMG_OPT || {};
  const optImg = (src) => { const o = OPT[src]; return o ? { src: o.webp, small: o.small, lqip: o.lqip, w: o.w, h: o.h } : { src, small: src, lqip: "" }; };
  const normImages = (imgs) => (imgs || []).map((i) => { const s = typeof i === "string" ? i : i.src; return { ...optImg(s), caption: (typeof i === "string" ? "" : i.caption) || "", pos: (typeof i === "string" ? "" : i.pos) || "" }; });
  const ICONS = ["shield", "lock", "key", "terminal", "network", "cloud", "eye", "bug"];
  const icon = (name, cls = "") => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true"><use href="#i-${ICONS.includes(name) ? name : "shield"}"/></svg>`;
  const gem = (cls = "gem") => `<svg class="${cls}" viewBox="0 0 64 80" aria-hidden="true"><use href="#crystal"/></svg>`;
  const TIERS = ["foundational", "associate", "professional", "expert"];
  const tierOf = (t) => (TIERS.includes(String(t).toLowerCase()) ? String(t).toLowerCase() : "foundational");
  const pending = (c) => String(c.status || "").toLowerCase().replace("-", " ") === "in progress";
  const isActive = (p) => String(p.status).toLowerCase() === "active";
  const store = {
    get(k, d) { try { const v = localStorage.getItem("chron." + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("chron." + k, JSON.stringify(v)); } catch { /* ignore */ } }
  };
  const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

  // card palettes [light, deep]; deep doubles as readable text color
  const CARD_PAL = [["#ff9a8b", "#d0283a"], ["#7fe3f4", "#2b6fe0"], ["#c3b2ff", "#6a3fd8"], ["#ffe08a", "#c76a00"], ["#8ff0c8", "#128a7e"], ["#f5a8e8", "#a8429e"]];
  const typeColors = {};
  [...new Set(projects.map((p) => p.type || "Project"))].forEach((t, i) => (typeColors[t] = CARD_PAL[i % CARD_PAL.length]));

  /* ---------- sound (original in-browser blips) ---------- */
  const Sound = {
    ctx: null, on: store.get("sound", false),
    ensure() {
      if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; this.ctx = new AC(); }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    tone(f, dur, when = 0, type = "triangle", vol = 0.07) {
      const c = this.ensure(); if (!c) return;
      const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.03);
    },
    play(n) {
      if (!this.on) return;
      if (n === "move") this.tone(1480, 0.045, 0, "triangle", 0.05);
      if (n === "select") { this.tone(988, 0.07); this.tone(1480, 0.12, 0.055); }
      if (n === "chime") { this.tone(2093, 0.18, 0, "sine", 0.035); this.tone(2637, 0.22, 0.05, "sine", 0.03); this.tone(3136, 0.3, 0.1, "sine", 0.022); }
      if (n === "chimeBig") [1568, 2093, 2637, 3136, 4186].forEach((f, i) => this.tone(f, 0.35, i * 0.05, "sine", 0.03));
      if (n === "back") { this.tone(740, 0.06); this.tone(494, 0.1, 0.05); }
      if (n === "open") [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.22, i * 0.06, "sine", 0.06));
      if (n === "start") [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, 0.5, i * 0.09, "sine", 0.05));
    },
    set(v, silent = false) {
      this.on = v; store.set("sound", v); document.body.classList.toggle("sound-on", v);
      if (v && !silent) { this.play("select"); Music.start(); }
      if (!v) Music.stop();
    }
  };
  /* ---------- ambient music box (original, generated in the browser) ---------- */
  const Music = {
    timer: null, master: null, step: 0, next: 0,
    // dreamy loop: Cmaj7 – Am7 – Fmaj7 – G
    CHORDS: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]],
    PATTERN: [0, 1, 2, 3, 2, 1, 2, 3],
    hz: (m) => 440 * Math.pow(2, (m - 69) / 12),
    note(c, t, f, vol, len) {
      const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o2.type = "triangle"; o.frequency.value = f; o2.frequency.value = f * 2;
      const g2 = c.createGain(); g2.gain.value = .18;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g); o2.connect(g2).connect(g); g.connect(this.master);
      o.start(t); o2.start(t); o.stop(t + len + .05); o2.stop(t + len + .05);
    },
    start() {
      if (this.timer || !Sound.on) return;
      const c = Sound.ensure(); if (!c) return;
      this.master = c.createGain(); this.master.gain.value = 0.0001;
      const delay = c.createDelay(), fb = c.createGain(), wet = c.createGain();
      delay.delayTime.value = .38; fb.gain.value = .32; wet.gain.value = .35;
      this.master.connect(c.destination); this.master.connect(delay); delay.connect(fb).connect(delay); delay.connect(wet).connect(c.destination);
      this.master.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 2.5);
      this.step = 0; this.next = c.currentTime + .2;
      const SPB = .34;
      this.timer = setInterval(() => {
        while (this.next < c.currentTime + .4) {
          const bar = Math.floor(this.step / 8) % 4, s = this.step % 8, ch = this.CHORDS[bar];
          this.note(c, this.next, this.hz(ch[this.PATTERN[s]] + 12), .5, 1.8);
          if (s === 0) this.note(c, this.next, this.hz(ch[0] - 12), .35, 2.6);
          this.next += SPB; this.step++;
        }
      }, 100);
    },
    stop() {
      if (!this.timer) return;
      clearInterval(this.timer); this.timer = null;
      const c = Sound.ctx, m = this.master;
      if (c && m) { m.gain.cancelScheduledValues(c.currentTime); m.gain.setValueAtTime(m.gain.value, c.currentTime); m.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + .8); setTimeout(() => m.disconnect(), 1000); }
    }
  };
  Sound.set(Sound.on, true);
  // browsers only allow audio after a click/key, so resume the music on the first interaction
  const firstGesture = () => { if (Sound.on) Music.start(); removeEventListener("pointerdown", firstGesture); removeEventListener("keydown", firstGesture); };
  addEventListener("pointerdown", firstGesture); addEventListener("keydown", firstGesture);

  /* replay the intro: forget that it was seen, go to the top and reload */
  window.__replayIntro = () => { try { localStorage.removeItem("chron.intro"); } catch { /* ignore */ } history.replaceState(null, "", location.pathname + location.search); scrollTo(0, 0); location.reload(); };
  document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("#intro-btn")) { e.preventDefault(); window.__replayIntro(); } });
  /* ---------- intro: the sentinel terminal analyses Brandon, then the portfolio decrypts ---------- */
  (() => {
    const intro = $("#intro"); if (!intro) return;
    const seen = (() => { try { return (localStorage.getItem("chron.intro") === "1" || /^#project\//.test(location.hash)); } catch { return false; } })();
    if (seen) { intro.remove(); document.body.classList.remove("intro-active"); return; }
    const calmNow = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("calm");
    const body = $("#term-body"), titleEl = $("#intro-title");
    const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>/\\=+{}[]?";
    const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
    const wait = (ms) => new Promise((r) => setTimeout(r, fast ? 0 : ms));
    let fast = calmNow, done = false, ready = false, typed = false;

    /* faint falling digits behind the terminal (like the banner) */
    const cv = $("#intro-bits"), cx = cv.getContext("2d"); let cols = [], raf = 0, lastT = 0;
    const size = () => { cv.width = innerWidth; cv.height = innerHeight; const n = Math.ceil(innerWidth / 26); cols = Array.from({ length: n }, () => ({ y: Math.random() * innerHeight, v: .4 + Math.random() * 1.1, s: Math.random() < .5 ? "0" : "1", hot: Math.random() < .12 })); };
    size(); addEventListener("resize", size);
    const bits = (t) => {
      raf = requestAnimationFrame(bits); if (t - lastT < 50) return; lastT = t;
      cx.fillStyle = "rgba(6,8,14,.22)"; cx.fillRect(0, 0, cv.width, cv.height);
      cx.font = "13px ui-monospace, Menlo, Consolas, monospace";
      cols.forEach((c, i) => {
        if (Math.random() < .03) c.s = ["0", "1", "10", "01", "1", "0"][(Math.random() * 6) | 0];
        cx.fillStyle = c.hot ? "rgba(122,168,255,.55)" : "rgba(90,110,160,.22)"; cx.fillText(c.s, i * 26 + 6, c.y);
        c.y += c.v * 6; if (c.y > cv.height + 20) { c.y = -20; c.hot = Math.random() < .12; }
      });
    };
    if (!calmNow) raf = requestAnimationFrame(bits);

    /* the terminal */
    const line = (cls = "") => { const d = document.createElement("div"); d.className = "tl " + cls; body.appendChild(d); return d; };
    const span = (parent, cls, text = "") => { const e = document.createElement("span"); if (cls) e.className = cls; e.textContent = text; parent.appendChild(e); return e; };
    const cursor = document.createElement("span"); cursor.className = "tcur";
    const typeInto = async (el, text, ms) => { for (const ch of text) { el.textContent += ch; if (!fast) await wait(ms * (.6 + Math.random() * .8)); } };
    const decrypt = async (el, text, ms = 190) => {
      if (fast) { el.textContent = text; return; }
      const t0 = performance.now();
      while (performance.now() - t0 < ms && !fast) {
        const k = (performance.now() - t0) / ms;
        el.textContent = [...text].map((c, i) => (c === " " || i / text.length < k ? c : glyph())).join("");
        await new Promise((r) => setTimeout(r, 30));
      }
      el.textContent = text;
    };
    const kv = async (key, val, cls = "v") => {
      const l = line(); span(l, "tk", key); const v = span(l, cls); l.appendChild(cursor);
      if (val) await decrypt(v, val); await wait(110); return v;
    };
    const run = async () => {
      const c = line(); span(c, "tp", "$ "); const cmd = span(c, "tc"); c.appendChild(cursor);
      await wait(350); await typeInto(cmd, "sentinel analyze ", 30); const str = span(c, "ts"); c.insertBefore(str, cursor); await typeInto(str, "\"Brandon Restrepo\"", 30);
      await wait(260);
      // a quick scan bar
      const sc = line("scan"); const bar = span(sc, "tb"); sc.appendChild(cursor);
      for (let i = 0; i <= 20 && !fast; i++) { bar.textContent = "analyzing [" + "█".repeat(i) + "░".repeat(20 - i) + "] " + i * 5 + "%"; await wait(24); }
      sc.remove();
      await kv("verdict:", "Hire");
      await kv("confidence:", "High");
      await kv("evidence:", "");
      const ev = line("ev"); span(ev, "td", "- "); ev.appendChild(cursor);
      const steps = ["Service Desk", "Head of IT", "Security Analyst"];
      for (let i = 0; i < steps.length; i++) {
        const st = span(ev, i === steps.length - 1 ? "v" : "tc"); ev.insertBefore(st, cursor); await decrypt(st, steps[i], 200);
        if (i < steps.length - 1) { const ar = span(ev, "ta", " → "); ev.insertBefore(ar, cursor); await wait(90); }
      }
      await wait(150);
      await kv("status:", "leveling up", "vb");
      await kv("blind_spots:", "none found", "vb");
      typed = true; intro.classList.add("typed");
      // the welcome line decrypts under the terminal
      const text = "Welcome to my portfolio";
      titleEl.innerHTML = [...text].map((ch) => (ch === " " ? '<span class="sp"> </span>' : `<span class="ch" data-c="${esc(ch)}">${esc(ch)}</span>`)).join("");
      const chs = $$(".ch", titleEl);
      if (!fast) {
        chs.forEach((e) => (e.textContent = glyph()));
        const t0 = performance.now();
        await new Promise((res) => { const tick = () => { const k = (performance.now() - t0) / 750; chs.forEach((e, i) => { e.textContent = (fast || k > i / chs.length + .15) ? e.dataset.c : glyph(); e.classList.toggle("set", e.textContent === e.dataset.c); }); if (k < 1.3 && !fast) setTimeout(tick, 35); else { chs.forEach((e) => { e.textContent = e.dataset.c; e.classList.add("set"); }); res(); } }; tick(); });
      } else chs.forEach((e) => e.classList.add("set"));
    };
    const finished = run();

    const artReady = new Promise((res) => { const P0 = DATA.profile || {}, src = (document.documentElement.classList.contains("dark") ? P0.artDark : P0.artLight) || P0.art; if (!src) return res(); const im = new Image(); im.onload = im.onerror = res; im.src = src; });
    const fontsReady = document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve();
    Promise.race([Promise.all([artReady, fontsReady, finished]), new Promise((res) => setTimeout(res, 12000))]).then(() => { ready = true; intro.classList.add("ready"); });

    let going = false;
    const enter = async (force) => {
      if (done || going) return;
      going = true; fast = true;                 // one press: finish the readout instantly and go
      if (force !== true) await finished;
      await Promise.race([artReady, new Promise((r) => setTimeout(r, 1500))]);   // never reveal a page whose art is still loading
      done = true;
      try { localStorage.setItem("chron.intro", "1"); } catch { /* ignore */ }
      const l = line("ok"); span(l, "tp", "$ "); span(l, "tc", "./portfolio --open  "); span(l, "tok", "[ access granted ✓ ]");
      Sound.play("start");
      const reveal = () => { document.body.classList.remove("intro-active"); };
      if (calmNow) { reveal(); intro.remove(); cancelAnimationFrame(raf); return; }
      // 1 · fall into the terminal  2 · BAM: a flash, and the portfolio is there, the name slamming down
      setTimeout(() => intro.classList.add("diving"), 220);
      setTimeout(() => { intro.classList.add("bam"); reveal(); }, 700);
      setTimeout(() => { cancelAnimationFrame(raf); intro.remove(); }, 1250);
    };
    intro.addEventListener("click", () => enter());
    document.addEventListener("keydown", (e) => { if (!done && (e.key === "Enter" || e.key === " " || e.key === "Escape")) { e.preventDefault(); enter(e.key === "Escape"); } });
    intro.focus({ preventScroll: true });
  })();
  $("#sound-btn").addEventListener("click", () => Sound.set(!Sound.on));

  /* ---------- hero art ---------- */
  // stars and shards rising diagonally, in three depth layers with mouse parallax
  // tiny glass shards that tumble and catch the light, and soft twinkling stars
  const LAYERS = { far: { n: 16, size: .8, speed: 1.6, blur: .3, op: .75 }, mid: { n: 12, size: 1.15, speed: 1, blur: 0, op: .95 }, near: { n: 5, size: 1.6, speed: .7, blur: 0, op: 1 } };
  Object.entries(LAYERS).forEach(([name, L]) => {
    const host = $(`#shards .${name}`);
    for (let i = 0; i < L.n; i++) {
      const s = document.createElement("span");
      const glass = Math.random() < 0.45;
      const w = (glass ? 14 + Math.random() * 11 : 20 + Math.random() * 17) * L.size;
      const dur = (26 + Math.random() * 16) * L.speed;
      s.className = "rise " + (glass ? "glass" : "star") + (!glass && Math.random() < 0.2 ? " gold" : "");
      s.innerHTML = glass ? `<svg><use href="#glass-${1 + Math.floor(Math.random() * 3)}"/></svg>` : '<svg><use href="#star-soft"/></svg>';
      s.style.cssText = `--x:${(-30 + Math.random() * 120).toFixed(1)}%;--w:${w.toFixed(1)}px;--h:${w.toFixed(1)}px;` +
        `--d:${dur.toFixed(1)}s;--delay:${(-Math.random() * dur).toFixed(1)}s;--dx:${(18 + Math.random() * 20).toFixed(0)}vw;` +
        `--spin:${(Math.random() * 360).toFixed(0)}deg;--tw:${(1.6 + Math.random() * 2.4).toFixed(2)}s;--tb:${(5 + Math.random() * 6).toFixed(1)}s;--blur:${L.blur}px;--op:${L.op}`;
      host.appendChild(s);
    }
  });
  // sparse rising shards behind the rest of the page
  (() => {
    const host = $("#page-shards"); if (!host) return;
    for (let i = 0; i < 22; i++) {
      const s = document.createElement("span"); const star = Math.random() < .5;
      s.className = "rise" + (star ? " star" : "");
      s.innerHTML = star ? '<svg class="rise-g"><use href="#star-soft"/></svg>' : '<svg class="rise-g"><use href="#glass-2"/></svg>';
      const w = star ? 8 + Math.random() * 10 : 7 + Math.random() * 7;
      s.style.cssText = `--x:${(-40 + Math.random() * 120).toFixed(1)}%;--w:${w.toFixed(0)}px;--h:${(star ? w : w * 2.5).toFixed(0)}px;--d:${(20 + Math.random() * 18).toFixed(1)}s;--delay:${(-Math.random() * 38).toFixed(1)}s;--dx:${(40 + Math.random() * 30).toFixed(0)}vw;--spin:${(star ? Math.random() * 180 : 34 + Math.random() * 16).toFixed(0)}deg;--tw:${(1.2 + Math.random() * 1.8).toFixed(2)}s;--op:.55;--blur:${Math.random() < .4 ? 1.2 : 0}px`;
      host.appendChild(s);
    }
  })();
  // mouse parallax: layers, beams, clouds and the art shift by depth
  (() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || matchMedia("(pointer: coarse)").matches) return;
    const els = [...$$("#shards .layer"), $(".beams"), $(".clouds"), $("#art-wrap")].filter(Boolean);
    const depth = (el) => +(el.dataset.depth || (el.classList.contains("beams") ? 4 : el.classList.contains("clouds") ? 10 : 8));
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const tick = () => {
      cx += (tx - cx) * .06; cy += (ty - cy) * .06;
      els.forEach((el) => { const d = depth(el); el.style.translate = `${(cx * d).toFixed(2)}px ${(cy * d * .6).toFixed(2)}px`; });
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > .001 ? requestAnimationFrame(tick) : 0;
    };
    addEventListener("mousemove", (e) => {
      if (window.scrollY > innerHeight) return;
      tx = (e.clientX / innerWidth - .5) * -1; ty = (e.clientY / innerHeight - .5) * -1;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  })();
  /* compatibility: mark the body while any overlay is open (fallback for browsers without CSS :has()) */
  (() => {
    const ids = ["#modal", "#lightbox", "#quick", "#secnote", ".qol-overlay"];
    const els = ids.flatMap((q) => [...document.querySelectorAll(q)]);
    const sync = () => document.body.classList.toggle("overlay-open", els.some((e) => !e.hidden));
    els.forEach((e) => new MutationObserver(sync).observe(e, { attributes: true, attributeFilter: ["hidden"] }));
  })();
  /* ---------- profile ---------- */
  const name = profile.name || "Your Name";
  const cls = profile.className || "Security Analyst";
  const tagline = profile.tagline || "Chronicle of a Security Career";
  document.title = `${name} · ${cls}`;
  $("#brand-name").textContent = name;
    $("#lockup-pre").textContent = cls;
  const cta = profile.cta || {}, ctaEl = $("#cta");
  if (cta.url) {
    ctaEl.href = cta.url; $("#cta-label").textContent = cta.label || "Contact";
    if (/^https?:/.test(cta.url)) { ctaEl.target = "_blank"; ctaEl.rel = "noopener"; }
  } else ctaEl.remove();
  // résumé and links
  const setLink = (sel, url) => { const a = $(sel); if (!a) return; if (url) a.href = url; else a.remove(); };
  setLink("#resume-btn", profile.resume);
  setLink("#linkedin-btn", profile.links && profile.links.linkedin);
  setLink("#github-btn", profile.links && profile.links.github);
  if (profile.art) {
    // the title-screen art has its rim light + colour grade baked in, one version per theme
    const heroArt = $("#hero-art"), artFor = () => (document.documentElement.classList.contains("dark") ? profile.artDark : profile.artLight) || profile.art;
    heroArt.src = artFor();
    addEventListener("load", () => setTimeout(() => { const o = new Image(); o.src = document.documentElement.classList.contains("dark") ? profile.artLight : profile.artDark; }, 3000), { once: true }); // warm the other theme's version
    new MutationObserver(() => { const s = artFor(); if (!heroArt.src.endsWith(s)) heroArt.src = s; }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  }
  else $("#art-wrap").remove();

  /* ---------- line up "Security Analyst" with the left edge of RESTREPO ---------- */
  (() => {
    const pre = $(".lockup-pre"), lockup = $(".lockup");
    const align = () => {
      const ltrs = $$(".name-logo .ltr"); if (!ltrs.length) return;
      const path = (ltrs[7] || ltrs[0]).querySelector(".l-fill");   // "R" of RESTREPO (BRANDON = 0-6)
      const svg = path.ownerSVGElement, bb = path.getBBox(), m = svg.getScreenCTM();
      if (!m) return;
      const p = svg.createSVGPoint(); p.x = bb.x; p.y = bb.y + bb.height; // bottom-left of the letter (slanted foot)
      const x = p.matrixTransform(m).x - lockup.getBoundingClientRect().left;
      pre.style.setProperty("--pre-left", Math.max(0, x).toFixed(0) + "px");
    };
    addEventListener("load", align); addEventListener("resize", align); setTimeout(align, 50);
  })();

  /* ---------- name: twinkling stars on hover ---------- */
  (() => {
    const logoEl = $("#logo"); let timer = null;
    const twinkle = (n) => {
      const r = logoEl.getBoundingClientRect();
      for (let i = 0; i < n; i++) {
        const s = document.createElement("span"); s.className = "twink" + (Math.random() < 0.25 ? " gold" : "");
        s.innerHTML = '<svg viewBox="0 0 20 20"><use href="#shard-c"/></svg>';
        s.style.setProperty("--x", (Math.random() * r.width).toFixed(0) + "px");
        s.style.setProperty("--y", (Math.random() * r.height).toFixed(0) + "px");
        s.style.setProperty("--w", (10 + Math.random() * 16).toFixed(0) + "px");
        s.style.setProperty("--d", (Math.random() * 0.5).toFixed(2) + "s");
        logoEl.appendChild(s); setTimeout(() => s.remove(), 1700);
      }
    };
    const start = () => {
      if (timer) return;
      twinkle(9); Sound.play("open");
      timer = setInterval(() => twinkle(3), 380);
    };
    const stop = () => { clearInterval(timer); timer = null; };
    logoEl.addEventListener("mouseenter", start);
    logoEl.addEventListener("mouseleave", stop);
    logoEl.addEventListener("click", () => { twinkle(10); Sound.play("open"); });
  })();

  /* ---------- fairy-light cursor: a glowing orb that flies after the mouse ---------- */
  (() => {
    const fairy = $("#fairy"), dot = $("#fairy-dot"); if (!fairy) return;
    const canFairy = matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    let enabled = canFairy && store.get("fairy", false);
    const ft = $("#fairy-toggle");
    const apply = () => {
      document.documentElement.classList.toggle("fairy-on", enabled);
      if (!enabled) { fairy.classList.remove("show"); dot.classList.remove("show"); }
      if ($("#fairy-state")) $("#fairy-state").textContent = enabled ? "On" : "Off";
    };
    if (ft) { if (!canFairy) ft.remove(); else ft.addEventListener("click", () => { enabled = !enabled; store.set("fairy", enabled); apply(); Sound.play("select"); }); }
    apply();
    if (!canFairy) return;
    const root = document.documentElement;
    let mx = innerWidth / 2, my = innerHeight / 2, fx = mx, fy = my, vx = 0, vy = 0, shown = false;
    let lastMove = performance.now(), mode = "follow", target = null, targetAt = 0, orbit = 0;
    /* light-ribbon trail */
    const cv = document.createElement("canvas"); cv.className = "fairy-trail"; cv.setAttribute("aria-hidden", "true"); document.body.appendChild(cv);
    const cx = cv.getContext("2d"); let dpr = 1;
    const fitCv = () => { dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    fitCv(); addEventListener("resize", fitCv, { passive: true });
    const trail = [];
    /* hint bubble */
    const say = document.createElement("span"); say.className = "fairy-say"; say.setAttribute("aria-hidden", "true"); document.body.appendChild(say);
    let sayT; const speak = (txt, ms = 2400) => { say.textContent = txt; say.classList.add("on"); clearTimeout(sayT); sayT = setTimeout(() => say.classList.remove("on"), ms); };
    /* section color */
    // same colours as the background nebula: blue → crimson (projects) → violet
    const COL = { top: "110,160,255", experience: "110,160,255", projects: "255,92,120", certifications: "175,120,255", footer: "175,120,255" };
    let secTops = [];
    const measureSecs = () => { secTops = [["experience", "#experience"], ["projects", "#projects"], ["certifications", "#certifications"], ["footer", ".footer"]].map(([k, sel]) => { const el = $(sel); return el ? [k, el.getBoundingClientRect().top + scrollY] : null; }).filter(Boolean); };
    const secColor = () => {
      const mid = scrollY + innerHeight / 2; let c = COL.top;
      secTops.forEach(([k, top]) => { if (top < mid) c = COL[k]; });
      if (c !== cur) { fairy.style.setProperty("--fc", c); dot.style.setProperty("--fc", c); cur = c; }
    };
    let cur = ""; measureSecs(); addEventListener("resize", measureSecs, { passive: true }); addEventListener("load", measureSecs);
    new ResizeObserver(measureSecs).observe(document.body);
    addEventListener("scroll", secColor, { passive: true }); secColor();
    /* what the pointer is over */
    const MOODS = [
      ["excited", "#shinx-peek, .hot[data-hot=shinx], .hot[data-hot=cutiefly], .cutie"],
      ["gold", "#cta, #resume-btn, #credits-contact, #mi-resume, #mi-contact, .btn-cta, #rv-dl"],
      ["pulse", ".pcard, .feat-card, .cgrid-card, .exp-role, .menu-bar"],
      ["hot", "a, button, .art-layer, .filter, .thumb, [role=option], .chip-link"],
      ["quiet", "p, li, .highlights, .pc-about, .role-summary, .credits-pitch, .feat-sum, .pc-sum, h1, h2, h3, input"]
    ];
    let mood = "";
    const setMood = (el) => {
      let m = ""; if (el && el.closest) for (const [k, sel] of MOODS) { if (el.closest(sel)) { m = k; break; } }
      if (m !== mood) { fairy.classList.remove("hot", "gold", "pulse", "excited", "quiet"); if (m) fairy.classList.add(m); mood = m; }
    };
    addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (!enabled) return;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      if (!shown) { shown = true; fx = mx + 14; fy = my - 16; fairy.classList.add("show"); dot.classList.add("show"); }
      lastMove = performance.now();
      if (mode !== "follow" && mode !== "hint") { mode = "follow"; target = null; fairy.classList.add("zip"); setTimeout(() => fairy.classList.remove("zip"), 400); }
    }, { passive: true });
    document.addEventListener("mouseleave", () => { shown = false; fairy.classList.remove("show"); dot.classList.remove("show"); });
    /* 1. a digital fairy: wireframe wings with scanlines, a pixel core, and the odd RGB glitch */
    const W = { ul: "M-2 -2 L-9 -17 L-17 -21 L-24 -16 L-22 -8 L-12 -3Z", ll: "M-2 1 L-10 5 L-15 12 L-12 16 L-6 13Z" };
    const mir = (d) => d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (m, x, y) => `${-parseFloat(x)} ${y}`);
    const wings = (cls) => `<g class="fy-wings ${cls}">
        <g class="fy-w fy-ul"><path d="${W.ul}"/><path class="fy-scan" d="${W.ul}"/><path class="fy-rib" d="M-2 -2 L-17 -21 M-6 -3 L-22 -12"/></g>
        <g class="fy-w fy-ur"><path d="${mir(W.ul)}"/><path class="fy-scan" d="${mir(W.ul)}"/><path class="fy-rib" d="M2 -2 L17 -21 M6 -3 L22 -12"/></g>
        <g class="fy-w fy-ll"><path d="${W.ll}"/><path class="fy-scan" d="${W.ll}"/></g>
        <g class="fy-w fy-lr"><path d="${mir(W.ll)}"/><path class="fy-scan" d="${mir(W.ll)}"/></g></g>`;
    fairy.innerHTML = `<svg class="fy fy-digi" viewBox="-30 -30 60 60" aria-hidden="true">
      <defs><pattern id="fyScanP" width="3" height="2" patternUnits="userSpaceOnUse"><rect width="3" height=".8" fill="#fff"/></pattern></defs>
      ${wings("fy-ghost fy-gr")}${wings("fy-ghost fy-gb")}${wings("")}
      <circle class="fy-halo" r="10"/>
      <rect class="fy-body" x="-4" y="-4" width="8" height="8" transform="rotate(45)"/>
      <rect class="fy-spark" x="-1.5" y="-1.5" width="3" height="3"/>
      <g class="fy-px"><rect x="-1" y="7" width="2" height="2"/><rect x="-1" y="11" width="2" height="2"/><rect x="-1" y="15" width="1.6" height="1.6"/></g></svg>`;
    const star = (x, y, cls, extra = "") => { const s = document.createElement("span"); s.className = cls; s.style.cssText = `left:${x}px;top:${y}px;` + extra; document.body.appendChild(s); return s; };
    const burst = (x, y, n, dmin, dmax, life) => {
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.random() * .35, d = dmin + Math.random() * (dmax - dmin);
        const s = star(x, y, "fstar", `--bx:${(Math.cos(a) * d).toFixed(0)}px;--by:${(Math.sin(a) * d).toFixed(0)}px;--c:255,255,255;animation-duration:${life}ms`); setTimeout(() => s.remove(), life + 40); }
    };
    /* 6. charge-up: hold to glow brighter, release for a bigger burst */
    let downAt = 0, chargeT;
    addEventListener("mousedown", (e) => {
      if (!enabled || e.button !== 0) return;
      downAt = performance.now(); clearTimeout(chargeT);
      chargeT = setTimeout(() => fairy.classList.add("charging"), 180);
    });
    addEventListener("mouseup", (e) => {
      if (!enabled || !downAt) return;
      const held = performance.now() - downAt; downAt = 0; clearTimeout(chargeT);
      const big = held > 450; fairy.classList.remove("charging");
      fairy.classList.remove("tap"); void fairy.offsetWidth; fairy.classList.add("tap");
      /* 5. crisper click: ring + stars + chime */
      const ring = star(e.clientX, e.clientY, "fring2" + (big ? " big" : "")); setTimeout(() => ring.remove(), 700);
      burst(e.clientX, e.clientY, big ? 16 : 8, big ? 40 : 22, big ? 95 : 44, big ? 900 : 620);
      Sound.play(big ? "chimeBig" : "chime");
      $$(".sb-p.s, .cst-dot, .sb-far i").map((el) => [el, el.getBoundingClientRect()]).forEach(([el, b]) => {   // read every rect first, then write (no layout thrash)
        if (b.bottom < 0 || b.top > innerHeight) return;
        const dd = Math.hypot(b.left + b.width / 2 - e.clientX, b.top + b.height / 2 - e.clientY);
        if (dd < (big ? 340 : 200)) { el.style.setProperty("--pd", (dd * 1.5).toFixed(0) + "ms"); el.classList.remove("pulse"); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("pulse"))); setTimeout(() => el.classList.remove("pulse"), 1300); }
      });
    });
    /* 4. tiny sparkle when the cursor moves onto something clickable */
    let lastHot = null;
    document.addEventListener("mouseover", (e) => {
      if (!enabled || document.body.classList.contains("jumping")) return;
      const h = e.target.closest && e.target.closest("a, button, .pcard, .feat-card, .cgrid-card, .exp-role, .menu-bar, .filter, .chip-link, .thumb, [role=option]");
      if (h && h !== lastHot) { for (let i = 0; i < 3; i++) { const s = star(fx + (Math.random() - .5) * 22, fy + (Math.random() - .5) * 22, "fpop"); s.style.animationDelay = i * 60 + "ms"; setTimeout(() => s.remove(), 700); } }
      lastHot = h;
    }, { passive: true });
    /* when you stop moving, it goes exploring */
    const visibleTargets = () => {
      const pool = [...$$(".cst-dot"), ...$$(".isle .led"), ...$$("#shinx-peek img"), ...$$(".hero-art"), ...$$(".tail-star")];
      return pool.filter((el) => { const r = el.getBoundingClientRect(); if (!r.width || r.top < 90 || r.bottom > innerHeight - 60 || r.left < 60 || r.right > innerWidth - 60) return false;
        return Math.hypot(r.left + r.width / 2 - mx, r.top + r.height / 2 - my) < 280; });
    };
    const pickTarget = () => {
      const t = visibleTargets(); if (!t.length) return null;
      const el = t[(Math.random() * t.length) | 0]; if (el.classList.contains("hero-art")) { const r = el.getBoundingClientRect(); return { x: r.left + r.width * (.3 + Math.random() * .4), y: r.top + r.height * (.2 + Math.random() * .3), el: null }; }
      return { el };
    };
    const targetPos = () => { if (!target) return [mx, my]; if (!target.el) return [target.x, target.y]; const r = target.el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
    /* one-time hints */
    const hintOnce = (key, sel, text) => {
      if (store.get("fhint." + key, false)) return false;
      const el = $(sel); if (!el) return false; const r = el.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) return false;
      store.set("fhint." + key, true); speak(text, 3200); return true;
    };
    const tryHints = () => { if (!enabled || !shown || mode === "hint") return; hintOnce("menu", "#more-btn", "Résumé & settings live here ✦") || hintOnce("term", "#term-link", "Psst… try the terminal ~"); };
    setInterval(tryHints, 2500);
    /* animation */
    let dustT = 0, dustN = 0, dirty = [0, 0, innerWidth, innerHeight], trailOff = false;
    const loop = (t) => {
      requestAnimationFrame(loop);
      if (!enabled || !shown || document.hidden) { if (trail.length) { trail.length = 0; cx.clearRect(0, 0, innerWidth, innerHeight); } return; }
      if (false) { target = pickTarget(); if (target) { mode = "explore"; targetAt = t; } else lastMove = t; }
      if (false) { target = pickTarget() || target; targetAt = t; }
      let tx, ty, k = .16, damp = .72;
      if (mode === "follow") {
        const off = 12;
        tx = mx + off + Math.sin(t / 420) * 5; ty = my - off - 2 + Math.sin(t / 260) * 4;
        if (fairy.classList.contains("zip")) { k = .22; damp = .7; }
      } else {
        const [px, py] = targetPos(); orbit += .045;
        const r = mode === "hint" ? 26 : 18 + Math.sin(t / 700) * 6;
        tx = px + Math.cos(orbit) * r; ty = py - 6 + Math.sin(orbit) * r * .6; k = .04; damp = .86;
        say.style.transform = `translate(${(px + 18).toFixed(0)}px, ${(py + 22).toFixed(0)}px)`;
      }
      vx = (vx + (tx - fx) * k) * damp; vy = (vy + (ty - fy) * k) * damp;
      fx = Math.max(16, Math.min(innerWidth - 16, fx + vx)); fy = Math.max(16, Math.min(innerHeight - 16, fy + vy));
      if (say.classList.contains("on")) say.style.transform = `translate(${Math.min(innerWidth - 230, fx + 16).toFixed(0)}px, ${(fy + 16).toFixed(0)}px)`;
      const tilt = Math.max(-25, Math.min(25, vx * 2.2)), spin = 0;
      fairy.style.transform = `translate(${fx.toFixed(1)}px, ${fy.toFixed(1)}px) rotate(${(tilt + spin).toFixed(1)}deg)`;
      const sp = Math.abs(vx) + Math.abs(vy);
      const flap = sp > 6 ? "fast" : sp > 1.2 ? "mid" : "glide";
      if (fairy.dataset.flap !== flap) fairy.dataset.flap = flap;
      if (t - dustT > (sp > 2 ? 140 : 900) && dustN < 14 && !document.body.classList.contains("jumping")) {
        dustT = t; dustN++; const s = star(fx + (Math.random() - .5) * 8, fy + 6, "fdust2", `--dx:${((Math.random() - .5) * 18).toFixed(0)}px`); s.textContent = Math.random() < .5 ? "0" : "1"; setTimeout(() => { s.remove(); dustN--; }, 1400);
      }
      // ribbon trail: longer when moving fast. Only repaint when it changes (a still fairy costs nothing),
      // and step aside while the page glides to a section (the cursor isn't moving then anyway).
      const gliding = document.body.classList.contains("jumping");
      if (gliding !== trailOff) { trailOff = gliding; cv.style.visibility = gliding ? "hidden" : ""; }
      if (gliding) return;
      const lp = trail[trail.length - 1]; let changed = false;
      if (!lp || Math.abs(lp[0] - fx) + Math.abs(lp[1] - fy) > .4) { trail.push([fx, fy, t, Math.random() < .5 ? "0" : "1", (Math.random() - .5) * 6]); changed = true; }
      const life = 260 + Math.min(420, (Math.abs(vx) + Math.abs(vy)) * 40);
      while (trail.length && t - trail[0][2] > life) { trail.shift(); changed = true; }
      if (!changed) return;
      if (dirty) cx.clearRect(dirty[0], dirty[1], dirty[2] - dirty[0], dirty[3] - dirty[1]);
      dirty = null;
      if (trail.length > 2) {
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; trail.forEach(([px, py]) => { if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; });
        dirty = [x0 - 14, y0 - 14, x1 + 14, y1 + 14];
        // a data stream: pixels that shrink and fade, with a 0/1 dropped every few steps
        cx.font = "600 9px ui-monospace,Menlo,Consolas,monospace"; cx.textAlign = "center"; cx.textBaseline = "middle";
        let acc = 0;
        for (let i = 1; i < trail.length; i++) {
          const a = i / trail.length, [px, py, , bit, j] = trail[i];
          acc += Math.abs(px - trail[i - 1][0]) + Math.abs(py - trail[i - 1][1]);
          if (acc < 5) continue; acc = 0;
          const sz = Math.round(1 + a * 3);
          cx.fillStyle = `rgba(${cur},${(a * .85).toFixed(3)})`; cx.fillRect(Math.round(px - sz / 2), Math.round(py - sz / 2), sz, sz);
          if (i % 3 === 0) { cx.fillStyle = `rgba(255,255,255,${(a * .75).toFixed(3)})`; cx.fillText(bit, px + j, py + j * .6); }
        }
      }
    };
    requestAnimationFrame(loop);
    if (enabled) setTimeout(tryHints, 1500);
  })();

  /* ---------- interactive artwork ---------- */
  (() => {
    const wrap = $("#art-wrap"), stage = $("#art-stage"), img = $("#hero-art"), layer = $("#art-layer");
    if (!wrap || !img) return;
    const touch = matchMedia("(pointer: coarse)").matches;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Cutiefly layer
    const cutie = $("#cutie");
    if (profile.cutiefly) cutie.src = profile.cutiefly; else cutie.remove();
    $("#bubble").textContent = profile.greeting || "Hey! 👋";
    $("#bubble-girl").textContent = profile.greetingGirl || "Hire him!";
    layer.style.setProperty("--art", `url("${profile.art}")`);
    // keep the overlay exactly on top of the drawn image (object-fit: contain, anchored bottom)
    const fit = () => {
      if (!img.naturalWidth) return;
      const bw = img.offsetWidth, bh = img.offsetHeight, r = img.naturalWidth / img.naturalHeight;
      let w = bw, hh = bw / r; if (hh > bh) { hh = bh; w = bh * r; }
      const box = { left: img.offsetLeft + (bw - w) / 2 + "px", top: img.offsetTop + (bh - hh) + "px", width: w + "px", height: hh + "px" };
      Object.assign(layer.style, box);
      const gl = $("#art-glow"), P = .14; // soft bloom image, padded 14% each side
      if (gl) Object.assign(gl.style, { left: parseFloat(box.left) - w * P + "px", top: parseFloat(box.top) - hh * P + "px", width: w * (1 + 2 * P) + "px", height: hh * (1 + 2 * P) + "px" });
    };
    // on wide screens the name is centred but the art hugs the right edge, so the name used to cover Chimchar (and his hover).
    // Slide the art right just enough to clear him, as far as the room on the right allows.
    const unblock = () => {
      // (translate is taken by the mouse parallax, so the shift lives in margin). Measure from the unshifted spot with
      // transitions off, then glide from wherever it was to the new spot.
      const old = wrap.style.getPropertyValue("margin-right");
      wrap.style.transition = "none"; wrap.style.removeProperty("margin-right");
      let s = 0;
      if (getComputedStyle(wrap).position === "absolute") {
        const lk = $(".hero .lockup"), hot = $('.hot[data-hot="chimchar"]');
        if (lk && hot) { const n = lk.getBoundingClientRect(), h = hot.getBoundingClientRect(), L = layer.getBoundingClientRect();
          s = Math.max(0, Math.min(n.right - 24 - h.left, innerWidth - 12 - L.right)); }
      }
      const val = s > 1 ? `${-Math.round(s)}px` : "";
      if (old) wrap.style.setProperty("margin-right", old, "important");
      void wrap.offsetWidth; wrap.style.transition = "";
      if (val) wrap.style.setProperty("margin-right", val, "important"); else wrap.style.removeProperty("margin-right");
    };
    const refit = () => { fit(); unblock(); };
    img.complete ? refit() : img.addEventListener("load", refit);
    // re-measure whenever the hero's layout settles (fonts, scrollbar appearing after the intro, window resizes), so the art never jumps late
    const soon = () => { clearTimeout(refit.t); refit.t = setTimeout(refit, 90); };
    addEventListener("resize", soon); new ResizeObserver(soon).observe(wrap); setTimeout(refit, 1300);
    document.fonts?.ready.then(soon);
    new MutationObserver(() => { if (!document.body.classList.contains("intro-active")) refit(); }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

    // hotspots: [left, top, width, height] in % of the drawing
    const HOT = { boy: [21, 2, 27, 34], chimchar: [7, 13, 21, 41], shinx: [66, 54, 22, 41], cutiefly: [75, 12, 15, 16], girl: [53, 5, 16, 22], tail: [42, 18, 13, 20], chimhead: [26, 15, 6, 20], chimhand: [25, 33, 8, 10] };   // Chimchar = body + head edge + hand on the shoulder + tail: all light the flame
    $$(".hot", layer).forEach((el) => { const [l, t, w, hh] = HOT[el.dataset.hot]; Object.assign(el.style, { left: l + "%", top: t + "%", width: w + "%", height: hh + "%" }); });
    let sparkTimer = null;
    const shinxSparks = () => {
      for (let i = 0; i < 4; i++) {
        const s = document.createElement("span"); s.className = "zap";
        const a = -Math.PI / 2 + (Math.random() - .5) * 2.6, dist = 30 + Math.random() * 55;
        s.style.cssText = `left:81%;top:94.6%;--bx:${(Math.cos(a) * dist).toFixed(0)}px;--by:${(Math.sin(a) * dist).toFixed(0)}px`;
        layer.appendChild(s); setTimeout(() => s.remove(), 800);
      }
    };
    const enterHot = (name) => {
      layer.classList.add("h-" + name);
      if (name === "shinx") { shinxSparks(); sparkTimer = setInterval(shinxSparks, 450); }
      Sound.play("move");
    };
    const leaveHot = (name) => { layer.classList.remove("h-" + name); if (name === "shinx") { clearInterval(sparkTimer); sparkTimer = null; } };
    $$(".hot", layer).forEach((el) => {
      const n = el.dataset.as || el.dataset.hot;
      el.addEventListener("mouseenter", () => enterHot(n));
      el.addEventListener("mouseleave", () => leaveHot(n));
      if (touch) el.addEventListener("click", () => { enterHot(n); setTimeout(() => leaveHot(n), 1600); });
    });

    // lift + glow, 3D tilt, sheen, sparkle trail
    let lastTrail = 0;
    layer.addEventListener("mouseenter", () => wrap.classList.add("hover"));
    layer.addEventListener("mouseleave", () => { wrap.classList.remove("hover"); stage.style.setProperty("--rx", "0deg"); stage.style.setProperty("--ry", "0deg"); });
    layer.addEventListener("mousemove", (e) => {
      const r = layer.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      if (!calm) { stage.style.setProperty("--ry", ((px - .5) * 8).toFixed(2) + "deg"); stage.style.setProperty("--rx", ((.5 - py) * 6).toFixed(2) + "deg"); }
      layer.style.setProperty("--sx", (px * 100).toFixed(1) + "%");
      const now = performance.now();
      if (now - lastTrail > 70) {
        lastTrail = now;
        const s = document.createElement("span"); s.className = "twink" + (Math.random() < .25 ? " gold" : "");
        s.innerHTML = '<svg viewBox="0 0 20 20"><use href="#shard-c"/></svg>';
        s.style.setProperty("--x", (px * 100 + (Math.random() - .5) * 4).toFixed(1) + "%");
        s.style.setProperty("--y", (py * 100 + (Math.random() - .5) * 4).toFixed(1) + "%");
        s.style.setProperty("--w", (8 + Math.random() * 12).toFixed(0) + "px"); s.style.setProperty("--d", "0s");
        layer.appendChild(s); setTimeout(() => s.remove(), 1300);
      }
    });

    // memory card on click
    const card = $("#memory-card"), mem = profile.memory || {};
    $("#mem-title").textContent = mem.title || "Memory";
    if (mem.heart) $("#mem-title").insertAdjacentHTML("beforeend", ' <svg class="mem-heart" viewBox="0 0 24 22" aria-hidden="true"><path d="M12 21 C5 15.6 1.2 12 1.2 7.2 C1.2 3.9 3.8 1.4 7 1.4 C9 1.4 10.9 2.5 12 4.2 C13.1 2.5 15 1.4 17 1.4 C20.2 1.4 22.8 3.9 22.8 7.2 C22.8 12 19 15.6 12 21 Z"/></svg>');
    $("#mem-text").textContent = mem.text || "";
    if (!mem.text) $("#mem-text").hidden = true;
    const mp = $("#mem-photo");
    if (mp && mem.photo) { mp.alt = mem.title || "Memory"; mp.hidden = false; card.classList.add("has-photo"); }
    const closeCard = () => { if (!card.hidden) { card.hidden = true; Sound.play("back"); } };
    layer.addEventListener("click", (e) => {
      if (!mem.text && !mem.photo) return;
      e.stopPropagation();
      if (mp && mem.photo && !mp.src) mp.src = mem.photo;   // load the photo on first open
      layer.classList.remove("flash"); void layer.offsetWidth; layer.classList.add("flash");
      card.hidden = false; Sound.play("open");
    });
    $("#mem-close").addEventListener("click", (e) => { e.stopPropagation(); closeCard(); });
    card.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", closeCard);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCard(); });
  })();

  /* ---------- title-screen extras ---------- */
  (() => {
    // 1. time-of-day sky
    const hr = new Date().getHours();
    const phase = hr >= 5 && hr < 8 ? "dawn" : hr >= 8 && hr < 17 ? "day" : hr >= 17 && hr < 20 ? "dusk" : "night";
    document.body.dataset.sky = phase;
    if (phase === "night") {
      const host = $(".night-stars");
      for (let i = 0; i < 70; i++) {
        const s = document.createElement("i");
        s.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 70).toFixed(1)}%;--s:${(1 + Math.random() * 2).toFixed(1)}px;--t:${(1.5 + Math.random() * 3).toFixed(1)}s;--d:${(-Math.random() * 4).toFixed(1)}s`;
        host.appendChild(s);
      }
    }

    // 3. letter glints on the name
    const ltrs = $$(".name-logo .ltr");
    if (ltrs.length && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInterval(() => {
        if (document.hidden || scrollY > innerHeight) return;
        const l = ltrs[Math.floor(Math.random() * ltrs.length)];
        l.classList.remove("glint"); void l.getBBox(); l.classList.add("glint");
        setTimeout(() => l.classList.remove("glint"), 900);
      }, 2300);
    }

    // 5. secret code → bonus memory
    const CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let pos = 0;
    const bonus = $("#bonus"), bd = profile.bonus || {};
    $("#bonus-title").textContent = bd.title || "Bonus Memory";
    $("#bonus-text").textContent = bd.text || "You found the secret!";
    const celebrate = () => {
      Sound.play("start");
      for (let i = 0; i < 40; i++) {
        const s = document.createElement("span"); s.className = "confetti" + (Math.random() < .3 ? " gold" : "");
        s.innerHTML = '<svg viewBox="0 0 20 20"><use href="#shard-c"/></svg>';
        const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 380;
        s.style.cssText = `--bx:${(Math.cos(a) * d).toFixed(0)}px;--by:${(Math.sin(a) * d).toFixed(0)}px;--w:${(10 + Math.random() * 18).toFixed(0)}px;--dl:${(Math.random() * .25).toFixed(2)}s`;
        document.body.appendChild(s); setTimeout(() => s.remove(), 1800);
      }
      const c = $("#cutie"); if (c) { c.classList.remove("zoom"); void c.offsetWidth; c.classList.add("zoom"); setTimeout(() => c.classList.remove("zoom"), 2600); }
      setTimeout(() => { bonus.hidden = false; $("#bonus-close").focus(); }, 700);
    };
    addEventListener("keydown", (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = k === CODE[pos] ? pos + 1 : (k === CODE[0] ? 1 : 0);
      if (pos === CODE.length) { pos = 0; celebrate(); }
    });
    const closeBonus = () => { bonus.hidden = true; Sound.play("back"); };
    $("#bonus-close").addEventListener("click", closeBonus);
    bonus.addEventListener("click", (e) => { if (e.target === bonus) closeBonus(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !bonus.hidden) closeBonus(); });

    // 6. Cutiefly notices the fairy cursor
    const cutie = $("#cutie");
    if (cutie && matchMedia("(pointer: fine)").matches) {
      addEventListener("mousemove", (e) => {
        const r = cutie.getBoundingClientRect(); if (!r.width) return;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy, dist = Math.hypot(dx, dy);
        if (dist < 260) {
          const k = (1 - dist / 260);
          cutie.style.translate = `${(dx * .12 * k).toFixed(1)}px ${(dy * .12 * k).toFixed(1)}px`;
          cutie.style.scale = dx < 0 ? "-1 1" : "1 1";
          cutie.classList.add("curious");
        } else { cutie.style.translate = "0 0"; cutie.style.scale = "1 1"; cutie.classList.remove("curious"); }
      }, { passive: true });
    }

    // 7. shockwave across the glass floor on first reveal
    const wave = () => { const w = $(".shockwave"); if (w) { w.classList.add("go"); setTimeout(() => w.remove(), 2000); } };
    if (document.body.classList.contains("intro-active")) {
      new MutationObserver((m, ob) => { if (!document.body.classList.contains("intro-active")) { ob.disconnect(); setTimeout(wave, 900); } })
        .observe(document.body, { attributes: true, attributeFilter: ["class"] });
    } else setTimeout(wave, 1200);
  })();

  /* ---------- about, abilities, scroll reveals, timeline charge, tab title ---------- */
  (() => {
    // about
    if (profile.about) $("#about-text").textContent = profile.about; else $("#about-text").remove();
    if (profile.personal && $("#about-personal")) { $("#about-personal span").textContent = profile.personal; $("#about-personal").hidden = false; }
    // scroll reveals
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in"); io.unobserve(e.target);
      if (e.target.id === "bracket") e.target.classList.add("charged");
    }), { threshold: 0, rootMargin: "0px 0px -6% 0px" });   // fire as soon as the top edge shows (tall blocks on phones never reach a % threshold)
    const pending = new Set();
    window.__reveal = (el) => { if (calm) { el.classList.add("in", "charged"); return; } pending.add(el); io.observe(el); };
    // safety net: anything already scrolled past (fast flicks, section jumps) is shown immediately
    let rvq = 0;
    addEventListener("scroll", () => { if (rvq) return; rvq = requestAnimationFrame(() => { rvq = 0;
      pending.forEach((el) => { if (el.classList.contains("in")) { pending.delete(el); return; } if (el.getBoundingClientRect().top < innerHeight * .94) { el.classList.add("in"); if (el.id === "bracket") el.classList.add("charged"); io.unobserve(el); pending.delete(el); } });
    }); }, { passive: true });
    $$(".plaque-row").forEach((el) => el.classList.add("reveal"));
    $$(".cert-item").forEach((el, i) => { el.closest("li").classList.add("reveal"); el.closest("li").style.setProperty("--rd", i * 60 + "ms"); });
    $$(".reveal").forEach((el) => window.__reveal(el));
    $$(".node").forEach((n, i) => n.style.setProperty("--ci", i));

    // tab title when the visitor switches away
    const base = document.title;
    document.addEventListener("visibilitychange", () => { document.title = document.hidden ? "✦ Come back, adventurer!" : base; });
  })();

  /* ---------- nav ---------- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > window.innerHeight * 0.55);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  $("#menu-btn").addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open); $("#menu-btn").setAttribute("aria-expanded", open);
    Sound.play(open ? "select" : "back");
  });
  const navLinks = $$(".nav-links a");
  // KH-style transition when jumping to a section from a menu
  // section jump: bar confirm → fade + glide → star flies to the title → light sweep
  // Perf: one rAF loop, transform/opacity only, pooled trail sparks, instant scroll steps, cancel on user input.
  let jumping = false, cancelJump = null;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3), easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const fly = (() => {
    const star = document.createElement("span"); star.className = "fly-star"; star.hidden = true;
    star.innerHTML = '<svg><use href="#star-soft"/></svg>';
    const sparks = Array.from({ length: 10 }, () => { const d = document.createElement("i"); d.className = "fly-trail"; return d; });
    document.body.append(star, ...sparks);
    return { star, sparks };
  })();
  const warpTo = (id, ev) => {
    const target = document.getElementById(id); if (!target) return;
    if (cancelJump) cancelJump();
    const title = $(".sec-head h2", target) || target;
    const root = document.documentElement;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches || root.classList.contains("calm");
    const done = () => { try { history.replaceState(null, "", "#" + id); } catch (e) {} };
    $$(".reveal", target).forEach((el) => el.classList.add("in"));
    if (calm) { root.style.scrollBehavior = "auto"; target.scrollIntoView(); root.style.scrollBehavior = ""; done(); return; }
    jumping = true;
    const small = innerWidth < 760;
    const src = (ev && ev.target && ev.target.closest && ev.target.closest("a, button")) || document.activeElement;
    const sr = src && src !== document.body ? src.getBoundingClientRect() : null;
    const sx = ev && ev.clientX ? ev.clientX : sr ? sr.left + 28 : innerWidth / 2;
    const sy = ev && ev.clientY ? ev.clientY : sr ? sr.top + sr.height / 2 : innerHeight / 2;
    if (src && src.classList && src.classList.contains("menu-bar")) { src.classList.remove("chosen"); void src.offsetWidth; src.classList.add("chosen"); setTimeout(() => src.classList.remove("chosen"), 500); }
    root.style.scrollBehavior = "auto";
    document.body.classList.add("jumping");
    const fromHero = scrollY < innerHeight * .6;
    if (fromHero) document.body.classList.add("focus-pull");
    const y0 = scrollY;
    const y1 = () => Math.max(0, Math.min(target.getBoundingClientRect().top + scrollY, root.scrollHeight - innerHeight));
    const yEnd = y1(), dist = Math.abs(yEnd - y0);
    const dur = Math.min(small ? 620 : 760, Math.max(420, 300 + dist * .12));
    const tr = title.getBoundingClientRect();
    const ex = Math.max(16, tr.left - (small ? 16 : 22)), ey = tr.top + scrollY - yEnd + tr.height * .45;
    const cx = sx + (ex - sx) * .35 + (small ? 60 : 140), cy = Math.min(sy, ey) - (small ? 60 : 110);
    const { star, sparks } = fly; let si = 0, lastSpark = 0, raf = 0, alive = true;
    star.hidden = false; star.classList.remove("land");
    const stop = (landed) => {
      if (!alive) return; alive = false; cancelAnimationFrame(raf);
      removeEventListener("wheel", userStop); removeEventListener("touchstart", userStop); removeEventListener("keydown", keyStop);
      document.body.classList.remove("focus-pull", "jumping"); root.style.scrollBehavior = "";
      jumping = false; cancelJump = null;
      if (landed) {
        star.classList.add("land"); setTimeout(() => { if (!jumping) star.hidden = true; }, 420);
        title.classList.remove("sweep"); void title.offsetWidth; title.classList.add("sweep");
        setTimeout(() => title.classList.remove("sweep"), 900);
        done();
      } else star.hidden = true;
    };
    const userStop = () => stop(false), keyStop = (e) => { if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) stop(false); };
    addEventListener("wheel", userStop, { passive: true }); addEventListener("touchstart", userStop, { passive: true }); addEventListener("keydown", keyStop);
    cancelJump = () => stop(false);
    const t0 = performance.now() + 90; // brief beat for the bar confirm
    const step = (now) => {
      if (!alive) return;
      const t = Math.max(0, Math.min(1, (now - t0) / dur)), k = easeIO(t), u = easeOut(t);
      window.scrollTo(0, y0 + (yEnd - y0) * k);
      const x = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * cx + u * u * ex, y = (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * cy + u * u * ey;
      star.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(u * 180).toFixed(0)}deg)`;
      if (t > 0 && t < .95 && now - lastSpark > (small ? 55 : 40)) {
        lastSpark = now; const d = sparks[si++ % sparks.length];
        d.classList.remove("go"); d.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`; void d.offsetWidth; d.classList.add("go");
      }
      if (t < 1) raf = requestAnimationFrame(step); else stop(true);
    };
    raf = requestAnimationFrame(step);
  };
  navLinks.forEach((a) => a.addEventListener("click", (e) => {
    nav.classList.remove("open"); Sound.play("select");
    const id = a.getAttribute("href").slice(1); e.preventDefault(); warpTo(id, e);
  }));
  const navObs = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) navLinks.forEach((a) => { const on = a.getAttribute("href") === "#" + e.target.id; a.classList.toggle("is-current", on); if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
  }), { rootMargin: "-45% 0px -50% 0px" });
  ["experience", "projects", "certifications"].forEach((id) => navObs.observe(document.getElementById(id)));

  /* ---------- title menu ---------- */
  const bars = $$(".menu-bar");
  let barIdx = 0;
  const focusBar = (i, { sound = true, move = true } = {}) => {
    barIdx = (i + bars.length) % bars.length;
    bars.forEach((b, j) => { b.classList.toggle("is-focus", j === barIdx); b.tabIndex = j === barIdx ? 0 : -1; });
    if (move) bars[barIdx].focus({ preventScroll: true });
    if (sound) Sound.play("move");
  };
  bars.forEach((b, i) => {
    b.addEventListener("mouseenter", () => focusBar(i, { move: false, sound: barIdx !== i || !b.classList.contains("is-focus") }));
    b.addEventListener("focus", () => { if (barIdx !== i || !b.classList.contains("is-focus")) focusBar(i, { move: false, sound: barIdx !== i }); });
    b.addEventListener("click", (e) => {
      Sound.play("select");
      const href = b.getAttribute("href") || "";
      if (href.startsWith("#") && href.length > 1) { e.preventDefault(); warpTo(href.slice(1), e.clientX ? e : null); }
    });
    b.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); focusBar(barIdx + 1); }
      if (e.key === "ArrowUp") { e.preventDefault(); focusBar(barIdx - 1); }
    });
  });
  // nothing is lit until you point at (or tab to) a tab, and it goes dark again when you leave
  const tm = $("#title-menu"), unlight = () => bars.forEach((b) => b.classList.remove("is-focus"));
  bars.forEach((b, j) => { b.tabIndex = j === 0 ? 0 : -1; });
  tm?.addEventListener("mouseleave", () => { const a = document.activeElement; if (!(tm.contains(a) && a.matches(":focus-visible"))) unlight(); });
  tm?.addEventListener("focusout", (e) => { if (!tm.contains(e.relatedTarget)) unlight(); });

  /* ---------- EXPERIENCE ---------- */
  const inRole = (date, r) => { const d = ym(date); if (!d || !r.to) return false; return d >= ym(r.from) && (String(r.to).toLowerCase() === "present" || d <= ym(r.to)); };
  const SKILL_GROUPS = {
    "Governance & Risk": ["security governance", "policy & standards", "security rules & baselines", "compliance auditing", "risk reduction", "security auditing", "security awareness", "knowbe4"],
    "Security Operations": ["endpoint threat response", "endpoint security", "crowdstrike falcon", "siem", "vulnerability management", "automox", "manageengine", "incident communications"],
    "Identity & Access": ["microsoft entra id", "active directory", "iam", "azure", "microsoft 365", "group policy", "privileged access requests", "vpn provisioning"],
    "Network & Infrastructure": ["network security", "firewall rules", "networking fundamentals", "cisco packet tracer", "linux", "windows imaging", "documentation"],
    "Threat Detection & Testing": ["threat hunting", "picus security", "proofpoint", "exchange", "phishing analysis"],
    "Endpoint & Asset Management": ["patch scripting", "bitlocker", "asset management", "identity management"],
    "Finance & Collections": ["collections", "billing & invoicing", "payment processing", "insurance claims", "lien process", "notary public", "data protection"],
    "Support & Operations": ["technical support", "process documentation", "customer service"],
    "Design & Media": ["graphic design", "adobe photoshop", "adobe premiere pro", "drone documentation"]
  };
  const groupSkills = (skills) => {
    const out = {};
    skills.forEach((s) => {
      const g = Object.keys(SKILL_GROUPS).find((k) => SKILL_GROUPS[k].includes(s.toLowerCase())) || "Other";
      (out[g] = out[g] || []).push(s);
    });
    // "Other" always last
    return Object.entries(out).sort((x, y) => (x[0] === "Other") - (y[0] === "Other"));
  };
  const monogram = (name) => String(name || "?").split(/\s+/).filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("") || "?";
  // a company's logo (from data.js `logo`) when it has one, otherwise its initials
  const coLogo = (company) => (roles.find((x) => x.company === company && x.logo) || {}).logo;
  const markHTML = (company, big) => { const l = coLogo(company); return l ? `<span class="mono${big ? " big" : ""} has-logo" aria-hidden="true"><img src="${esc(l)}" alt="" loading="lazy" decoding="async"></span>` : `<span class="mono${big ? " big" : ""}" aria-hidden="true">${esc(monogram(company))}</span>`; };
  const CO_COLORS = ["#2b55d6", "#3b4fa8", "#5a6fc4", "#24308a"];
  const roleRange = (r) => r.dateLabel || (r.to ? `${fmtDate(r.from)} – ${fmtDate(r.to)}` : fmtDate(r.from));

  const expList = $("#exp-list"), roleCard = $("#role-card");
  if (!roles.length) {
    expList.innerHTML = ""; roleCard.innerHTML = `<p class="empty">Add your roles in data.js.</p>`;
  } else {
    // group roles by company, newest first
    const order = roles.map((r, i) => ({ r, i })).reverse();
    const groups = [];
    order.forEach((o) => { const g = groups.find((x) => x.company === o.r.company); g ? g.items.push(o) : groups.push({ company: o.r.company, items: [o] }); });
    expList.innerHTML = groups.map((g, gi) => `
      <div class="exp-co" style="--co:${CO_COLORS[gi % CO_COLORS.length]}">
        <div class="exp-co-head">${markHTML(g.company)}<span class="co-name">${esc(g.company)}</span></div>
        ${g.items.map((o, k) => `
          ${k > 0 ? `<div class="promo" aria-label="Promoted"><span>▲ Promoted</span></div>` : ""}
          <button class="exp-role${String(o.r.to).toLowerCase() === "present" ? " is-now" : ""}" data-i="${o.i}" role="tab" aria-selected="false">
            <span class="er-dot" aria-hidden="true"></span>
            <span class="er-title">${esc(o.r.role)}</span>
            <span class="er-dates">${esc(roleRange(o.r))}</span>
            <span class="er-year" aria-hidden="true">'${esc(String((o.r.from || o.r.dateLabel || "").match(/\d{4}/)?.[0] || "").slice(2))}</span>
          </button>
`).join("")}
      </div>`).join("");
    // one continuous glowing timeline rail + a packet that runs to the role you hover
    expList.insertAdjacentHTML("afterbegin", '<div class="tl-rail" aria-hidden="true"><i class="tl-packet"></i></div>');
    const rail = $(".tl-rail", expList), pk = $(".tl-packet", rail);
    const layoutRail = () => {
      const dots = $$(".er-dot, .exp-co-head .mono", expList); if (!dots.length) return;
      const lb = expList.getBoundingClientRect();
      const ys = dots.map((d) => { const r = d.getBoundingClientRect(); return [r.left + r.width / 2 - lb.left, r.top + r.height / 2 - lb.top]; });
      const x = $(".er-dot", expList).getBoundingClientRect(); const cx = x.left + x.width / 2 - lb.left;
      const top = Math.min(...ys.map((p) => p[1])), bot = Math.max(...ys.map((p) => p[1]));
      Object.assign(rail.style, { left: cx - 1 + "px", top: top + "px", height: bot - top + "px" });
    };
    requestAnimationFrame(layoutRail); addEventListener("resize", layoutRail, { passive: true });
    new ResizeObserver(layoutRail).observe(expList);
    $$(".exp-role", expList).forEach((b) => b.addEventListener("pointerenter", () => {
      if (document.documentElement.classList.contains("calm")) return;
      const d = $(".er-dot", b).getBoundingClientRect(), rb = rail.getBoundingClientRect(), y = d.top + d.height / 2 - rb.top;
      pk.getAnimations().forEach((an) => an.cancel());
      pk.animate([{ transform: "translate3d(0,0,0)", opacity: 0 }, { opacity: 1, offset: .2 }, { transform: `translate3d(0,${y}px,0)`, opacity: 1, offset: .9 }, { transform: `translate3d(0,${y}px,0)`, opacity: 0 }], { duration: 650, easing: "cubic-bezier(.3,.6,.3,1)" });
    }));
    const btns = $$(".exp-role", expList);
    const showRole = (i, sound = true) => {
      const r = roles[i];
      btns.forEach((b) => { const on = +b.dataset.i === i; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
      const gi = groups.findIndex((g) => g.items.some((o) => o.i === i));
      const relP = projects.map((p, k) => ({ ...p, _k: k })).filter((p) => inRole(p.date, r));
      const relC = certs.map((c, k) => ({ ...c, _k: k })).filter((c) => !pending(c) && inRole(c.date, r));
      const hl = r.highlights || [], SHOW = 99;   // every highlight shows, no "Show all" toggle
      roleCard.style.setProperty("--co", CO_COLORS[gi % CO_COLORS.length]);
      roleCard.innerHTML = `
        <header class="rc-head">
          ${markHTML(r.company, true)}
          <div>
            <h3 class="role-title">${esc(r.role)}</h3>
            <div class="role-co">${esc([r.company, r.location].filter(Boolean).join(" · "))}</div>
          </div>
          <span class="role-years">${esc(roleRange(r))}${String(r.to).toLowerCase() === "present" ? ' <i class="now">Current</i>' : ""}</span>
        </header>
        ${r.summary ? `<p class="role-summary">${esc(r.summary)}</p>` : ""}
        ${r.stats?.length ? `<div class="stats">${r.stats.map((s) => `<div class="stat"><b data-v="${esc(s.value)}">${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>` : ""}
        ${hl.length ? `<div class="label">Highlights</div><ul class="highlights">${hl.map((h, k) => `<li${k >= SHOW ? ' class="more" hidden' : ""}>${esc(h)}</li>`).join("")}</ul>
          ${hl.length > SHOW ? `<button class="hl-toggle" aria-expanded="false">Show all ${hl.length} highlights</button>` : ""}` : ""}
        ${false && r.skills?.length ? `<div class="label">Core skills</div><div class="skill-groups">${groupSkills(r.skills).map(([g, list]) => `
          <div class="sg"><div class="sg-name">${esc(g)}</div><div class="sg-chips">${list.map((s) => `<span>${esc(s)}</span>`).join("")}</div></div>`).join("")}</div>` : ""}
        ${(relP.length || relC.length) ? `<div class="label">During this role</div><div class="chips">
          ${relP.map((p) => `<button class="link-chip" data-p="${p._k}">${icon(p.icon)}<span class="kind">Project</span>${esc(p.title)}</button>`).join("")}
          ${relC.map((c) => `<button class="link-chip t-${tierOf(c.tier)}" data-c="${c._k}">${gem("")}<span class="kind">Cert</span>${esc(c.title)}</button>`).join("")}
        </div>` : ""}`;
      roleCard.classList.remove("fade"); void roleCard.offsetWidth; roleCard.classList.add("fade");
      const tg = $(".hl-toggle", roleCard);
      if (tg) tg.addEventListener("click", () => {
        const open = tg.getAttribute("aria-expanded") !== "true";
        $$(".highlights .more", roleCard).forEach((li) => (li.hidden = !open));
        tg.setAttribute("aria-expanded", open); tg.textContent = open ? "Show fewer" : `Show all ${hl.length} highlights`;
        Sound.play(open ? "select" : "back");
      });
      $$(".stat b", roleCard).forEach((b) => {
        const m = /^(\d+)(.*)$/.exec(b.dataset.v); if (!m || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const end = +m[1], suf = m[2], t0 = performance.now(), dur = 900;
        const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); b.textContent = Math.round(end * e) + suf; if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
      $$(".link-chip[data-p]", roleCard).forEach((b) => b.addEventListener("click", () => openProject(+b.dataset.p, b)));
      $$(".link-chip[data-c]", roleCard).forEach((b) => b.addEventListener("click", () => { selectCert(+b.dataset.c); document.getElementById("certifications").scrollIntoView(); }));
      $$(".link-chip svg", roleCard).forEach((s) => { if (s.closest("[data-c]")) s.style.color = "var(--t)"; });
      if (sound) Sound.play("select");
    };
    btns.forEach((b, k) => {
      b.addEventListener("click", () => showRole(+b.dataset.i));
      b.addEventListener("mouseenter", () => Sound.play("move"));
      b.addEventListener("keydown", (e) => {
        const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0; if (!d) return; e.preventDefault();
        const n = btns[(k + d + btns.length) % btns.length]; n.focus(); showRole(+n.dataset.i);
      });
    });
    showRole(roles.length - 1, false);
  }

  // profile card
  (() => {
    const pc = $("#profile-card"); if (!pc) return;
    if (profile.photo) $("#pc-img").src = optImg(profile.photo).src; else $(".pc-photo").remove();
    $("#pc-name").textContent = profile.name || "";
    $("#pc-title").textContent = profile.className || "";
    if (profile.location) $("#pc-loc").textContent = profile.location; else { $("#pc-loc").remove(); $(".pc-meta .dot").remove(); }
    const builds = [].concat(profile.showBuilds ? profile.builds || [] : []).map((t) => projects.findIndex((p) => p.title === t)).filter((k) => k >= 0);
    if (builds.length) {
      $("#pc-chips").innerHTML = builds.map((k) => `<button class="link-chip" data-p="${k}">${icon(projects[k].icon)}${esc(projects[k].title)}</button>`).join("");
      $$("#pc-chips .link-chip").forEach((b) => b.addEventListener("click", () => openProject(+b.dataset.p, b)));
    } else $("#pc-builds").remove();
  })();

  /* ---------- PROJECT WORK (cards) ---------- */
  const pList = projects.map((p, i) => ({ ...p, _i: i })).sort(byDateDesc);
  const cardNo = {}; pList.forEach((p, n) => (cardNo[p._i] = String(n + 1).padStart(2, "0")));
  const CATS = { Governance: "Security", "Threat Research": "Security", "Security Monitoring": "Security", "Network Security": "Network", Infrastructure: "Network", "Systems Administration": "Systems", Leadership: "Leadership" };
  const catOf = (p) => CATS[p.type] || "Other";
  const types = ["All", ...["Security", "Network", "Systems", "Leadership", "Other"].filter((c) => pList.some((p) => catOf(p) === c))];
  let pFilter = "All";
  const done = pList.filter((p) => !isActive(p)).length;
  $("#project-summary").innerHTML = `<span class="chip" style="--t:var(--hp)"><i></i>${done} complete</span>` +
    (pList.length - done ? `<span class="chip" style="--t:#2b55d6"><i></i>${pList.length - done} ongoing</span>` : "");
  const firstSentence = (t) => { const m = String(t || "").match(/^.*?[.!?](\s|$)/); return (m ? m[0] : String(t || "")).trim(); };
  // projects without a photo get a designed HUD cover: grid, radar rings + sweep, the project's icon, and its key areas labelled around it
  const hudArt = (p) => {
    const labels = (p.controls || p.tools || []).slice(0, 4);
    const ring = (r, d) => `<circle cx="200" cy="112" r="${r}" fill="none" stroke="currentColor" stroke-width="1" ${d ? `stroke-dasharray="${d}"` : ""}/>`;
    const ticks = Array.from({ length: 36 }, (_, i) => { const a = i * Math.PI / 18, r1 = 96, r2 = i % 3 ? 100 : 106; return `<line x1="${(200 + Math.cos(a) * r1).toFixed(1)}" y1="${(112 + Math.sin(a) * r1).toFixed(1)}" x2="${(200 + Math.cos(a) * r2).toFixed(1)}" y2="${(112 + Math.sin(a) * r2).toFixed(1)}"/>`; }).join("");
    return `<svg class="hc-lines" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g class="hc-grid">${Array.from({ length: 21 }, (_, i) => `<line x1="${i * 20}" y1="0" x2="${i * 20}" y2="225"/>`).join("")}${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${i * 20 + 2}" x2="400" y2="${i * 20 + 2}"/>`).join("")}</g>
        <g class="hc-rings">${ring(38)}${ring(64, "2 5")}${ring(96)}<g class="hc-ticks">${ticks}</g>
          <line x1="80" y1="112" x2="320" y2="112" stroke-dasharray="1 6"/><line x1="200" y1="0" x2="200" y2="225" stroke-dasharray="1 6"/></g>
      </svg><span class="hc-sweep" aria-hidden="true"></span><span class="hc-icon">${icon(p.icon)}</span>
      ${labels.map((l, i) => `<span class="hc-tag hc-t${i}" aria-hidden="true">${esc(l)}</span>`).join("")}`;
  };
  const cover = (p, cls, peek) => {
    const im = normImages(p.images)[0];
    const pk = peek ? `<span class="pc-peek"><small>What I did</small>${esc(peek)}</span>` : "";
    return im ? `<span class="${cls} has-img" style="background-image:url('${im.lqip}')"><img src="${esc(im.small)}" alt="" loading="lazy" decoding="async">${pk}</span>`
              : `<span class="${cls} no-img hud-cover">${hudArt(p)}${pk}</span>`;
  };
  function renderCards() {
    $("#project-filters").innerHTML = types.length > 2 ? types.map((t) =>
      `<button class="filter" aria-pressed="${t === pFilter}" data-type="${esc(t)}">${esc(t)}</button>`).join("") : "";
    const q = (window.__projQ || "").trim().toLowerCase();
    const hay = (p) => [p.title, p.summary, p.type, ...(p.tools || [])].join(" ").toLowerCase();
    const matches = (pFilter === "All" ? pList : pList.filter((p) => catOf(p) === pFilter)).filter((p) => !q || q.split(/\s+/).every((w) => hay(p).includes(w)));
    if ($("#proj-live")) $("#proj-live").textContent = `${matches.length} project${matches.length === 1 ? "" : "s"} shown`;
    const feat = matches.find((p) => p.featured);
    const shown = matches.filter((p) => p !== feat);
    const fh = $("#featured");
    if (feat) {
      fh.innerHTML = `<button class="feat-card reveal" data-i="${feat._i}">
        ${cover(feat, "feat-art")}
        <span class="feat-body">
          <span class="feat-badge">Featured project</span>
          <span class="feat-title">${esc(feat.title)}</span>
          ${feat.summary ? `<span class="feat-sum">${esc(feat.summary)}</span>` : ""}
          <span class="feat-tools">${(feat.tools || []).slice(0, 5).map((t) => `<i>${esc(t)}</i>`).join("")}</span>
          <span class="feat-cta">Read case study →</span>
        </span>
      </button>`;
      const fb = $(".feat-card", fh);
      fb.addEventListener("click", () => openProject(+fb.dataset.i, fb));
      window.__reveal && window.__reveal(fb);
    } else fh.innerHTML = "";
    $("#card-grid").innerHTML = shown.length ? shown.map((p) => `
      <button class="pcard reveal" data-i="${p._i}" aria-label="${esc(p.title)}">
        ${cover(p, "pc-cover", firstSentence(p.approach || p.result || ""))}
        <span class="pc-text">
          <span class="pc-type">${esc(p.type || "Project")}${isActive(p) ? ' · <b>Ongoing</b>' : ""}</span>
          <span class="pc-title">${esc(p.title)}</span>
          ${p.summary ? `<span class="pc-sum">${esc(p.summary)}</span>` : ""}
          <span class="pc-tools">${(p.tools || []).slice(0, 3).map((t) => `<i>${esc(t)}</i>`).join("")}</span>
        </span>
      </button>`).join("") : `<p class="empty">${q ? `No projects match “${esc(q)}”.` : "No projects in this category yet."}</p>`;
    markLoaded($("#card-grid")); markLoaded($("#featured"));
    $$("#card-grid .reveal").forEach((el, i) => { el.style.setProperty("--rd", (i % 3) * 70 + "ms"); window.__reveal && window.__reveal(el); });
    $$("#project-filters .filter").forEach((b) => b.addEventListener("click", () => {
      pFilter = b.dataset.type; Sound.play("move"); renderCards();
      $(`#project-filters .filter[data-type="${CSS.escape(pFilter)}"]`)?.focus();
    }));
    $$("#card-grid .pcard").forEach((b) => b.addEventListener("click", () => openProject(+b.dataset.i, b)));
  }
  renderCards();
  (() => {
    const inp = $("#proj-q"); if (!inp) return;
    let t; inp.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { window.__projQ = inp.value; renderCards(); }, 120); });
  })();

  function openProject(i, opener) {
    const p = projects[i]; if (!p) return;
    const [c1, c2] = ["#1b2a6b", "#2b55d6"];
    const imgs = normImages(p.images);
    const desc = Array.isArray(p.description) ? p.description : (p.description ? [p.description] : []);
    const part = (title, body) => body ? `<section class="ql-part"><h4>${title}</h4><p>${esc(body)}</p></section>` : "";
    const structured = p.problem || p.approach || p.result;
    openModal(p.title, `
      <div class="ql-hero" style="--c1:${c1};--c2:${c2}">
        <div class="ql-icon">${icon(p.icon)}</div>
        <div class="ql-head">
          <div class="ql-kicker">Case Study · ${esc([p.type, isActive(p) ? "In progress" : "Complete", fmtDate(p.date)].filter(Boolean).join(" · "))}</div>
          <h3>${esc(p.title)}</h3>
          ${p.summary ? `<p>${esc(p.summary)}</p>` : ""}
        </div>
      </div>
      <div class="ql-grid">
        <div class="ql-main">
          ${structured ? part("The Challenge", p.problem) + part("My Approach", p.approach) + part("The Result", p.result)
            : `<section class="ql-part"><h4>Overview</h4>${desc.map((d) => `<p>${esc(d)}</p>`).join("")}</section>`}
          ${imgs.length ? `<section class="ql-part"><h4>Gallery</h4>${thumbsHTML(imgs)}</section>` : ""}
        </div>
        <aside class="ql-side">
          ${p.tools?.length ? `<div class="abilities-head in-role"><span>Tools used</span><small>${p.tools.length}</small></div>
            <div class="ql-tools">${p.tools.map((t) => `<button class="ability chip-link" data-tool="${esc(t)}" title="Show projects using ${esc(t)}"><svg viewBox="0 0 64 80" aria-hidden="true"><use href="#crystal"/></svg>${esc(t)}</button>`).join("")}</div>` : ""}
          ${p.controls?.length ? `<div class="abilities-head in-role ql-ctl-head"><span>Controls applied</span><small>${p.controls.length}</small></div>
            <ul class="ql-controls">${p.controls.map((c) => `<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 12l2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>${esc(c)}</li>`).join("")}</ul>` : ""}
          ${p.links?.length ? `<div class="actions">${p.links.map((l, k) => `<a class="btn ${k ? "" : "gold"}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label || "Open")}</a>`).join("")}</div>` : ""}
        </aside>
      </div>
    `, opener);
    modal.classList.add("quest");
    wireThumbs($("#modal-body"), imgs);
    // previous / next project
    const order = pList.map((q) => q._i), pos = order.indexOf(i);
    const prevI = order[(pos - 1 + order.length) % order.length], nextI = order[(pos + 1) % order.length];
    if (order.length > 1) {
      $(".ql-main", modal).insertAdjacentHTML("beforeend", `<nav class="ql-nav" aria-label="More projects">
        <button class="ql-step" data-step="${prevI}"><small>← Previous</small><span>${esc(projects[prevI].title)}</span></button>
        <button class="ql-step next" data-step="${nextI}"><small>Next →</small><span>${esc(projects[nextI].title)}</span></button></nav>`);
      $$(".ql-step", modal).forEach((b) => b.addEventListener("click", () => { Sound.play("move"); window.__qlStep = true; openProject(+b.dataset.step, modalOpener); $(".modal-body", modal).scrollTop = 0; modal.scrollTop = 0; }));
    }
    modal.dataset.proj = i; modal.dataset.prev = prevI; modal.dataset.next = nextI;
    if (!window.__qlStep && opener && opener.getBoundingClientRect) window.__growFrom && window.__growFrom(opener);
    window.__qlStep = false;
    try { history.replaceState(null, "", "#project/" + slug(p.title)); } catch (e) {}
  }
  function slug(t) { return String(t).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  window.__openProjectBySlug = (s) => { const k = projects.findIndex((p) => slug(p.title) === s); if (k >= 0) { openProject(k); return true; } return false; };

  /* ---------- CERTIFICATIONS ---------- */
  const cList = certs.map((c, i) => ({ ...c, _i: i })).sort(byDateDesc);
  let selectCert = () => {};
  if (!cList.length) {
    $("#certs-wrap").innerHTML = `<p class="empty">No certifications yet. Add some in data.js.</p>`;
  } else {
    const earned = cList.filter((c) => !pending(c));
    $("#cert-summary").innerHTML = TIERS.slice().reverse().map((t) => {
      const n = cList.filter((c) => tierOf(c.tier) === t).length;
      return n ? `<span class="chip t-${t}"><i></i>${n} ${t}</span>` : "";
    }).join("") + (earned.length ? `<span class="chip"><i style="background:var(--hp)"></i>${earned.length} earned</span>` : "") +
      (cList.length - earned.length ? `<span class="chip"><i style="background:var(--yellow)"></i>${cList.length - earned.length} in progress</span>` : "");
    $("#cert-list").innerHTML = cList.map((c, j) => `
      <li><button class="cert-item${pending(c) ? "" : " is-earned"}" role="option" aria-selected="false" data-j="${j}">
        <i aria-hidden="true"></i>
        <span class="q-title">${esc(c.title)}</span>
        <span class="q-stamp ${pending(c) ? "pending" : ""}">${pending(c) ? "IN PROGRESS" : "EARNED"}</span>
        <span class="q-sub">${esc([c.issuer, yr(c.date)].filter(Boolean).join(" · "))}</span>
      </button></li>`).join("");
    const items = $$(".cert-item");
    const show = (j, sound = true) => {
      const c = cList[j], tier = tierOf(c.tier), imgs = normImages(c.images);
      items.forEach((b, k) => { b.setAttribute("aria-selected", k === j); b.tabIndex = k === j ? 0 : -1; });
      const d = $("#cert-detail");
      d.className = `cert-detail panel-box t-${tier}`;
      d.innerHTML = `
        <div class="cert-hero">${gem()}
          <div>
            <div class="tier-line">${tier}${pending(c) ? " · in progress" : ""}</div>
            <h3>${esc(c.title)}</h3>
          </div>
        </div>
        <dl class="meta">
          ${c.issuer ? `<dt>Issuer</dt><dd>${esc(c.issuer)}</dd>` : ""}
          ${c.date ? `<dt>${pending(c) ? "Target" : "Earned"}</dt><dd>${esc(fmtDate(c.date))}</dd>` : ""}
          ${c.expires ? `<dt>Expires</dt><dd>${esc(fmtDate(c.expires))}</dd>` : ""}
          ${c.credentialId ? `<dt>Credential</dt><dd>${esc(c.credentialId)}</dd>` : ""}
        </dl>
        ${c.description ? `<div class="prose" style="position:relative;margin-top:14px"><p>${esc(c.description)}</p></div>` : ""}
        ${imgs.length ? `<div class="label">Gallery</div>${thumbsHTML(imgs)}` : ""}
        ${(c.verify || c.document) ? `<div class="actions">
          ${c.verify ? `<a class="btn gold" href="${esc(c.verify)}" target="_blank" rel="noopener">Verify credential</a>` : ""}
          ${c.document ? `<a class="btn" href="${esc(c.document)}" target="_blank" rel="noopener">View certificate</a>` : ""}
        </div>` : ""}`;
      if (pending(c)) {
        d.classList.add("locked");
        d.insertAdjacentHTML("beforeend", `<div class="lock-badge"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#i-lock"/></svg>In progress<span class="lock-bar"><i></i></span></div>`);
      } else {
        d.classList.add("earned");
        d.insertAdjacentHTML("afterbegin", `<div class="unlock-rays" aria-hidden="true"></div><div class="unlock-banner" aria-hidden="true">Certification Earned</div>`);
        if (certsSeen && !unlocked.has(j)) {
          unlocked.add(j); d.classList.add("unlocking"); Sound.play("start");
          setTimeout(() => d.classList.remove("unlocking"), 2200);
        }
      }
      wireThumbs(d, imgs);
      if (sound) Sound.play("select");
    };
    // play the unlock moment the first time the section scrolls into view
    let certsSeen = false; const unlocked = new Set(); let current = 0;
    new IntersectionObserver((es, ob) => es.forEach((e) => {
      if (!e.isIntersecting) return; certsSeen = true; ob.disconnect(); show(current, false);
    }), { threshold: .35 }).observe($("#certs-wrap"));
    items.forEach((b, j) => {
      b.addEventListener("click", () => { current = j; show(j); });
      b.addEventListener("mouseenter", () => Sound.play("move"));
      b.addEventListener("keydown", (e) => {
        const dlt = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
        if (!dlt) return; e.preventDefault();
        const n = (j + dlt + items.length) % items.length; items[n].focus(); current = n; show(n);
      });
    });
    selectCert = (origIndex) => { const j = cList.findIndex((c) => c._i === origIndex); if (j >= 0) show(j); };
    show(0, false);
  }

  /* ---------- the big update: worlds, journey, hall of trials, credits ---------- */
  (() => {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- world skies follow the section in view ---
    const WORLD = { top: "awake", experience: "dawn", projects: "twilight", certifications: "night" };
    const mapBtns = $$("#worldmap button");
    const setWorld = (id) => {
      document.body.dataset.world = WORLD[id] || "awake";
      mapBtns.forEach((b) => b.classList.toggle("on", b.dataset.to === id));
    };
    const wio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setWorld(e.target.id); }), { rootMargin: "-45% 0px -50% 0px" });
    ["top", "experience", "projects", "certifications"].forEach((id) => { const el = document.getElementById(id); if (el) wio.observe(el); });
    new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setWorld("certifications"); }), { threshold: .2 }).observe($(".footer"));
    setWorld("top");
    const ws = $("#world-stars");
    for (let i = 0; i < 80; i++) { const s = document.createElement("i"); s.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;--s:${(1 + Math.random() * 2).toFixed(1)}px;--t:${(1.5 + Math.random() * 3).toFixed(1)}s;--d:${(-Math.random() * 4).toFixed(1)}s`; ws.appendChild(s); }

    // --- world map buttons ---
    mapBtns.forEach((b) => b.addEventListener("click", (e) => {
      Sound.play("select");
      if (b.dataset.to === "top") { scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" }); return; }
      warpTo(b.dataset.to, e);
    }));
    $("#credits-top").addEventListener("click", (e) => { e.preventDefault(); Sound.play("select"); scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" }); });

    // --- journey path through the timeline ---
    const bracket = $("#bracket"), nodes = bracket ? $$(".node", bracket) : [];
    if (nodes.length > 1) {
      const NS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(NS, "svg"); svg.classList.add("journey"); svg.setAttribute("aria-hidden", "true");
      const glow = document.createElementNS(NS, "path"); glow.classList.add("j-glow");
      const path = document.createElementNS(NS, "path"); path.classList.add("j-path");
      svg.append(glow, path); bracket.prepend(svg);
      const orb = document.createElement("span"); orb.className = "j-orb"; bracket.appendChild(orb);
      let pts = [], current = nodes.length - 1;
      const layout = () => {
        const br = bracket.getBoundingClientRect();
        svg.setAttribute("viewBox", `0 0 ${br.width} ${br.height}`);
        pts = nodes.map((n) => { const g = n.querySelector("svg").getBoundingClientRect(); return [g.left - br.left + g.width / 2, g.top - br.top + g.height / 2]; });
        let dPath = `M ${pts[0][0] - 60} ${pts[0][1] + 10} Q ${pts[0][0] - 30} ${pts[0][1]} ${pts[0][0]} ${pts[0][1]}`;
        for (let k = 1; k < pts.length; k++) {
          const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], mx = (x0 + x1) / 2, sw = (k % 2 ? -1 : 1) * 46;
          dPath += ` C ${x0 + (mx - x0) * .7} ${y0 + sw}, ${mx + (x1 - mx) * .3} ${y1 + sw}, ${x1} ${y1}`;
        }
        const [lx, ly] = pts[pts.length - 1]; dPath += ` Q ${lx + 30} ${ly} ${lx + 60} ${ly - 10}`;
        path.setAttribute("d", dPath); glow.setAttribute("d", dPath);
        const L = path.getTotalLength(); path.style.setProperty("--len", L); glow.style.setProperty("--len", L);
        placeOrb(current, true);
      };
      const placeOrb = (i, instant) => {
        if (!pts[i]) return; current = i;
        orb.style.transition = instant ? "none" : "";
        orb.style.left = pts[i][0] + "px"; orb.style.top = pts[i][1] + "px";
      };
      document.addEventListener("role:show", (e) => placeOrb(e.detail));
      addEventListener("resize", layout); addEventListener("load", layout); setTimeout(layout, 120); setTimeout(layout, 1500);
    }

    // --- hall of trials: pedestals + constellation ---
    const items = $$(".cert-item"), ped = $("#pedestals");
    if (items.length && ped) {
      const list = items.map((it) => {
        const title = it.querySelector(".q-title").textContent.trim();
        const earned = it.classList.contains("is-earned");
        const sub = it.querySelector(".q-sub").textContent.trim();
        const tier = (cList[+it.dataset.j] && tierOf(cList[+it.dataset.j].tier)) || "foundational";
        return { title: title.replace(/\s*\(.*?\)\s*/g, " ").trim(), abbr: (/\(([^)]+)\)/.exec(title) || [])[1], earned, sub, tier };
      });
      ped.innerHTML = list.map((c, k) => `
        <button class="pedestal t-${c.tier}${c.earned ? " earned" : " locked"}" role="option" aria-selected="false" data-k="${k}" style="--rd:${k * 90}ms">
          <span class="p-crystal">${gem("")}</span>
          <span class="p-base"></span>
          <span class="p-name">${esc(c.abbr || c.title)}</span>
          <span class="p-state">${c.earned ? "Earned" : "In progress"}</span>
        </button>`).join("");
      const peds = $$(".pedestal", ped);
      const sync = () => peds.forEach((p, k) => p.setAttribute("aria-selected", items[k].getAttribute("aria-selected")));
      peds.forEach((p, k) => {
        p.addEventListener("click", () => { items[k].click(); sync(); });
        p.addEventListener("mouseenter", () => Sound.play("move"));
        p.addEventListener("keydown", (e) => {
          const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return; e.preventDefault();
          const n = (k + d + peds.length) % peds.length; peds[n].focus(); peds[n].click();
        });
      });
      sync();
      const con = $("#constellation"), hall = $("#hall");
      const draw = () => {
        const hr = hall.getBoundingClientRect(); if (!hr.width) return;
        con.setAttribute("viewBox", `0 0 ${hr.width} ${hr.height}`);
        const c = peds.map((p) => { const r = p.querySelector(".p-crystal").getBoundingClientRect(); return [r.left - hr.left + r.width / 2, r.top - hr.top + r.height / 2]; });
        let out = "";
        for (let k = 1; k < c.length; k++) {
          const lit = list[k - 1].earned && list[k].earned;
          out += `<line x1="${c[k - 1][0].toFixed(1)}" y1="${c[k - 1][1].toFixed(1)}" x2="${c[k][0].toFixed(1)}" y2="${c[k][1].toFixed(1)}" class="${lit ? "lit" : ""}" style="--rd:${k * 120}ms"/>`;
        }
        out += c.map(([x, y], k) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${list[k].earned ? 4 : 2.5}" class="${list[k].earned ? "lit" : ""}"/>`).join("");
        con.innerHTML = out;
      };
      addEventListener("resize", draw); addEventListener("load", draw); setTimeout(draw, 150); setTimeout(draw, 1600);
    }

    // --- ending credits ---
    const art = profile.artFull || profile.art;
    if ($("#credits-art")) { if (art) $("#credits-art").src = art; else $("#credits-art").remove(); }

    const cc = $("#credits-contact"), ct = profile.cta || {};
    if (ct.url) cc.href = ct.url; else cc.remove();

    // --- performance: pause title-screen effects while it's offscreen or the tab is hidden ---
    new IntersectionObserver((es) => es.forEach((e) => { document.body.classList.toggle("hero-off", !e.isIntersecting); e.target.classList.toggle("fx-paused", !e.isIntersecting); }), { threshold: 0, rootMargin: "-72px 0px 0px 0px" }).observe($(".hero"));
    document.addEventListener("visibilitychange", () => document.body.classList.toggle("tab-hidden", document.hidden));
  })();

  /* ---------- professional layer: impact strip, quick view, security note ---------- */
  (() => {
    // impact strip
    const imp = profile.impact || [];
    if (imp.length) $("#impact").innerHTML = imp.map((s) => `<div class="imp"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("");
    else $("#impact").remove();
    $("#year").textContent = new Date().getFullYear();

    // recruiter quick view
    const qv = $("#quick"), page = $("#qv-page");
    const skills = [...new Map([...roles.slice().reverse().flatMap((r) => r.skills || []), ...projects.flatMap((p) => p.tools || [])].map((s) => [s.toLowerCase(), s])).values()].slice(0, 30);
    const range = (r) => r.dateLabel || (r.to ? `${fmtDate(r.from)} – ${fmtDate(r.to)}` : fmtDate(r.from));
    const jobs = roles.filter((r) => r.to).slice().reverse(), edu = roles.filter((r) => !r.to);
    const linkedin = profile.links && profile.links.linkedin, email = (profile.cta && profile.cta.url || "").replace(/^mailto:/, "");
    const rPages = profile.resumePages || [];
    if (rPages.length) page.classList.add("qv-resume"), page.innerHTML = rPages.map((src, i) => `<img src="${esc(src)}" alt="Brandon Restrepo résumé, page ${i + 1} of ${rPages.length}" decoding="async">`).join("");
    else page.innerHTML = `
      <header class="qv-head">
        <div><h1 id="qv-name">${esc(profile.name || "")}</h1><div class="qv-title">${esc(profile.className || "")}</div></div>
        <div class="qv-contact">
          ${profile.location ? `<span>${esc(profile.location)}</span>` : ""}
          ${email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : ""}
          ${linkedin ? `<a href="${esc(linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ""}
        </div>
      </header>
      ${profile.about ? `<section><h2>Summary</h2><p>${esc(profile.about)}</p></section>` : ""}
      ${imp.length ? `<section class="qv-impact">${imp.map((s) => `<div><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}</section>` : ""}
      <section><h2>Experience</h2>${jobs.map((r) => `
        <div class="qv-job">
          <div class="qv-job-head"><b>${esc(r.role)}</b><span>${esc(range(r))}</span></div>
          <div class="qv-co">${esc([r.company, r.location].filter(Boolean).join(" · "))}</div>
          <ul>${(r.highlights || []).slice(0, 5).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        </div>`).join("")}</section>
      <section><h2>Selected projects</h2><ul class="qv-proj">${projects.map((p) => `<li><b>${esc(p.title)}</b>${p.summary ? ` · ${esc(p.summary)}` : ""}</li>`).join("")}</ul></section>
      <div class="qv-cols">
        <section><h2>Skills</h2><p class="qv-skills">${skills.map(esc).join(" · ")}</p></section>
        <section><h2>Certifications</h2><ul>${certs.map((c) => `<li>${esc(c.title)}${pending(c) ? " <em>(in progress)</em>" : c.date ? ` · ${esc(fmtDate(c.date))}` : ""}</li>`).join("")}</ul>
        ${edu.length ? `<h2>Education</h2><ul>${edu.map((r) => `<li>${esc(r.role)} · ${esc(r.company)} · ${esc(range(r))}</li>`).join("")}</ul>` : ""}</section>
      </div>`;
    const res = $("#qv-resume"); if (profile.resume) res.href = profile.resume; else res.remove();
    let qvOpener = null;
    const openQV = () => { qvOpener = document.activeElement; qv.hidden = false; document.body.style.overflow = "hidden"; qv.scrollTop = 0; $("#qv-close").focus(); Sound.play("open"); };
    const closeQV = () => { if (qv.hidden) return; qv.hidden = true; document.body.style.overflow = ""; Sound.play("back"); qvOpener?.focus?.(); };
    $("#quick-btn").addEventListener("click", openQV);
    $("#qv-close").addEventListener("click", closeQV);
    $("#qv-print").addEventListener("click", () => window.print());
    addEventListener("keydown", (e) => { if (e.key === "Escape") closeQV(); });

    // site security note
    const sn = $("#secnote");
    $("#sec-link").addEventListener("click", () => { sn.hidden = false; Sound.play("open"); $("#sec-close").focus(); });
    const closeSN = () => { if (!sn.hidden) { sn.hidden = true; Sound.play("back"); $("#sec-link").focus(); } };
    $("#sec-close").addEventListener("click", closeSN);
    sn.addEventListener("click", (e) => { if (e.target === sn) closeSN(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") closeSN(); });
  })();

  /* ---------- clean layer: certification grid, more menu, footer links ---------- */
  (() => {
    const grid = $("#cert-grid");
    if (grid) {
      const ISSUER_COLORS = { CompTIA: "#c8102e", CrowdStrike: "#e01e2b", Microsoft: "#2b6fe0", GitHub: "#24292f" };
      grid.innerHTML = certs.map((c) => {
        const earned = !pending(c), color = ISSUER_COLORS[c.issuer] || "#24308a";
        const abbr = (/\(([^)]+)\)/.exec(c.title) || [])[1];
        const name = c.title.replace(/\s*\([^)]*\)\s*/g, " ").trim();
        return `<article class="cgrid-card reveal${earned ? " earned" : ""}">
          <div class="cg-top">
            <span class="cg-badge" style="--ic:${color}">${esc(({CompTIA:"CT",CrowdStrike:"CS",Microsoft:"MS",GitHub:"GH"})[c.issuer] || monogram(c.issuer || "?"))}</span>
            <span class="cg-status ${earned ? "ok" : ""}">${earned ? "✓ Earned" : "Currently studying"}</span>
          </div>
          <h3>${esc(name)}${abbr ? ` <small>${esc(abbr)}</small>` : ""}</h3>
          <div class="cg-issuer">${esc(c.issuer || "")}${earned && c.date ? ` · Earned ${esc(fmtDate(c.date))}` : ""}${!earned && (c.target || c.date) ? ` · Target ${esc(fmtDate(c.target || c.date))}` : ""}</div>
          ${c.description ? `<p>${esc(c.description)}</p>` : ""}
          <div class="cg-bar"><i style="width:${earned ? 100 : 45}%"></i></div>
          ${earned && c.verify ? `<a class="cg-verify" href="${esc(c.verify)}" target="_blank" rel="noopener">Verify credential →</a>` : ""}
        </article>`;
      }).join("");
      $$(".cgrid-card", grid).forEach((el, i) => { el.style.setProperty("--rd", (i % 3) * 70 + "ms"); window.__reveal && window.__reveal(el); });
    }
    // more menu
    const mb = $("#more-btn"), mp = $("#more-panel");
    const closeMore = () => { mp.hidden = true; mb.setAttribute("aria-expanded", "false"); };
    mb.addEventListener("click", (e) => { e.stopPropagation(); const open = mp.hidden; mp.hidden = !open; mb.setAttribute("aria-expanded", String(open)); });
    document.addEventListener("click", (e) => { if (!mp.hidden && !e.target.closest("#more")) closeMore(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") closeMore(); });
    $$("#more-panel .more-item").forEach((it) => it.addEventListener("click", () => { if (it.id !== "sound-btn" && it.id !== "fairy-toggle") closeMore(); }));
    const ss = $("#sound-state"), syncSound = () => { if (ss) ss.textContent = Sound.on ? "On" : "Off"; };
    $("#sound-btn").addEventListener("click", () => setTimeout(syncSound, 0)); syncSound();
    // footer links
    const fl = $("#foot-linkedin"), fr = $("#foot-resume");
    if (profile.links && profile.links.linkedin) fl.href = profile.links.linkedin; else fl.remove();
    if (profile.resume) fr.href = profile.resume; else fr.remove();
  })();

  /* ---------- detail window ---------- */
  const modal = $("#modal");
  let modalOpener = null;
  function openModal(title, html, opener) {
    modalOpener = opener || document.activeElement;
    $("#modal-title").textContent = title; $("#modal-body").innerHTML = html;
    modal.hidden = false; document.body.style.overflow = "hidden";
    Sound.play("open"); $(".close-btn", modal).focus();
  }
  function closeModal() {
    if (modal.hidden) return;
    if (modal.classList.contains("quest") && window.__shrinkTo && !modal.dataset.closing) {
      const card = modalOpener && modalOpener.isConnected && modalOpener.closest && modalOpener.closest(".pcard, .feat-card") ? modalOpener : null;
      if (card) { modal.dataset.closing = "1"; window.__shrinkTo(card, () => { delete modal.dataset.closing; closeModalNow(); }); return; }
    }
    closeModalNow();
  }
  function closeModalNow() {
    if (modal.hidden) return;
    modal.hidden = true; modal.classList.remove("quest"); document.body.style.overflow = "";
    delete modal.dataset.proj;
    if (/^#project\//.test(location.hash)) { try { history.replaceState(null, "", "#projects"); } catch (e) {} }
    Sound.play("back"); modalOpener?.focus?.();
  }
  modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest("[data-close]")) closeModal(); });

  /* ---------- image viewer ---------- */
  const lb = $("#lightbox");
  let lbImgs = [], lbIdx = 0, lbOpener = null;
  function thumbsHTML(imgs) {
    return `<div class="thumbs">${imgs.map((im, k) => `<button class="thumb" data-k="${k}" aria-label="View image ${k + 1}${im.caption ? ": " + esc(im.caption) : ""}"><img src="${esc(im.small)}" alt="${esc(im.caption)}" loading="lazy" decoding="async" style="background:url('${im.lqip}') center/cover${im.pos ? ";object-position:" + esc(im.pos) : ""}"></button>`).join("")}</div>`;
  }
  function wireThumbs(root, imgs) { $$(".thumb", root).forEach((b) => b.addEventListener("click", () => openLightbox(imgs, +b.dataset.k, b))); }
  function showLb() {
    const im = lbImgs[lbIdx];
    $("#lb-img").src = im.src; $("#lb-img").alt = im.caption;
    $("#lb-cap").textContent = im.caption + (lbImgs.length > 1 ? `  (${lbIdx + 1} / ${lbImgs.length})` : "");
    $("#lb-prev").hidden = $("#lb-next").hidden = lbImgs.length < 2;
  }
  function openLightbox(imgs, k, opener) { lbImgs = imgs; lbIdx = k; lbOpener = opener; showLb(); lb.hidden = false; Sound.play("select"); $("#lb-close").focus(); }
  function closeLightbox() { lb.hidden = true; Sound.play("back"); lbOpener?.focus?.(); }
  const lbStep = (d) => { lbIdx = (lbIdx + d + lbImgs.length) % lbImgs.length; Sound.play("move"); showLb(); };
  $("#lb-prev").addEventListener("click", () => lbStep(-1));
  $("#lb-next").addEventListener("click", () => lbStep(1));
  $("#lb-close").addEventListener("click", closeLightbox);
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", (e) => {
    if (!lb.hidden) {
      if (e.key === "Escape") closeLightbox(); else if (e.key === "ArrowLeft") lbStep(-1); else if (e.key === "ArrowRight") lbStep(1);
      return;
    }
    if (!modal.hidden) {
      if (e.key === "Escape") closeModal();
      if (modal.dataset.proj && (e.key === "ArrowRight" || e.key === "ArrowLeft") && !/input|textarea/i.test(document.activeElement.tagName)) {
        e.preventDefault(); Sound.play("move"); window.__qlStep = true; openProject(+modal.dataset[e.key === "ArrowRight" ? "next" : "prev"], modalOpener); modal.scrollTop = 0;
      }
      if (e.key === "Tab") {
        const f = $$("a, button", modal), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); return; }
    const atTop = window.scrollY < window.innerHeight * 0.4, idle = document.activeElement === document.body;
    if (atTop && idle && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); focusBar(barIdx + (e.key === "ArrowDown" ? 1 : -1)); }
    else if (atTop && idle && e.key === "Enter") { e.preventDefault(); Sound.play("select"); bars[barIdx].click(); }
  });

  /* =====================================================================
     QUALITY OF LIFE
     ===================================================================== */
  (() => {
    const qopen = (el, focusSel) => { el.hidden = false; document.body.style.overflow = "hidden"; el._opener = document.activeElement; ($(focusSel, el) || $("button", el))?.focus(); Sound.play("open"); };
    const qclose = (el) => { if (el.hidden) return; el.hidden = true; if (modal.hidden) document.body.style.overflow = ""; el._opener?.focus?.(); Sound.play("back"); };
    const pops = $$(".qol-overlay");
    pops.forEach((el) => el.addEventListener("click", (e) => { if (e.target === el || e.target.closest("[data-qclose]")) qclose(el); }));

    // 1. contact card with copy-email
    const cp = $("#contact-pop"), ctaUrl = (profile.cta && profile.cta.url) || "";
    const email = ctaUrl.startsWith("mailto:") ? decodeURIComponent(ctaUrl.slice(7).split("?")[0]) : "";
    if (email) {
      $("#cp-email").textContent = email; $("#cp-mail").href = ctaUrl;
      if (profile.links && profile.links.linkedin) $("#cp-li").href = profile.links.linkedin; else $("#cp-li").remove();
      const toast = $("#cp-toast");
      $("#cp-copy").addEventListener("click", async () => {
        let ok = false;
        try { await navigator.clipboard.writeText(email); ok = true; } catch (e) {
          const r = document.createRange(); r.selectNodeContents($("#cp-email")); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
          try { ok = document.execCommand("copy"); } catch (e2) {}
        }
        toast.textContent = ok ? "✓ Email copied to clipboard" : "Select the address above to copy it";
        $("#cp-copy").textContent = ok ? "Copied!" : "Copy email"; Sound.play("select");
        setTimeout(() => { $("#cp-copy").textContent = "Copy email"; toast.textContent = ""; }, 2400);
      });
      ["#cta", "#credits-contact"].forEach((sel) => { const a = $(sel); a && a.addEventListener("click", (e) => { e.preventDefault(); e.stopImmediatePropagation(); qopen(cp, "#cp-copy"); }, true); });
    }

    // 2. résumé viewer (desktop); phones open the PDF directly
    const rv = $("#resume-pop"), pdf = profile.resume;
    if (pdf) {
      $("#rv-open").href = pdf; $("#rv-dl").href = pdf;
      // the résumé is shown as page images (a PDF in a frame is blank on phones and when the site is opened from disk)
      const pages = profile.resumePages || [], box = $("#rv-pages");
      const fill = () => { if (box && !box.childElementCount) box.innerHTML = pages.map((src, i) => `<img src="${esc(src)}" alt="Brandon Restrepo résumé, page ${i + 1} of ${pages.length}" loading="lazy" decoding="async">`).join(""); };
      ["#resume-btn", "#foot-resume"].forEach((sel) => { const a = $(sel); a && a.addEventListener("click", (e) => {
        if (!pages.length || !box) return; e.preventDefault(); fill(); qopen(rv, "#rv-dl");
      }); });
    }

    // 3. shareable links (#project/slug) on load + hash change
    const route = () => { const m = /^#project\/(.+)$/.exec(location.hash); if (m && modal.hidden) window.__openProjectBySlug(decodeURIComponent(m[1])); };
    addEventListener("hashchange", route);
    if (/^#project\//.test(location.hash)) {
      const go = () => setTimeout(route, 250);
      if ($("#intro") && !$("#intro").hidden && document.documentElement.classList.contains("intro-active")) { $("#intro").hidden = true; document.documentElement.classList.remove("intro-active"); }
      go();
    }

    // 4. last updated
    if (profile.updated && $("#updated")) $("#updated").textContent = `Last updated ${fmtDate(profile.updated)} · `;

    // 6 + 7. back-to-top button and scroll progress
    const tt = $("#to-top"), bar = $("#scroll-progress i");
    let raf = 0;
    const onS = () => { raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight, y = scrollY;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      tt.classList.toggle("show", y > innerHeight * 1.2);
    };
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(onS); }, { passive: true }); onS();
    tt.addEventListener("click", () => { scrollTo({ top: 0, behavior: document.documentElement.classList.contains("calm") ? "auto" : "smooth" }); $("#logo")?.focus?.({ preventScroll: true }); Sound.play("back"); });

    // 8. keyboard shortcuts
    const kp = $("#keys-pop");
    $("#keys-btn")?.addEventListener("click", () => { $("#more-panel").hidden = true; qopen(kp); });
    addEventListener("keydown", (e) => {
      const open = pops.find((el) => !el.hidden);
      if (open) { if (e.key === "Escape") { e.preventDefault(); qclose(open); } return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/input|textarea|select/i.test(document.activeElement.tagName) || !modal.hidden || !lb.hidden || !$("#quick").hidden) return;
      if ($("#intro") && !$("#intro").hidden) return;
      const jump = { "1": "experience", "2": "projects", "3": "certifications" }[e.key];
      if (jump) { e.preventDefault(); document.getElementById(jump).scrollIntoView({ behavior: document.documentElement.classList.contains("calm") ? "auto" : "smooth" }); Sound.play("select"); }
      else if (e.key === "0") { e.preventDefault(); tt.click(); }
      else if (e.key === "/") { e.preventDefault(); const q = $("#proj-q"); document.getElementById("projects").scrollIntoView(); setTimeout(() => q && q.focus(), 300); }
      else if (e.key === "?") { e.preventDefault(); qopen(kp); }
    });

    // 10. mobile menu: close on outside tap or scroll
    document.addEventListener("click", (e) => { if (nav.classList.contains("open") && !e.target.closest("#nav")) { nav.classList.remove("open"); $("#menu-btn").setAttribute("aria-expanded", "false"); } });
    addEventListener("scroll", () => { if (nav.classList.contains("open") && innerWidth < 860) { nav.classList.remove("open"); $("#menu-btn").setAttribute("aria-expanded", "false"); } }, { passive: true });

    // 12 + 13. reduce motion (remembered)
    const sysCalm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let calm = sysCalm; // follows the device setting only (menu toggle removed)
    const applyCalm = () => { document.documentElement.classList.toggle("calm", calm); const s = $("#calm-state"); if (s) s.textContent = calm ? "On" : "Off"; };
    $("#calm-toggle")?.addEventListener("click", () => { calm = !calm; store.set("calm", calm); applyCalm(); Sound.play("select"); });
    applyCalm();

    // 14. photo viewer: swipe + tap/click to zoom
    const img = $("#lb-img"); let sx = 0, sy = 0, zoom = false;
    const unzoom = () => { zoom = false; img.classList.remove("zoomed"); img.style.transformOrigin = ""; };
    img.addEventListener("click", (e) => {
      zoom = !zoom; const r = img.getBoundingClientRect();
      img.style.transformOrigin = `${((e.clientX - r.left) / r.width * 100).toFixed(1)}% ${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`;
      img.classList.toggle("zoomed", zoom);
    });
    img.addEventListener("mousemove", (e) => { if (!zoom) return; const r = img.getBoundingClientRect(); img.style.transformOrigin = `${((e.clientX - r.left) / r.width * 100).toFixed(1)}% ${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`; });
    lb.addEventListener("touchstart", (e) => { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (zoom || e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) (dx < 0 ? $("#lb-next") : $("#lb-prev")).click();
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.4) $("#lb-close").click();
    }, { passive: true });
    ["#lb-next", "#lb-prev", "#lb-close"].forEach((s) => $(s).addEventListener("click", unzoom));
  })();

  /* =====================================================================
     BIG UPDATE · "Secure by design"
     ===================================================================== */
  (() => {
    const root = document.documentElement;
    const isCalm = () => root.classList.contains("calm") || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(pointer: fine)").matches;
    const EASE = "cubic-bezier(.2,.7,.2,1)";
    const DATA2 = window.PORTFOLIO || {};

    /* ---------- Twilight mode ---------- */
    const sysDark = matchMedia("(prefers-color-scheme: dark)");
    const themeState = () => { const s = $("#theme-state"); if (s) s.textContent = root.classList.contains("dark") ? "On" : "Off"; };
    const setTheme = (dark, save) => {
      root.classList.add("theme-anim"); root.classList.toggle("dark", dark); themeState();
      if (save) store.set("theme", dark ? "dark" : "light");
      setTimeout(() => root.classList.remove("theme-anim"), 450);
    };
    $("#theme-toggle")?.addEventListener("click", () => { setTheme(!root.classList.contains("dark"), true); Sound.play("select"); });
    // (always starts dark; the system light/dark setting no longer overrides it)
    themeState();

    /* ---------- section dots + sky shift + experience charge (one scroll loop) ---------- */
    const dots = $("#sec-dots"), sky = $(".sky-shift"), expList = $("#exp-list");
    let charge = null;
    let ticking = false;
    const frame = () => {
      ticking = false;
      const max = root.scrollHeight - innerHeight, y = scrollY;
      if (sky) sky.style.opacity = max > 0 ? (y / max).toFixed(3) : 0;
      dots.classList.toggle("show", y > innerHeight * .5);
      if (charge) {
        const r = expList.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (innerHeight * .75 - r.top) / (r.height || 1)));
        charge.style.transform = `scaleY(${p.toFixed(3)})`;
      }
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
    addEventListener("resize", frame, { passive: true }); frame();
    $$("a", dots).forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault(); const id = a.dataset.sec;
      if (id === "top") $("#to-top").click(); else warpTo(id, e);
    }));
    const dotObs = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) $$("a", dots).forEach((a) => a.classList.toggle("on", a.dataset.sec === e.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    ["top", "experience", "projects", "certifications"].forEach((id) => { const el = document.getElementById(id); el && dotObs.observe(el); });

    /* ---------- section entrances: title light-sweep once ---------- */
    const titleObs = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; titleObs.unobserve(e.target);
      if (isCalm()) return;
      const h = e.target; setTimeout(() => { h.classList.remove("sweep"); requestAnimationFrame(() => requestAnimationFrame(() => h.classList.add("sweep"))); setTimeout(() => h.classList.remove("sweep"), 900); }, 180);
    }), { threshold: .6 });
    $$(".sec-head h2").forEach((h) => titleObs.observe(h));

    /* ---------- certification "verifying…" reveal ---------- */
    const certObs = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; certObs.unobserve(e.target);
      const card = e.target, st = $(".cg-status", card), final = st ? st.innerHTML : "";
      const delay = (+(card.dataset.k || 0) % 3) * 140;
      if (isCalm() || !st) { card.classList.add("verified"); return; }
      card.classList.add("verifying"); st.innerHTML = '<span class="spin" aria-hidden="true"></span>Verifying…';
      setTimeout(() => { card.classList.remove("verifying"); card.classList.add("verified"); st.innerHTML = final; }, 650 + delay);
    }), { threshold: .35 });
    $$(".cgrid-card").forEach((c, k) => { c.dataset.k = k; certObs.observe(c); });

    /* ---------- case study grows out of its card ---------- */
    const win = () => $(".modal-window", modal);
    const rectInset = (r) => `inset(${Math.max(0, r.top)}px ${Math.max(0, innerWidth - r.right)}px ${Math.max(0, innerHeight - r.bottom)}px ${Math.max(0, r.left)}px round 16px)`;
    window.__growFrom = (card) => {
      if (isCalm()) return;
      const r = card.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const w = win(); if (!w || !w.animate) return;
      w.animate([{ clipPath: rectInset(r), opacity: .6 }, { clipPath: "inset(0px 0px 0px 0px round 0px)", opacity: 1 }], { duration: 420, easing: EASE });
      $$(".ql-hero, .ql-grid", w).forEach((el, k) => el.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 380, delay: 120 + k * 70, easing: EASE, fill: "backwards" }));
    };
    window.__shrinkTo = (card, done) => {
      const w = win(); const r = card.getBoundingClientRect();
      if (isCalm() || !w || !w.animate || r.bottom < 0 || r.top > innerHeight) return done();
      const a = w.animate([{ clipPath: "inset(0px 0px 0px 0px round 0px)", opacity: 1 }, { clipPath: rectInset(r), opacity: .4 }], { duration: 300, easing: "cubic-bezier(.4,0,.6,1)" });
      modal.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: "ease" });
      a.onfinish = done;
    };

    /* ---------- tilt + glass shine on cards ---------- */
    if (fine) {
      let tEl = null, tx = 0, ty = 0, traf = 0;
      const sel = ".pcard, .feat-card, .cgrid-card";
      const paint = () => {
        traf = 0; if (!tEl) return;
        const r = tEl.getBoundingClientRect(), px = (tx - r.left) / r.width, py = (ty - r.top) / r.height;
        const k = tEl.classList.contains("feat-card") ? 2.5 : 5;
        tEl.style.setProperty("--rx", ((.5 - py) * k).toFixed(2) + "deg"); tEl.style.setProperty("--ry", ((px - .5) * k).toFixed(2) + "deg");
        tEl.style.setProperty("--mx", (px * 100).toFixed(1) + "%"); tEl.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      };
      document.addEventListener("pointermove", (e) => {
        if (isCalm()) return;
        const el = e.target.closest && e.target.closest(sel);
        if (el !== tEl) { if (tEl) tEl.classList.remove("tilt"); tEl = el; if (el) el.classList.add("tilt"); }
        tx = e.clientX; ty = e.clientY; if (tEl && !traf) traf = requestAnimationFrame(paint);
      }, { passive: true });
      document.addEventListener("pointerleave", () => { if (tEl) tEl.classList.remove("tilt"); tEl = null; });
    }

    /* ---------- magnetic buttons ---------- */
    if (fine) {
      $$(".btn-cta, .pill-btn, .to-top, .more-btn").forEach((b) => {
        b.addEventListener("pointermove", (e) => {
          if (isCalm()) return; const r = b.getBoundingClientRect();
          b.style.translate = `${((e.clientX - r.left - r.width / 2) * .18).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .28).toFixed(1)}px`;
        });
        b.addEventListener("pointerleave", () => { b.style.translate = ""; });
      });
    }

    /* ---------- click ripple ("ping") ---------- */
    const RIP = ".btn-cta, .pill-btn, .filter, .pcard, .feat-card, .cgrid-card, .menu-bar, .more-item, .ql-step, .chip-link, .cp-copy";
    document.addEventListener("pointerdown", (e) => {
      if (isCalm()) return;
      const host = e.target.closest && e.target.closest(RIP); if (!host) return;
      const r = host.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2;
      const rp = document.createElement("span"); rp.className = "ripple";
      rp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
      host.classList.add("rip-host"); host.appendChild(rp); setTimeout(() => rp.remove(), 650);
    }, { passive: true });

    /* ---------- tool chips filter the projects ---------- */
    const hay = (p) => [p.title, p.summary, p.type, ...(p.tools || [])].join(" ").toLowerCase();
    const toolHits = (t) => projects.filter((p) => (p.tools || []).some((x) => x.toLowerCase() === t.toLowerCase()) || hay(p).includes(t.toLowerCase())).length;
    const filterByTool = (t) => {
      const q = $("#proj-q"); if (q) q.value = t; window.__projQ = t;
      const fAll = $('#project-filters .filter[data-type="All"]'); if (fAll && fAll.getAttribute("aria-pressed") !== "true") fAll.click(); else renderCards();
      if (!modal.hidden) closeModalNow();
      warpTo("projects", null);
    };
    const markChips = (rootEl) => $$(".pc-tools i, .feat-tools i, .sg-chips > *, .pc-chips > *", rootEl || document).forEach((c) => {
      if (c.dataset.tool || c.closest(".pc-chips")) return;
      const t = c.textContent.trim(); if (t && toolHits(t)) { c.dataset.tool = t; c.classList.add("chip-link"); c.title = `Show projects using ${t}`; }
    });
    markChips();
    new MutationObserver(() => markChips()).observe($("#card-grid"), { childList: true });
    new MutationObserver(() => markChips()).observe($("#featured"), { childList: true });
    const rc = $("#role-card"); rc && new MutationObserver(() => markChips(rc)).observe(rc, { childList: true, subtree: true });
    document.addEventListener("click", (e) => {
      const c = e.target.closest && e.target.closest(".chip-link[data-tool]"); if (!c) return;
      e.preventDefault(); e.stopPropagation(); Sound.play("select"); filterByTool(c.dataset.tool);
    }, true);

    /* ---------- title-screen network: faint links between stars + packets ---------- */
    const net = $("#hero-net");
    if (net) {
      const P = [[6, 18], [18, 8], [30, 22], [44, 12], [58, 6], [72, 16], [90, 10], [96, 30], [84, 40], [64, 34], [10, 62], [24, 74], [6, 90], [46, 92], [70, 84], [92, 70]];
      const L = []; P.forEach((a, i) => P.forEach((b, j) => { if (j > i && Math.hypot(a[0] - b[0], (a[1] - b[1]) * .6) < 20) L.push([i, j]); }));
      net.setAttribute("viewBox", "0 0 100 100");
      net.innerHTML = L.map(([i, j]) => `<line x1="${P[i][0]}" y1="${P[i][1]}" x2="${P[j][0]}" y2="${P[j][1]}" vector-effect="non-scaling-stroke"/>`).join("");
      const host = net.parentElement; const live = [];
      const send = (i, j, dur) => {
        if (isCalm() || document.body.classList.contains("hero-off")) return;
        const d = document.createElement("i"); d.className = "net-packet"; host.appendChild(d);
        const a = d.animate([{ left: P[i][0] + "%", top: P[i][1] + "%", opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .8 }, { left: P[j][0] + "%", top: P[j][1] + "%", opacity: 0 }], { duration: dur, easing: "ease-in-out" });
        a.onfinish = () => d.remove();
      };
      const loop = () => { if (!document.hidden && L.length) { const [i, j] = L[(Math.random() * L.length) | 0]; Math.random() < .5 ? send(i, j, 2600) : send(j, i, 2600); } setTimeout(loop, 1400); };
      setTimeout(loop, 1200);
      // hovering a title-menu bar pings the network from the nearest node
      $$(".menu-bar").forEach((b) => b.addEventListener("pointerenter", () => {
        const hr = host.getBoundingClientRect(), br = b.getBoundingClientRect();
        const bx = (br.right - hr.left) / hr.width * 100, by = (br.top + br.height / 2 - hr.top) / hr.height * 100;
        let best = 0; P.forEach((p, k) => { if (Math.hypot(p[0] - bx, p[1] - by) < Math.hypot(P[best][0] - bx, P[best][1] - by)) best = k; });
        L.filter(([i, j]) => i === best || j === best).slice(0, 3).forEach(([i, j]) => send(best, i === best ? j : i, 1100));
      }));
    }

    /* ---------- live security report ---------- */
    const checks = $("#sec-checks");
    const runChecks = async () => {
      const out = [];
      const add = (ok, title, detail) => out.push({ ok, title, detail });
      const https = location.protocol === "https:";
      add(https ? "pass" : "info", "Encrypted connection (HTTPS)", https ? "This page was delivered over TLS." : "You're viewing a local or preview copy; the live site is served over HTTPS.");
      const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      let hdr = null;
      try { const r = await fetch(location.href.split("#")[0], { method: "HEAD", cache: "no-store" }); hdr = r.headers; } catch (e) {}
      const hCsp = hdr && hdr.get("content-security-policy");
      add(csp || hCsp ? "pass" : "info", "Content Security Policy", csp || hCsp ? `Active: ${((csp ? csp.content : hCsp).match(/script-src [^;]+/) || ["scripts restricted"])[0]}. Only this site's own scripts can run.` : "Set by the host when deployed.");
      const hsts = hdr && hdr.get("strict-transport-security");
      add(hsts ? "pass" : "info", "HSTS", hsts ? `Browsers must always use HTTPS here (${hsts.split(";")[0]}).` : "Enabled by the host's response headers on the live site.");
      const xfo = hdr && (hdr.get("x-frame-options") || (hCsp || "").includes("frame-ancestors"));
      add(xfo ? "pass" : "info", "Clickjacking protection", xfo ? "Other sites can't embed this page in a frame." : "Enabled by the host's response headers on the live site.");
      const scripts = $$("script[src]").filter((s) => new URL(s.src, location.href).origin !== location.origin);
      add(scripts.length ? "warn" : "pass", "No third-party JavaScript", scripts.length ? `${scripts.length} external script(s) found.` : `All ${$$("script[src]").length} scripts are served from this site.`);
      const origins = [...new Set(performance.getEntriesByType("resource").map((r) => { try { return new URL(r.name).origin; } catch (e) { return ""; } }).filter((o) => o && o !== location.origin && o !== "null"))];
      add(origins.every((o) => /fonts\.(googleapis|gstatic)\.com/.test(o)) ? "pass" : "info", "No trackers or analytics", origins.length ? `Outside requests: ${origins.map((o) => o.replace("https://", "")).join(", ")} (typography only).` : "This page made no requests to other sites.");
      add(document.cookie === "" ? "pass" : "warn", "No cookies", document.cookie === "" ? "This site sets no cookies." : "Cookies are present.");
      let keys = []; try { keys = Object.keys(localStorage).filter((k) => k.startsWith("chron.")); } catch (e) {}
      add("pass", "Your data stays with you", `Only ${keys.length} preference${keys.length === 1 ? "" : "s"} (like sound or theme) stored in your own browser. No forms, no data collection.`);
      const unsafe = $$('a[target="_blank"]').filter((a) => !/noopener|noreferrer/.test(a.rel));
      add(unsafe.length ? "warn" : "pass", "Safe external links", unsafe.length ? `${unsafe.length} link(s) missing noopener.` : `Every link that opens a new tab uses noopener.`);
      let st = false; try { const r = await fetch(".well-known/security.txt", { method: "GET", cache: "no-store" }); st = r.ok; } catch (e) {}
      add(st ? "pass" : "info", "Responsible disclosure", st ? "security.txt is published at /.well-known/security.txt." : "security.txt ships with the site at /.well-known/security.txt.");
      add(navigator.serviceWorker && navigator.serviceWorker.controller ? "pass" : "info", "Offline-ready", navigator.serviceWorker && navigator.serviceWorker.controller ? "A same-origin service worker caches the site for offline viewing." : "Offline caching turns on once the site is served over HTTPS.");
      checks.innerHTML = out.map((c, k) => `<li class="sc ${c.ok}" style="--d:${k * 60}ms"><span class="sc-ico" aria-hidden="true">${c.ok === "pass" ? "✓" : c.ok === "warn" ? "!" : "i"}</span><div><b>${esc(c.title)}</b><span>${esc(c.detail)}</span></div></li>`).join("");
      const passed = out.filter((c) => c.ok === "pass").length;
      checks.insertAdjacentHTML("afterbegin", `<li class="sc-score"><b>${passed}/${out.length}</b> checks passing in this browser</li>`);
    };
    $("#sec-link")?.addEventListener("click", () => { checks.innerHTML = '<li class="sc-loading"><span class="spin"></span>Running checks…</li>'; setTimeout(runChecks, 250); });

    /* ---------- terminal ---------- */
    const tp = $("#term-pop"), tout = $("#term-out"), tin = $("#term-in");
    const hist = []; let hi = 0;
    const line = (text, cls) => { const d = document.createElement("div"); d.className = "tl" + (cls ? " " + cls : ""); d.textContent = text; tout.appendChild(d); return d; };
    const linkLine = (label, fn) => { const b = document.createElement("button"); b.className = "tl tl-btn"; b.textContent = label; b.addEventListener("click", fn); tout.appendChild(b); };
    const openTerm = () => {
      if (!tp.hidden) return; tp.hidden = false; document.body.style.overflow = "hidden";
      if (!tout.childElementCount) { line(`${profile.name || "Brandon"} · ${profile.className || ""}`, "tl-head"); line('Type "help" to see what you can do. Tip: Tab completes commands.', "tl-dim"); }
      setTimeout(() => tin.focus(), 30); Sound.play("open");
    };
    const closeTerm = () => { if (tp.hidden) return; tp.hidden = true; document.body.style.overflow = ""; Sound.play("back"); };
    tp.addEventListener("click", (e) => { if (e.target === tp || e.target.closest("[data-qclose]")) closeTerm(); });
    $("#term-btn")?.addEventListener("click", () => { $("#more-panel").hidden = true; openTerm(); });
    $("#term-link")?.addEventListener("click", openTerm);
    const roles = (DATA2.experience || []).slice().reverse();
    const CMDS = {
      help: () => ["Commands:", "  ctf           🏴 find the 3 hidden flags", "  whoami        who I am", "  about         short bio", "  experience    roles, newest first", "  projects      list projects  ·  open <n>", "  certs         certifications", "  contact       how to reach me", "  resume        open my résumé", "  linkedin      open LinkedIn", "  theme <dark|light>", "  intro         replay the intro", "  ls · cd <section> · clear · exit"].forEach((l) => line(l)),
      whoami: () => line(`${profile.name} · ${profile.className} · ${profile.location || ""}`),
      about: () => { line(profile.about || ""); if (profile.personal) line(profile.personal, "tl-dim"); },
      experience: () => roles.forEach((r) => line(`• ${r.role}${r.company ? " @ " + r.company : ""}  (${r.from ? r.from + " → " + (r.to || "present") : r.dateLabel || ""})`)),
      projects: () => { pList.forEach((p, k) => line(`${String(k + 1).padStart(2, " ")}. ${p.title}  [${p.type}]`)); line('Type "open 1" (or a name) to read one.', "tl-dim"); },
      open: (arg) => {
        const n = parseInt(arg, 10); const p = !isNaN(n) ? pList[n - 1] : pList.find((x) => x.title.toLowerCase().includes((arg || "").toLowerCase()));
        if (!arg || !p) return line("usage: open <number|name>", "tl-err");
        line(`opening "${p.title}"…`, "tl-ok"); setTimeout(() => { closeTerm(); openProject(p._i); }, 350);
      },
      certs: () => certs.forEach((c) => line(`${c.status === "earned" ? "✓" : "…"} ${c.title}  (${c.status === "earned" ? "earned" : "currently studying"})`)),
      contact: () => { const em = ((profile.cta || {}).url || "").replace("mailto:", ""); line(`email: ${em}`); linkLine("→ open contact card", () => { closeTerm(); $("#cta")?.click(); }); },
      resume: () => { line("opening résumé…", "tl-ok"); setTimeout(() => { closeTerm(); $("#resume-btn")?.click(); }, 300); },
      linkedin: () => { const u = profile.links && profile.links.linkedin; if (u) { line("opening LinkedIn in a new tab…", "tl-ok"); window.open(u, "_blank", "noopener"); } else line("not set", "tl-err"); },
      intro: () => { line("rebooting sentinel…", "tl-ok"); setTimeout(() => window.__replayIntro(), 500); },
      theme: (arg) => { const d = arg === "dark" ? true : arg === "light" ? false : !root.classList.contains("dark"); setTheme(d, true); line(`theme: ${d ? "dark (twilight)" : "light"}`, "tl-ok"); },
      ls: (arg) => line((/-\w*a/.test(arg || "") ? ".  ..  .vault  " : "") + "experience/  projects/  certifications/  resume.pdf"),
      cd: (arg) => { const id = { experience: "experience", projects: "projects", certifications: "certifications", certs: "certifications", "~": "top", "..": "top" }[(arg || "").replace(/\/$/, "")]; if (!id) return line(`cd: no such section: ${arg || ""}`, "tl-err"); closeTerm(); setTimeout(() => id === "top" ? $("#to-top").click() : warpTo(id, null), 200); },
      nmap: () => { line("Starting scan of brandon.portfolio…"); line("443/tcp   open      https (portfolio)"); line("22/tcp    filtered  nice try 🙂"); line("All other ports filtered. Host is hardened.", "tl-ok"); },
      sudo: (arg) => { if (/hire/.test(arg || "")) { line("[sudo] permission granted. Great choice.", "tl-ok"); setTimeout(() => { closeTerm(); $("#cta")?.click(); }, 600); } else line("sudo: you are not in the sudoers file. This incident will be reported.", "tl-err"); },
      clear: () => { tout.innerHTML = ""; },
      exit: () => closeTerm(),
      date: () => line(new Date().toString()),
      echo: (arg) => line(arg || "")
    };
    CMDS.cat = (a) => {
      if (/^\.?\/?\.vault$/.test((a || "").trim())) { line("SYNT{te3c_gu3_g3ez1a4y}", "tl-ok"); line("hmm… looks like it's been rotated. 13 times, maybe.", "tl-dim"); return; }
      if (/resume/.test(a || "")) return CMDS.resume();
      line(`cat: ${a || ""}: try "about" or "resume"`, "tl-err");
    };
    /* ---------- capture the flag: 3 flags hidden in the source, robots.txt and this terminal ---------- */
    const FLAGS = [[1254236637, "the page source", "Every page has a source. Read it."], [436086557, "robots.txt", "Robots are told where not to look, and their instructions are public."], [591083135, "the terminal", "Not every file here is listed. Some are hidden (think: ls -a)."]];
    const got = () => { const g = store.get("ctf", []); return Array.isArray(g) ? g : []; };
    CMDS.ctf = () => {
      const g = got();
      line("🏴 CAPTURE THE FLAG · " + g.length + "/3 found", "tl-head");
      line("Three flags look like FLAG{...}. Find them, then: submit FLAG{...}", "tl-dim");
      FLAGS.forEach(([, where, hint], k) => line(g.includes(k) ? `  [✓] flag ${k + 1}: found in ${where}` : `  [ ] flag ${k + 1}: ${hint}`, g.includes(k) ? "tl-ok" : ""));
    };
    const ctfWin = () => {
      Sound.play("start");
      for (let i = 0; i < 46; i++) {
        const s = document.createElement("span"); s.className = "confetti" + (Math.random() < .35 ? " gold" : "");
        s.innerHTML = '<svg viewBox="0 0 20 20"><use href="#shard-c"/></svg>';
        const a = Math.random() * Math.PI * 2, d = 140 + Math.random() * 400;
        s.style.cssText = `--bx:${(Math.cos(a) * d).toFixed(0)}px;--by:${(Math.sin(a) * d).toFixed(0)}px;--w:${(10 + Math.random() * 18).toFixed(0)}px;--dl:${(Math.random() * .25).toFixed(2)}s;z-index:400`;
        document.body.appendChild(s); setTimeout(() => s.remove(), 1800);
      }
      line("🏆 ALL 3 FLAGS CAPTURED", "tl-head");
      line("Source code, recon, and a little crypto. You think like an analyst.", "tl-ok");
      const mail = ((profile.cta || {}).url || "").split("?")[0];
      if (/^mailto:/.test(mail)) linkLine("→ tell me you did it (opens email)", () => { location.href = mail + "?subject=" + encodeURIComponent("I captured all 3 flags 🏴") + "&body=" + encodeURIComponent("Hi Brandon, I found all three flags on your portfolio."); });
      tout.scrollTop = tout.scrollHeight;
    };
    CMDS.submit = (arg) => {
      const f = (arg || "").trim().replace(/^flag\{/i, "FLAG{"); if (!f) return line("usage: submit FLAG{...}", "tl-err");
      const k = FLAGS.findIndex(([h]) => h === hash(f));
      if (k < 0) return line(/^SYNT\{/i.test(f) ? "✗ close! that one still needs decoding." : "✗ not a valid flag. keep digging.", "tl-err");
      const g = got(); if (g.includes(k)) return line(`flag ${k + 1} already captured ✓`, "tl-dim");
      g.push(k); store.set("ctf", g); Sound.play("select");
      line(`✓ flag ${k + 1}/3 captured: ${FLAGS[k][1]}`, "tl-ok");
      if (g.length === 3) setTimeout(ctfWin, 250); else line(`${3 - g.length} to go. type "ctf" for hints.`, "tl-dim");
    };
    try { console.log("%c🏴 psst, fellow curious one: 3 flags are hidden on this site.%c\nPress ~ (or ⋯ → Terminal) and type  ctf  for hints.", "font:700 14px ui-monospace,monospace;color:#56e39a;background:#0b1030;padding:6px 10px;border-radius:6px", "font:12px ui-monospace,monospace;color:#7fa6ff"); } catch { /* ignore */ }
    const run = (raw) => {
      const v = raw.trim(); line(`brandon@portfolio:~$ ${v}`, "tl-cmd"); if (!v) return;
      hist.push(v); hi = hist.length;
      const [c, ...rest] = v.split(/\s+/); const fn = CMDS[c.toLowerCase()];
      if (fn) fn(rest.join(" ")); else line(`command not found: ${c}. Type "help".`, "tl-err");
      tout.scrollTop = tout.scrollHeight;
    };
    $("#term-form").addEventListener("submit", (e) => { e.preventDefault(); run(tin.value); tin.value = ""; tout.scrollTop = tout.scrollHeight; });
    tin.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") { e.preventDefault(); if (hi > 0) tin.value = hist[--hi]; }
      else if (e.key === "ArrowDown") { e.preventDefault(); hi = Math.min(hist.length, hi + 1); tin.value = hist[hi] || ""; }
      else if (e.key === "Tab") { e.preventDefault(); const m = Object.keys(CMDS).filter((k) => k.startsWith(tin.value.trim())); if (m.length === 1) tin.value = m[0] + " "; else if (m.length) line(m.join("  "), "tl-dim"); }
      else if (e.key === "Escape") { e.preventDefault(); closeTerm(); }
      else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); tout.innerHTML = ""; }
    });
    addEventListener("keydown", (e) => {
      if ((e.key === "~" || e.key === "`") && tp.hidden && !/input|textarea/i.test(document.activeElement.tagName) && modal.hidden) { e.preventDefault(); openTerm(); }
    });

    /* ---------- tooltips for icon-only buttons ---------- */
    [["#more-btn", "More options"], ["#to-top", "Back to top"], ["#menu-btn", "Menu"]].forEach(([s, t]) => { const el = $(s); if (el) el.dataset.tip = t; });

    /* ---------- offline / installable (HTTPS or localhost only) ---------- */
    let topLevel = false; try { topLevel = window.top === window; } catch (e) {}
    if (topLevel && "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
    }
  })();

  /* ---------- subtle code rain in the side margins ---------- */
  (() => {
    const cl = $("#rain-l"), cr = $("#rain-r"); if (!cl || !cr || !cl.getContext) return;
    const root = document.documentElement;
    const SNIPS = ["nmap -sV 10.0.0.0/24", "ssh -p 22 admin@fw01", "ACL permit tcp any 443", "tls1.3 handshake ok", "dig +short pi.hole",
      "vlan 20 name SECURE", "0x1F4A 0xC0DE 0x7F00", "sha256 9f86d081", "deny ip any any log", "Get-MgUser -All", "falcon sensor: ok",
      "wazuh alert lvl 7", "chmod 600 id_ed25519", "iptables -A INPUT", "curl -I https", "MFA enforced: true", "CSP script-src self",
      "patch KB5031356", "ping 1.1.1.1 12ms", "SYN SYN-ACK ACK", "port 23 closed", "dns query blocked", "audit pass 100%", "101101 001011"];
    const FONT = 12, ROW = 15;
    let cols = [], w = 0, h = 0, dpr = 1, raf = 0, last = 0, running = false, ctxs = [];
    const fit = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      const margin = Math.max(0, (innerWidth - 1168) / 2);
      w = innerWidth < 760 ? 14 : Math.min(150, Math.max(18, margin - 8)); h = innerHeight;
      [cl, cr].forEach((c) => { c.width = w * dpr; c.height = h * dpr; c.style.width = w + "px"; c.style.height = h + "px"; });
      ctxs = [cl, cr].map((c) => { const x = c.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.font = `${innerWidth < 760 ? 10 : FONT}px ui-monospace, Menlo, Consolas, monospace`; x.textBaseline = "top"; return x; });
      const per = innerWidth < 760 ? 1 : Math.max(1, Math.floor(w / 22));
      cols = [];
      [0, 1].forEach((side) => { for (let k = 0; k < per; k++) cols.push(newCol(side, k, per, true)); });
    };
    const newCol = (side, k, per, initial) => {
      const s = SNIPS[(Math.random() * SNIPS.length) | 0];
      const up = Math.random() < .4;
      const len = s.length * ROW;
      return { side, x: per === 1 ? (innerWidth < 760 ? 2 : (w - FONT) / 2) : 4 + k * ((w - FONT - 8) / Math.max(1, per - 1)), s, up,
        y: initial ? Math.random() * (h + len) - len : (up ? h + 10 : -len), v: (12 + Math.random() * 16) * (up ? -1 : 1), k, per };
    };
    const draw = (t) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 50) return; // ~20 fps is plenty for a slow drift
      const dt = Math.min(.1, (t - last) / 1000); last = t;
      const dark = root.classList.contains("dark");
      const rgb = dark ? "127,166,255" : "43,85,214", base = dark ? .22 : .14;
      ctxs.forEach((c) => c.clearRect(0, 0, w, h));
      cols.forEach((c, i) => {
        c.y += c.v * dt;
        const len = c.s.length * ROW;
        if ((!c.up && c.y > h) || (c.up && c.y + len < 0)) { cols[i] = newCol(c.side, c.k, c.per, false); return; }
        const ctx = ctxs[c.side];
        for (let n = 0; n < c.s.length; n++) {
          const ch = c.s[n]; if (ch === " ") continue;
          const yy = c.y + n * ROW; if (yy < -ROW || yy > h) continue;
          const lead = c.up ? n === 0 : n === c.s.length - 1;           // the "head" of the stream
          const fade = c.up ? 1 - n / c.s.length : (n + 1) / c.s.length; // trail fades behind the head
          ctx.fillStyle = `rgba(${rgb},${(lead ? base * 2.2 : base * (.25 + fade * .75)).toFixed(3)})`;
          ctx.fillText(ch, c.x, yy);
        }
      });
    };
    const want = () => !root.classList.contains("calm") && !matchMedia("(prefers-reduced-motion: reduce)").matches && !document.hidden && document.body.classList.contains("hero-off");
    const sync = () => {
      const on = want();
      document.body.classList.toggle("rain-on", on);
      if (on && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(draw); }
      else if (!on && running) { running = false; cancelAnimationFrame(raf); }
    };
    fit(); addEventListener("resize", () => { fit(); }, { passive: true });
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("visibilitychange", sync); sync();
  })();

  /* ---------- personality: mascots + signature ---------- */
  (() => {
    const root = document.documentElement;
    const calm = () => root.classList.contains("calm") || matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Shinx peeks over the certification cards when they come into view
    const sp = $("#shinx-peek"), say = $("#shinx-say");
    if (sp) {
      new IntersectionObserver((es) => es.forEach((e) => sp.classList.toggle("up", e.isIntersecting)), { threshold: .2 }).observe($("#cert-grid"));
      const LINES = ["Studying hard!", "Security+ next!", "Zzz… wait, I'm awake!", "Shinx approves ✦", "Hire him!", "Bzzt! ⚡"];
      let li = 0, t;
      sp.addEventListener("click", () => {
        say.textContent = LINES[li++ % LINES.length]; sp.classList.remove("hop"); void sp.offsetWidth; sp.classList.add("hop", "talk");
        Sound.play("select"); clearTimeout(t); t = setTimeout(() => sp.classList.remove("talk"), 2200);
      });
    }

    // the signature writes itself in when the footer shows
    const sig = $(".signature");
    if (sig) new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { sig.classList.add("write"); o.disconnect(); } }), { threshold: .6 }).observe(sig);

    // Cutiefly: hovers in the margin once you leave the title screen, and flies to where you click
    const cb = $("#cutie-buddy");
    if (cb && cb.animate) {
      let x = innerWidth - 90, y = innerHeight * .62, home = true, idle, bob;
      const place = () => { cb.style.transform = `translate3d(${x}px, ${y}px, 0)`; };
      const homeSpot = () => innerWidth < 760 ? { x: innerWidth + 30, y: innerHeight * .55 } : { x: innerWidth - 110, y: innerHeight * .62 };
      const fly = (tx, ty, dur) => {
        const sx = x, sy = y, cx = (sx + tx) / 2 + (Math.random() * 120 - 60), cy = Math.min(sy, ty) - 80;
        cb.classList.toggle("flip", tx > sx);
        const steps = 24, kf = [];
        for (let i = 0; i <= steps; i++) { const u = i / steps, a = 1 - u; kf.push({ transform: `translate3d(${a * a * sx + 2 * a * u * cx + u * u * tx}px, ${a * a * sy + 2 * a * u * cy + u * u * ty}px, 0)` }); }
        x = tx; y = ty; cb.animate(kf, { duration: dur, easing: "cubic-bezier(.3,.6,.3,1)" }); place();
      };
      const visible = () => document.body.classList.contains("hero-off") && !calm();
      const sync = () => { cb.classList.toggle("show", visible()); };
      new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["class"] });
      new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["class"] });
      const h0 = homeSpot(); x = h0.x; y = h0.y; place(); sync();
      addEventListener("resize", () => { if (home) { const h = homeSpot(); x = h.x; y = h.y; place(); } }, { passive: true });
      window.__cutieVisit = (tx, ty) => {
        if (!visible() || !home) return false;
        home = false; fly(tx - 26, ty - 44, 1500);
        clearTimeout(idle); idle = setTimeout(() => { const h = homeSpot(); home = true; fly(h.x, h.y, 1300); }, 4500); return true;
      };
      document.addEventListener("click", (e) => {
        if (!visible() || e.target.closest("a, button, input, .pcard, .feat-card, .overlay, .qol-overlay, .modal, .term")) return;
        home = false; fly(e.clientX - 26, e.clientY - 40, 700);
        clearTimeout(idle); idle = setTimeout(() => { const h = homeSpot(); home = true; fly(h.x, h.y, 1100); }, 6000);
      });
    }
  })();

  /* ---------- living section backgrounds: sky · glow · clouds · shards · network · depth ---------- */
  (() => {
    const root = document.documentElement;
    const calm = () => root.classList.contains("calm") || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = innerWidth < 760;
    const SECS = [
      { el: $("#experience"), sky: "morning", stars: ["star-soft", "star-soft", "star-gold"] },
      { el: $("#projects"), sky: "golden", stars: ["star-ember", "star-gold", "star-ember"] },
      { el: $("#certifications"), sky: "twilight", stars: ["star-violet", "star-gold", "star-violet", "star-soft"] },
      { el: $(".footer"), sky: "night", stars: ["star-soft", "star-gold", "star-violet"] }
    ].filter((s) => s.el);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const layers = [];
    SECS.forEach((s, si) => {
      const sec = s.el; sec.classList.add("has-bg"); sec.dataset.sky = s.sky;
      const bg = document.createElement("div"); bg.className = "sec-bg"; bg.setAttribute("aria-hidden", "true");
      // network lines behind the header
      const P = [[4, 6], [16, 3], [27, 10], [40, 4], [55, 8], [68, 3], [80, 9], [93, 5], [97, 16], [62, 15], [34, 15], [10, 14]];
      const L = []; P.forEach((a, i) => P.forEach((b, k) => { if (k > i && Math.hypot(a[0] - b[0], (a[1] - b[1]) * 2) < 18) L.push([i, k]); }));
      const n = (small ? 4 : 10) + (s.sky === "night" || s.sky === "twilight" ? (small ? 2 : 4) : 0);
      let parts = "";
      for (let i = 0; i < n; i++) {
        const glass = Math.random() < .3, sz = glass ? rnd(12, 20) : rnd(14, 26);
        const sym = glass ? `glass-${1 + (i % 3)}` : s.stars[i % s.stars.length];
        parts += `<span class="sb-p ${glass ? "g" : "s"}" style="left:${rnd(2, 98).toFixed(1)}%;top:${rnd(12, 92).toFixed(1)}%;--w:${sz.toFixed(0)}px;--d:${rnd(16, 30).toFixed(1)}s;--dl:${(-rnd(0, 30)).toFixed(1)}s;--dx:${rnd(-30, 30).toFixed(0)}px;--tw:${rnd(2, 4.5).toFixed(2)}s"><svg class="sbp-g"><use href="#${sym}"/></svg></span>`;
      }
      bg.innerHTML = `<div class="sb-sky"></div>
        <div class="sb-glow"><i></i><i></i></div>
        <svg class="sb-net" viewBox="0 0 100 20" preserveAspectRatio="none">${L.map(([i, k]) => `<line x1="${P[i][0]}" y1="${P[i][1]}" x2="${P[k][0]}" y2="${P[k][1]}" vector-effect="non-scaling-stroke"/>`).join("")}</svg>
        <div class="sb-parts">${parts}</div>`;
      sec.prepend(bg);
      // cloud bank dividing this section from the one above
      const cl = document.createElement("div"); cl.className = "sec-clouds"; cl.setAttribute("aria-hidden", "true"); cl.innerHTML = '<i class="sc-i"></i>';
      sec.prepend(cl);
      layers.push({ sec, bg, glow: $(".sb-glow", bg), parts: $(".sb-parts", bg), net: $(".sb-net", bg), P, L, live: false });
    });

    // only animate sections that are on screen
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const l = layers.find((x) => x.sec === e.target); if (!l) return;
      l.live = e.isIntersecting; e.target.classList.toggle("bg-live", e.isIntersecting && !calm());
    }), { rootMargin: "120px 0px" });
    layers.forEach((l) => io.observe(l.sec));
    new MutationObserver(() => layers.forEach((l) => l.sec.classList.toggle("bg-live", l.live && !calm()))).observe(root, { attributes: true, attributeFilter: ["class"] });

    // depth: glow drifts with scroll, particles shift slightly with the mouse (desktop)
    let mx = 0, my = 0, ticking = false;
    const fineP = false; // parallax now handled by the scene engine below
    const frame = () => {
      ticking = false; if (calm() || !fineP || document.body.classList.contains("jumping")) return;
      const vh = innerHeight;
      layers.forEach((l) => {
        if (!l.live) return;
        const r = l.sec.getBoundingClientRect();
        const p = (r.top + r.height / 2 - vh / 2) / (vh + r.height); // -0.5 … 0.5 across the viewport
        l.glow.style.transform = `translate3d(${(mx * -14).toFixed(1)}px, ${(p * 120 + my * -10).toFixed(1)}px, 0)`;
        l.parts.style.transform = `translate3d(${(mx * -22).toFixed(1)}px, ${(p * 60 + my * -14).toFixed(1)}px, 0)`;
        l.net.style.transform = `translate3d(${(mx * -6).toFixed(1)}px, ${(my * -4).toFixed(1)}px, 0)`;
      });
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    addEventListener("scroll", req, { passive: true });
    if (matchMedia("(pointer: fine)").matches) addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; req(); }, { passive: true });
    req();

    // an occasional packet along each live section's network
    const sendPacket = () => {
      if (!document.hidden && !calm()) layers.forEach((l) => {
        if (!l.live || !l.L.length || Math.random() < .4) return;
        const [i, k] = l.L[(Math.random() * l.L.length) | 0], [a, b] = Math.random() < .5 ? [i, k] : [k, i];
        const d = document.createElement("i"); d.className = "sb-packet"; l.bg.appendChild(d);
        const an = d.animate([{ left: l.P[a][0] + "%", top: l.P[a][1] * 1.4 + "%", opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .8 }, { left: l.P[b][0] + "%", top: l.P[b][1] * 1.4 + "%", opacity: 0 }], { duration: 2600, easing: "ease-in-out" });
        an.onfinish = () => d.remove();
      });
      setTimeout(sendPacket, 2200);
    };
    setTimeout(sendPacket, 1500);
  })();

  /* ---------- scene engine: depth layers · network islands · horizon · rays · constellations · life ---------- */
  (() => {
    const root = document.documentElement;
    const calm = () => root.classList.contains("calm") || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = innerWidth < 760, fine = matchMedia("(pointer: fine)").matches;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const ink = "#2b3266";
    /* --- network gear (inline SVG so LEDs and terminal text can animate) --- */
    const leds = (xs, y, cols) => xs.map((x, i) => `<circle class="led l${i % 3}" cx="${x}" cy="${y}" r="2.6" fill="${cols[i % cols.length]}"/>`).join("");
    const DEV = {
      switch: () => `<g transform="translate(45 36)"><rect width="110" height="26" rx="4" fill="#26305e" stroke="${ink}" stroke-width="2"/>
        ${[0,1,2,3,4,5,6,7].map((i) => `<rect x="${9 + i * 12}" y="12" width="8" height="8" rx="1.5" fill="#0d1230"/>`).join("")}
        ${leds([13, 25, 37, 49, 61, 73, 85, 97], 7, ["#56e39a", "#56e39a", "#ffc65c"])}</g>`,
      router: () => `<g transform="translate(55 30)"><path d="M18 4 L8 -26 M72 4 L82 -26" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>
        <circle cx="8" cy="-27" r="3" fill="#7fa6ff"/><circle cx="82" cy="-27" r="3" fill="#7fa6ff"/>
        <path class="wifi w1" d="M37 -10 Q45 -17 53 -10" fill="none" stroke="#7fa6ff" stroke-width="2.4" stroke-linecap="round"/>
        <path class="wifi w2" d="M31 -16 Q45 -27 59 -16" fill="none" stroke="#7fa6ff" stroke-width="2.4" stroke-linecap="round"/>
        <rect width="90" height="30" rx="7" fill="#eef2fb" stroke="${ink}" stroke-width="2"/><rect x="0" y="20" width="90" height="10" rx="5" fill="#d3dbef"/>
        ${leds([16, 28, 40, 52], 12, ["#56e39a", "#7fa6ff", "#56e39a", "#ffc65c"])}</g>`,
      rack: () => `<g transform="translate(68 -26)"><rect width="64" height="88" rx="5" fill="#1e2650" stroke="${ink}" stroke-width="2"/>
        ${[0,1,2,3].map((u) => `<rect x="6" y="${7 + u * 20}" width="52" height="15" rx="2.5" fill="#2c3770"/><rect x="11" y="${12 + u * 20}" width="22" height="4" rx="1" fill="#0d1230"/>`).join("")}
        ${[0,1,2,3].map((u) => leds([42, 50], 14 + u * 20, u % 2 ? ["#ffc65c", "#56e39a"] : ["#56e39a", "#7fa6ff"])).join("")}</g>`,
      firewall: () => `<g transform="translate(52 14)"><rect width="96" height="46" rx="4" fill="#e2733a" stroke="${ink}" stroke-width="2"/>
        <path d="M0 15 H96 M0 30 H96 M24 0 V15 M56 0 V15 M88 0 V15 M12 15 V30 M44 15 V30 M76 15 V30 M28 30 V46 M60 30 V46" stroke="#b5532a" stroke-width="2"/>
        <g transform="translate(34 -8)"><path d="M14 0 L28 5 V18 C28 27 21 33 14 36 C7 33 0 27 0 18 V5 Z" fill="#fff" stroke="${ink}" stroke-width="2"/>
        <path class="fw-check" d="M8 18 L12.5 22.5 L20 13" fill="none" stroke="#2fa866" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g></g>`,
      terminal: (lines) => `<g transform="translate(40 -22)"><rect x="46" y="70" width="28" height="10" fill="#3b4170"/><rect x="34" y="78" width="52" height="6" rx="3" fill="${ink}"/>
        <rect width="120" height="74" rx="7" fill="#1b2147" stroke="${ink}" stroke-width="2"/><rect x="6" y="6" width="108" height="58" rx="3" fill="#0a0f2c"/>
        ${lines.map((t, i) => `<text class="tline t${i}" x="11" y="${17 + i * 11}" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="7.4" fill="${i % 2 ? "#9fc0ff" : "#6ee7a8"}">${t}</text>`).join("")}
        <rect class="tcur" x="11" y="${10 + lines.length * 11}" width="5" height="8" fill="#6ee7a8"/></g>`
    };
    const TERM = [["$ nmap -sV 10.0.0.0/24", "443/tcp open https", "$ ping 1.1.1.1", "64 bytes time=12ms"],
                  ["$ ssh admin@fw01", "access granted ✓", "$ show vlan brief", "VLAN20 SECURE active"],
                  ["$ falcon status", "sensor: running ✓", "$ audit --policy", "100% compliant"]];
    let tIdx = 0;
    /* isometric infrastructure scenes (homelab, SOC, data center, database, stack, DR, zero trust, rack) */
    const ISO=(()=>{
    
    const INK='#1b2147',C=Math.cos(Math.PI/6),Sn=Math.sin(Math.PI/6);
    let OX=200,OY=120,K=6,LEDN=0,RACKFX=false;
    const P=(x,y,z)=>[OX+(x-y)*C*K,OY+(x+y)*Sn*K-z*K];
    const pts=a=>a.map(p=>P(...p).map(n=>n.toFixed(1)).join(',')).join(' ');
    const st=(w=1.6)=>`stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"`;
    const G='#56e39a',A='#ffc65c',B='#7fa6ff',R='#ff6b6b',D='#1e2650',SCR='#0a0f2c',MET='#c9cfe0',MET2='#9aa3c0';
    function box(x,y,z,w,d,h,top,left,right,sw){return `<polygon points="${pts([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]])}" fill="${top}" ${st(sw)}/>`+
     `<polygon points="${pts([[x,y+d,z+h],[x+w,y+d,z+h],[x+w,y+d,z],[x,y+d,z]])}" fill="${left}" ${st(sw)}/>`+
     `<polygon points="${pts([[x+w,y,z+h],[x+w,y+d,z+h],[x+w,y+d,z],[x+w,y,z]])}" fill="${right}" ${st(sw)}/>`}
    // draw on the front (y+d) face: local u along x, v downward from the top edge
    const FL=(x,y,z,w,d,h,inner)=>{const [ox,oy]=P(x,y+d,z+h);return `<g transform="matrix(${C*K} ${Sn*K} 0 ${K} ${ox} ${oy})">${inner}</g>`};
    const FR=(x,y,z,w,d,h,inner)=>{const [ox,oy]=P(x+w,y+d,z+h);return `<g transform="matrix(${C*K} ${-Sn*K} 0 ${K} ${ox} ${oy})">${inner}</g>`};
    const FT=(x,y,z,w,d,h,inner)=>{const [ox,oy]=P(x,y,z+h);return `<g transform="matrix(${C*K} ${Sn*K} ${-C*K} ${Sn*K} ${ox} ${oy})">${inner}</g>`};
    const r=(x,y,w,h,f,o='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${o}/>`;
    const c=(x,y,rr,f)=>{const L=rr<=.45&&(LEDN++%6==0)&&LEDN<48;return `<circle${L?` class="led l${LEDN%3}"`:''} cx="${x}" cy="${y}" r="${rr}" fill="${f}"/>`};
    const t=(x,y,s,f,sz=.9,w=700)=>`<text x="${x}" y="${y}" font-family="ui-monospace,Menlo,Consolas,monospace" font-weight="${w}" font-size="${sz}" fill="${f}">${s}</text>`;
    const cable=(a,col='#2b3166',w=2.2)=>`<polyline points="${pts(a)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const pathD=a=>'M'+a.map(p=>P(...p).map(n=>n.toFixed(1)).join(' ')).join(' L');
    const mover=(d,col,dur=2.4,delay=0,rr=3.2)=>`<g class="mv"><circle r="${rr*2.4}" fill="${col}" opacity=".28"/><circle r="${rr}" fill="${col}" stroke="#fff" stroke-width="1"/><animateMotion dur="${dur}s" begin="${-delay}s" repeatCount="indefinite" path="${d}" calcMode="linear"/></g>`;
    const link=(a,col='#2b3166',w=2.2,dur=2.2,n=1,pc)=>cable(a,col,w)+Array.from({length:n},(_,i)=>mover(pathD(a),pc||(col=='#2b3166'?G:col),dur,dur*i/n,3.2)).join('');
    const shadow=(x,y,w,d)=>`<polygon points="${pts([[x-1,y-1,0],[x+w+1,y-1,0],[x+w+1,y+d+1,0],[x-1,y+d+1,0]])}" fill="var(--iso-grid)" opacity=".10"/>`;   // a soft glow under things instead of a cast shadow
    
    // ---------- device library ----------
    function server(x,y,z,w=10,d=8,h=1.6,acc=G){return box(x,y,z,w,d,h,'#3b4478','#232a52','#2c3466',1.2)+FL(x,y,z,w,d,h,
      `${[0,1,2,3].map(i=>r(.6+i*1.5,.3,1.2,1,'#3d4680')).join('')}${c(w-1.6,.8,.32,acc)}${c(w-.8,.8,.32,B)}${r(6.8,.45,1.4,.25,'#5a6290')}`)}
    function firewall(x,y,z,w=10,d=8,h=1.8){return box(x,y,z,w,d,h,'#ff8f7a','#e0533f','#c8442f',1.2)+FL(x,y,z,w,d,h,
      `${t(.5,1.25,'FW','#fff',.95)}${[0,1,2,3,4].map(i=>r(3+i*.95,.45,.7,.6,'#5a1a12')+c(3.35+i*.95,1.35,.16,i==2?A:G)).join('')}<path d="M${w-1.2} .3 l.7 .3 v.5 c0 .4 -.35 .65 -.7 .8 c-.35 -.15 -.7 -.4 -.7 -.8 v-.5Z" fill="#fff"/>`)}
    function sw(x,y,z,w=10,d=8,h=1.2){return box(x,y,z,w,d,h,'#dfe4f2',MET,MET2,1.2)+FL(x,y,z,w,d,h,
      `${Array.from({length:12},(_,i)=>r(.5+i*.75,.3,.55,.5,'#2a3060')+c(.77+i*.75,.95,.13,[G,G,B,G,A,G,B,G,G,R,G,B][i])).join('')}`)}
    function ups(x,y,z,w=10,d=8,h=2.2){return box(x,y,z,w,d,h,'#4a4f66','#2b2f42','#363b52',1.2)+FL(x,y,z,w,d,h,`${r(.6,.5,3,1.2,'#0f2a1d')}${t(.8,1.4,'100%',G,.7)}${c(w-1,1.1,.4,G)}`)}
    function unitFace(kind,y,W,h){const col={firewall:'#e0533f',sw:'#dfe4f2',server:'#323b6e',ups:'#2b2f42'}[kind]||'#323b6e';
      let o=r(.5,y,W-1,h-.15,col,`stroke="${INK}" stroke-width=".1"`);
      if(kind=='firewall')o+=t(1,y+h*.72,'FW','#fff',h*.55)+[0,1,2,3,4].map(i=>r(3.4+i*.95,y+h*.25,.7,h*.45,'#5a1a12')+c(3.75+i*.95,y+h*.85,.12,i==2?A:G)).join('')+c(W-1.4,y+h/2,.25,G);
      if(kind=='sw')o+=Array.from({length:11},(_,i)=>r(1+i*.8,y+h*.2,.6,h*.4,'#2a3060')+c(1.3+i*.8,y+h*.8,.11,[G,G,B,G,A,G,B,G,G,R,G][i])).join('');
      if(kind=='server')o+=[0,1,2,3].map(i=>r(1+i*1.5,y+h*.2,1.2,h*.6,'#45508e')).join('')+c(W-1.6,y+h/2,.22,G)+c(W-1,y+h/2,.22,B);
      if(kind=='nas')o+=[0,1,2,3,4,5].map(i=>r(1+i*1.2,y+h*.15,.9,h*.7,'#45508e')+c(1.45+i*1.2,y+h*.75,.1,G)).join('');
      if(kind=='ups')o+=r(1,y+h*.2,3,h*.6,'#0f2a1d')+t(1.2,y+h*.68,'100%',G,h*.4)+c(W-1.4,y+h/2,.3,G);
      return o}
    function rack(x,y,w=11,d=9,h=24,units,z=0){let s=box(x,y,z,w,d,h,'#2a2f45','#1a1e33','#22273d',1.6);
      let inner=r(.4,.4,w-.8,h-.8,'#0d1024');let v=.9;units.forEach(([k,hh])=>{inner+=unitFace(typeof k=='string'?k:'server',v,w,hh);v+=hh+.15});
      if(RACKFX)inner+=`<rect class="sweep" x=".5" y=".9" width="${w-1}" height=".5" fill="#9fc0ff" opacity="0" style="--sw:${h-2.2}px;animation-delay:${-((x*7+y*3)%50)/10}s"/>`;
      return s+FL(x,y,z,w,d,h,inner)+FT(x,y,z,w,d,h,[2,4,6].map(i=>`<rect x="1" y="${i}" width="${w-2}" height=".5" fill="#3a4060"/>`).join(''))}
    function monitor(x,y,z,w=9,scr='chart'){const h=5.4;let s=box(x+w/2-.6,y+.4,z,1.2,.8,2,'#3b4170','#2a3060','#2a3060',1)+box(x+w/2-2,y,z,4,1.6,.4,'#3b4170','#2a3060','#2a3060',1)+box(x,y+.4,z+2,w,.6,h,D,D,'#2a3060',1.2);
      const inner={chart:`${r(.4,.4,w-.8,h-.8,SCR)}<polyline class="draw" pathLength="1" points="1,4 2.5,2.6 4,3.4 5.5,1.5 7,2.4 8,1.2" fill="none" stroke="${G}" stroke-width=".25"/><rect class="scan" x=".4" y=".4" width="${w-.8}" height=".35" fill="#fff" opacity=".12"/>`,
       bars:`${r(.4,.4,w-.8,h-.8,SCR)}${[2,3.2,1.6,3.8,2.6,3].map((hh,i)=>r(1+i*1.2,4.6-hh,.8,hh,[B,G,B,R,G,A][i],`class="bar" style="animation-delay:${-i*.37}s"`)).join('')}`,
       term:`${r(.4,.4,w-.8,h-.8,SCR)}${t(.8,1.5,'$ sentinel',G,.65)}${t(.8,2.6,'hire: YES',A,.65)}${t(.8,3.7,'risk: low',B,.65)}`,
       alert:`${r(.4,.4,w-.8,h-.8,SCR)}<g class="blink">${t(.8,1.6,'!ALERT',R,.8)}</g>${t(.8,2.8,'triage...',B,.6)}${r(.8,3.4,5,.5,'#1d2a55')}<rect class="prog" x=".8" y="3.4" width="5" height=".5" fill="${G}"/>`}[scr];
      return s+FL(x,y+.4,z+2,w,.6,h,inner)}
    function pi(x,y,z){return box(x,y,z,3.2,2.2,1,'#3fa25a','#2e7d45','#256a39',1)+FT(x,y,z,3.2,2.2,1,r(.4,.4,1,.8,'#c8d0d8')+c(2.6,.6,.18,R)+c(2.6,1.3,.18,G))}
    function nas(x,y,z){return box(x,y,z,4,5,4.4,'#3a3f55','#25293a','#2e3347',1.2)+FL(x,y,z,4,5,4.4,`${[0,1,2,3].map(i=>r(.4+i*.85,.5,.65,3,'#3b4160')+c(.72+i*.85,3.8,.15,G)).join('')}`)}
    function camera(x,y,z,dir=1){const [X,Y]=P(x+1,y+.4,z+2.7);const cone=`<path class="cone" d="M${X} ${Y} l${dir*46} 22 l${-dir*12} 16Z" fill="#ff6b6b" opacity=".0"/>`;return cone+box(x,y,z,.6,.6,2,MET2,MET2,MET2,1)+box(x-.6,y-.4,z+2,3.4,1.6,1.4,'#f2f4fb',MET,MET2,1.1)+FL(x-.6,y-.4,z+2,3.4,1.6,1.4,c(2.6,.7,.42,'#1b2147')+c(2.7,.6,.14,R))}
    function yubikey(x,y,z){return box(x,y,z,3,1,.3,'#2a2f45','#1a1e33','#22273d',.8)+FT(x,y,z,3,1,.3,`<circle cx="2.2" cy=".5" r=".32" fill="${A}"/>`)}
    function lockShield(x,y,z,s=1){const [X,Y]=P(x,y,z);return `<g transform="translate(${X} ${Y}) scale(${s})"><g class="pulse"><circle r="22" fill="#56e39a" opacity=".18"/></g><path d="M0 -16 L13 -10 V0 C13 9 6 14 0 17 C-6 14 -13 9 -13 0 V-10Z" fill="#fff" ${st(2)}/><path d="M-5 1 L-1 5 L6 -3" fill="none" stroke="#2fa866" stroke-width="2.6" stroke-linecap="round"/></g>`}
    function keyboard(x,y,z){return box(x,y,z,8,3,.4,'#e8ebf5',MET,MET2,1)+FT(x,y,z,8,3,.4,Array.from({length:3},(_,j)=>Array.from({length:10},(_,i)=>r(.3+i*.75,.3+j*.85,.6,.65,'#b8bfd6')).join('')).join(''))}
    function desk(x,y,w,d,h,top='#c99a6b'){return box(x,y,0,.8,.8,h,'#7a5a3a','#6a4c30','#5b412a',1)+box(x+w-.8,y,0,.8,.8,h,'#7a5a3a','#6a4c30','#5b412a',1)+box(x,y+d-.8,0,.8,.8,h,'#7a5a3a','#6a4c30','#5b412a',1)+box(x+w-.8,y+d-.8,0,.8,.8,h,'#7a5a3a','#6a4c30','#5b412a',1)+box(x,y,h,w,d,.8,top,'#a87a4a','#94683d',1.6)}
    // no solid slab any more: just a faint holographic grid, so each scene floats in the space background
    function floor(x,y,w,d,col,tile=4){
      return FT(x,y,-.2,w,d,.2,`<rect x="0" y="0" width="${w}" height="${d}" fill="var(--iso-grid)" opacity=".05" stroke="var(--iso-grid)" stroke-width=".12" stroke-opacity=".55"/>`+
        Array.from({length:Math.floor(w/tile)-1},(_,i)=>`<line x1="${(i+1)*tile}" y1="0" x2="${(i+1)*tile}" y2="${d}"/>`).join('')+Array.from({length:Math.floor(d/tile)-1},(_,j)=>`<line x1="0" y1="${(j+1)*tile}" x2="${w}" y2="${(j+1)*tile}"/>`).join('')).replace('<g ','<g class="iso-grid" ')}
    const packet=(p,col)=>{const [X,Y]=P(...p);return `<g class="pk"><circle cx="${X}" cy="${Y}" r="3.2" fill="${col}" stroke="#fff" stroke-width="1.2"/><circle cx="${X}" cy="${Y}" r="7" fill="${col}" opacity=".25"/></g>`};
    const label=(p,s,col=INK)=>{const [X,Y]=P(...p);return `<g transform="translate(${X} ${Y})"><rect x="-2" y="-11" width="${s.length*6.6+10}" height="16" rx="4" fill="#fff" ${st(1.2)}/><text x="3" y="1" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="10" font-weight="700" fill="${col}">${s}</text></g>`};
    
    
    const ell=(x,y,z,rr)=>{const [X,Y]=P(x,y,z);return [X,Y,rr*K*1.22,rr*K*.71]};
    function db(x,y,z,rr=2.4,h=5,col='#6f8cff',n=3){const [X,Y,RX,RY]=ell(x,y,z+h,rr),[,Y0]=P(x,y,z);let s=`<path d="M${X-RX} ${Y} V${Y0} A${RX} ${RY} 0 0 0 ${X+RX} ${Y0} V${Y}" fill="${col}" ${st(1.4)}/>`;
     for(let i=1;i<n;i++){const yy=Y+(Y0-Y)*i/n;s+=`<path d="M${X-RX} ${yy} A${RX} ${RY} 0 0 0 ${X+RX} ${yy}" fill="none" stroke="${INK}" stroke-width="1.1" opacity=".55"/>`}
     return s+`<ellipse cx="${X}" cy="${Y}" rx="${RX}" ry="${RY}" fill="#dfe6ff" ${st(1.4)}/>`}
    function crac(x,y,z){return box(x,y,z,6,3,9,'#f2f4fb',MET,MET2,1.3)+FL(x,y,z,6,3,9,[0,1,2,3,4,5].map(i=>r(.6,1+i*.9,4.8,.45,'#9aa3c0')).join('')+c(5,7.4,.3,B))}
    function door(x,y,z){return box(x,y,z,.6,6,12,'#d5dbee','#c3cbe3','#b6bdd3',1.3)+FR(x,y,z,.6,6,12,r(1,1,4,8,'#bfe0ff','opacity=".6"')+r(4.4,6,.8,1.2,'#2a3060')+c(4.8,6.4,.15,G))}
    function screenWall(x,y,z,w,h){return box(x,y,z,w,.6,h,D,D,'#2a3060',1.4)+FL(x,y,z,w,.6,h,`${r(.4,.4,w/2-.6,h/2-.6,SCR)}${r(w/2+.2,.4,w/2-.6,h/2-.6,SCR)}${r(.4,h/2+.2,w/2-.6,h/2-.6,SCR)}${r(w/2+.2,h/2+.2,w/2-.6,h/2-.6,SCR)}
     <polyline points="1,${h/2-1.2} 3,${h/2-3} 5,${h/2-2} 7,${h/2-4} ${w/2-1},${h/2-2.8}" fill="none" stroke="${G}" stroke-width=".3"/>${t(w/2+.8,2.2,'!ALERT',R,1.1)}${r(w/2+.8,3.2,6,.5,B)}
     ${[0,1,2,3,4].map(i=>r(1+i*1.4,h-1-[2,3,1.5,3.6,2.4][i],.9,[2,3,1.5,3.6,2.4][i],[B,G,B,R,G][i])).join('')}${t(w/2+.8,h/2+2,'$ hunt',G,.8)}<rect class="tcur" x="${w/2+.8}" y="${h/2+2.8}" width=".6" height=".9" fill="${G}"/>`)}
    function glassWall(x,y,z,w,h){return `<polygon points="${pts([[x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h]])}" fill="#bfe0ff" opacity=".28" ${st(1.3)}/>`+[.25,.5,.75].map(f=>cable([[x+w*f,y,z],[x+w*f,y,z+h]],'#8fb0e0',1)).join('')}
    const arcLink=(a,b,lift,col,dash)=>{const [x1,y1]=P(...a),[x2,y2]=P(...b);return `<path${dash?' class="flow"':''} d="M${x1} ${y1} Q${(x1+x2)/2} ${Math.min(y1,y2)-lift} ${x2} ${y2}" fill="none" stroke="${col}" stroke-width="2.4" ${dash?`stroke-dasharray="${dash}"`:''} stroke-linecap="round"/>`};
    const SCENES={
     homelab:()=>{OX=250;OY=140;K=6.2;let s=`<rect x="0" y="0" width="560" height="400" rx="16" fill="#0b1030" ${st(2)}/><rect x="0" y="0" width="560" height="30" rx="16" fill="#1a2150"/><rect x="0" y="20" width="560" height="10" fill="#1a2150"/>${[0,1,2].map(i=>`<circle cx="${22+i*20}" cy="15" r="6" fill="${[R,A,G][i]}"/>`).join('')}<rect x="20" y="370" width="150" height="8" rx="3" fill="${G}" opacity=".8"/><rect class="tcur" x="176" y="366" width="8" height="14" fill="#fff"/>`;
      return s+floor(-2,-2,40,22,'#18205a')+shadow(0,0,26,12)+desk(0,0,26,12,7,'#3a4378')+(RACKFX=true,'')+rack(28,1,11,9,16,[['firewall',1.6],['sw',1.2],['server',1.6],['server',1.6],['nas',1.6],['ups',2.2]])
      +monitor(2,1,7.8,7,'chart')+monitor(9.5,.4,7.8,7,'alert')+monitor(17,1,7.8,7,'bars')+keyboard(8,7,7.8)+pi(20,8,7.8)+yubikey(4,8.5,7.8)+nas(30,12,0)+link([[26,9,7.8],[27,9,7.8],[27,9,0],[28,10,0]],B,1.8,2.6,2)+link([[34,10,0],[34,12,0]],G,1.8,1.4)+link([[22,9,7.8],[23.5,9,7.8],[23.5,9.6,7.8],[25,10,7.8]],A,1.4,1.6)},
     datacenter:()=>{OX=290;OY=110;K=5.2;let s=floor(0,0,46,34)+box(0,0,0,46,.8,20,'rgba(130,165,255,.16)','rgba(130,165,255,.10)','rgba(130,165,255,.10)',1)+box(0,0,0,.8,34,20,'rgba(130,165,255,.16)','rgba(130,165,255,.12)','rgba(130,165,255,.08)',1);
      s+=FT(0,0,-1.6,46,34,1.6,r(4,15,38,3,'#7fb4ff','opacity=".45"')+r(4,29,38,3,'#ff8f7a','opacity=".4"'))+crac(2,1,0)+crac(10,1,0)+door(.8,24,0)+camera(1.4,2,16)+camera(43,1.4,16);
      [8,22].forEach(yy=>{for(let i=0;i<4;i++)s+=rack(10+i*8,yy,7,6,12,[['server',1.2],['server',1.2],['sw',1],['server',1.2],['server',1.2],['ups',1.6]])});
      return s+box(10,9,14,32,1.2,.5,MET,MET2,MET2,1)+cable([[10,9.3,14.5],[42,9.3,14.5]],B,1.4)+cable([[10,9.7,14.5],[42,9.7,14.5]],G,1.4)+box(10,23,14,32,1.2,.5,MET,MET2,MET2,1)+cable([[10,23.4,14.5],[42,23.4,14.5]],A,1.4)
      +[0,1,2].map(i=>`<path class="air" style="animation-delay:${-i*.8}s" d="${pathD([[5,6,3+i*2],[12,16.5,1+i],[42,16.5,1+i]])}" fill="none" stroke="#7fb4ff" stroke-width="1.6" stroke-dasharray="4 10" stroke-linecap="round"/>`).join('')
      +mover(pathD([[10,9.5,14.6],[42,9.5,14.6]]),G,3.2,0,2)+mover(pathD([[42,9.3,14.6],[10,9.3,14.6]]),B,3.8,1.5,2)+mover(pathD([[10,23.4,14.6],[42,23.4,14.6]]),A,3,0,2)},
     database:()=>{OX=270;OY=120;K=6;let s=floor(-2,-2,42,38);
      s+=sw(14,0,0,10,5,1.4)+link([[16,5,0],[8,9,0]],B,2.2,1.6)+link([[19,5,0],[19,9,0]],B,2.2,1.2)+link([[22,5,0],[30,9,0]],B,2.2,1.9);
      [[4,9],[15,9],[26,9]].forEach(([x,y])=>{s+=server(x,y,0,8,5,1.6)+server(x,y,1.6,8,5,1.6)});
      s+=link([[8,14,0],[18,21,0]],G,2.2,1.8)+link([[19,14,0],[19,21,0]],G,2.2,1.3)+link([[30,14,0],[20,21,0]],G,2.2,2)+link([[19,21,0],[22,29,0]],'#9aa3c0',2.2,2.6,1,'#dfe4f2');
      s+=db(6,22,0,2.4,5,'#7f9cf5')+db(19,22,0,3,7,'#3f6ae0')+db(33,22,0,2.4,5,'#7f9cf5');
      s+=arcLink([17,22,7],[7,22,5],18,A,'5 4')+arcLink([21,22,7],[32,22,5],18,A,'5 4');
      {const q=(a,b,l)=>{const [x1,y1]=P(...a),[x2,y2]=P(...b);return `M${x1} ${y1} Q${(x1+x2)/2} ${Math.min(y1,y2)-l} ${x2} ${y2}`};s+=mover(q([17,22,7],[7,22,5],18),A,1.8)+mover(q([21,22,7],[32,22,5],18),A,1.8,.9);}
      {const [X,Y]=P(19,22,7);s+=`<ellipse class="ring" cx="${X}" cy="${Y}" rx="${3*K*1.22}" ry="${3*K*.71}" fill="none" stroke="#7fb4ff" stroke-width="2"/><ellipse class="ring" style="animation-delay:-1.2s" cx="${X}" cy="${Y}" rx="${3*K*1.22}" ry="${3*K*.71}" fill="none" stroke="#7fb4ff" stroke-width="2"/>`;}
      return s+box(19,29,0,7,4,5,'#8a93ab','#5a6290','#4b5380',1.4)+FL(19,29,0,7,4,5,`<circle cx="3.5" cy="2.4" r="1.4" fill="none" stroke="#dfe4f2" stroke-width=".3"/><path d="M3.5 1.2 V3.6 M2.3 2.4 H4.7" stroke="#dfe4f2" stroke-width=".25"/>`)},
     stack:()=>{OX=250;OY=40;K=5;const L=[z=>firewall(6,6,z,10,6,1.8)+firewall(20,6,z,10,6,1.8)+camera(32,3,z)+lockShield(18,9,z+9,.7),
      z=>sw(6,6,z,10,6,1.2)+sw(20,6,z,10,6,1.2)+cable([[16,9,z+.6],[20,9,z+.6]],G),
      z=>rack(4,4,8,6,6,[['server',1.2],['server',1.2],['server',1.2]],z)+rack(14,4,8,6,6,[['server',1.2],['server',1.2],['sw',1]],z)+rack(24,4,8,6,6,[['server',1.2],['server',1.2],['server',1.2]],z),
      z=>db(12,10,z,2.6,4.6,'#3f6ae0')+db(22,10,z,2.2,4,'#7f9cf5')+nas(28,6,z),
      z=>box(8,5,z,8,5,4,'#8a93ab','#5a6290','#4b5380',1.3)+ups(20,6,z,9,5,2.2)];
      let s=box(-3,13,-61.4,2,2,62,'#ffd27a','#e8a83a','#d39020',1.2);L.slice().reverse().forEach((f,ii)=>{const z=-(4-ii)*15;s+=box(0,0,z-1.4,36,16,1.4,'var(--iso-floor)','var(--iso-side1)','var(--iso-side2)',1.6)+f(z)});const up=pathD([[-1,15,-60],[-1,15,0.6]]),dn=pathD([[-1,15,0.6],[-1,15,-60]]);return s+mover(up,G,3.4,0,2.4)+mover(up,B,3.4,1.7,2.4)+mover(dn,A,4,1,2.2)},
     soc:()=>{OX=290;OY=105;K=5.6;let s=floor(0,0,40,32);
      for(let i=0;i<4;i++)s+=rack(4+i*8,1,7,6,13,[['firewall',1.2],['sw',1],['server',1.2],['server',1.2],['server',1.2],['ups',1.6]]);
      return s+crac(36,1,0)+glassWall(0,10,0,40,15)+screenWall(6,12,0,24,12)+shadow(6,18,26,10)+desk(6,18,26,10,7,'#3a4378')+monitor(8,19,7.8,6,'chart')+monitor(15,18.4,7.8,6,'alert')+monitor(22,19,7.8,6,'bars')+keyboard(13,24,7.8)+yubikey(9,25,7.8)+camera(37,30,10,-1)+link([[31,22,0],[34,22,0],[34,9,0],[30,7,0]],B,1.8,2.4,2)},
     dr:()=>{OX=280;OY=130;K=5.2;let s=floor(-22,0,22,20)+floor(16,-6,22,20);
      s+=rack(-19,3,8,6,13,[['firewall',1.2],['sw',1],['server',1.2],['server',1.2],['server',1.2],['ups',1.6]])+db(-6,10,0,2.6,5,'#3f6ae0')+cable([[-11,8,0],[-8,10,0]],G);
      s+=rack(19,-3,8,6,13,[['firewall',1.2],['sw',1],['server',1.2],['server',1.2],['ups',1.6]])+db(32,4,0,2.6,5,'#7f9cf5')+cable([[27,2,0],[30,4,0]],G);
      const [x1,y1]=P(-15,6,14),[x2,y2]=P(23,0,14);const fw=`M${x1} ${y1} Q${(x1+x2)/2} ${Math.min(y1,y2)-70} ${x2} ${y2}`,bk=`M${x2} ${y2} Q${(x1+x2)/2} ${Math.min(y1,y2)-70} ${x1} ${y1}`;
      return s+arcLink([-15,6,14],[23,0,14],70,'#9f87ff')+arcLink([-15,6,14],[23,0,14],70,'#fff','2 8')+mover(fw,A,2.6,0,3)+mover(fw,G,2.6,1.3,3)+mover(bk,'#9f87ff',3.2,.6,2.6)},
     zerotrust:()=>{OX=280;OY=95;K=5;let s=floor(0,0,44,36);const Z=[[2,2,'#dbe7ff'],[24,2,'#ffe9d6'],[2,20,'#e2f7ec'],[24,20,'#fde3e3']];
      Z.forEach(([x,y,c0])=>{s+=box(x,y,0,18,14,.3,c0,c0,c0,1.2)+box(x,y,.3,18,.6,2,'#c9cfe0','#b6bdd3','#a9b1c8',1)+box(x,y,.3,.6,14,2,'#c9cfe0','#b6bdd3','#a9b1c8',1)});
      s+=monitor(5,5,.3,6,'chart')+monitor(12,6,.3,5,'bars')+rack(27,4,7,6,10,[['server',1.2],['server',1.2],['sw',1],['server',1.2],['ups',1.6]],.3)+db(38,10,.3,2.2,4,'#3f6ae0')+pi(6,25,.3)+camera(12,24,.3)+pi(28,26,.3)+box(34,24,.3,4,3,3,'#f2f4fb',MET,MET2,1);
      return s+box(19.5,16.5,0,5,3,3,'#9f87ff','#7d63e0','#6a52cc',1.3)+lockShield(22,18,7,.6)+box(.5,.5,0,1.6,1.6,14,'#f2f4fb',MET,MET2,1.2)+box(-.5,-.5,14,3.6,3.6,3,D,D,'#2a3060',1.3)
      +(()=>{const [X,Y]=P(1.3,1.3,16.5);return `<g><path d="M${X} ${Y} L${X+120} ${Y+60} L${X+80} ${Y+100}Z" fill="#7cc8ff" opacity=".16"/><animateTransform attributeName="transform" type="rotate" values="-35 ${X} ${Y};35 ${X} ${Y};-35 ${X} ${Y}" dur="7s" repeatCount="indefinite"/></g><circle class="led l0" cx="${X}" cy="${Y}" r="2.2" fill="#7cc8ff"/>`})()
      +mover(pathD([[11,9,.4],[11,18,.4],[19.5,18,.4]]),B,2.4)+mover(pathD([[30,10,.4],[30,18,.4],[24.5,18,.4]]),A,2.8,1)+mover(pathD([[8,27,.4],[8,18,.4],[19.5,18,.4]]),G,2.6,.5)+mover(pathD([[30,28,.4],[22,28,.4],[22,19.5,.4]]),R,3,1.6)},
     tower:()=>{OX=230;OY=40;K=7.2;const U=[['firewall',1.8],['firewall',1.8],['sw',1.4],['sw',1.4],['server',1.8],['server',1.8],['server',1.8],['nas',1.8],['nas',1.8],['ups',2.4]];
      return shadow(0,0,14,10)+(()=>{let v=.9,o='';U.forEach(([k,h],i)=>{o+=`<rect class="wave" style="animation-delay:${i*.18}s" x=".5" y="${v}" width="13" height="${h-.15}" fill="#bfe0ff" opacity="0"/>`;v+=h+.15});return '';})()+`<polygon points="${pts([[0,10,24],[0,10,0],[-8,16,0],[-8,16,24]])}" fill="#2a2f45" opacity=".9" ${st(1.4)}/>`.replace('opacity=".9"','opacity="0"')+rack(0,0,14,10,24,U)+FL(0,0,0,14,10,24,(()=>{let v=.9,o='';U.forEach(([k,h],i)=>{o+=`<rect class="wave" style="animation-delay:${i*.16}s" x=".5" y="${v}" width="13" height="${h-.15}" fill="#bfe0ff" opacity="0"/>`;v+=h+.15});return o})())+`<polygon points="${pts([[0,10,24],[0,10,0],[-8,16,0],[-8,16,24]])}" fill="#2a2f45" opacity=".92" ${st(1.4)}/>`}
    };
    
    return {SCENES,reset:()=>{LEDN=0;RACKFX=false}};
    })();
    const ISO_VB = {"homelab": [-6, -6, 572, 412], "datacenter": [131, 0, 401, 332], "database": [67, 102, 428, 262], "stack": [166, 34, 264, 449], "soc": [129, 40, 366, 281], "dr": [85, 6, 399, 274], "zerotrust": [118, 2, 358, 308], "tower": [74, -139, 261, 278]};
    /* move every animated piece into a light overlay layer, so the detailed scene underneath is painted once and never re-rasterised */
    const FX_SEL = ".led,.draw,.scan,.bar,.blink,.prog,.sweep,.wave,.pulse,.cone,.air,.ring,.mv,.flow,.pk,.tcur,g:has(> animateTransform)";
    const splitFx = (base) => {
      const NS = "http://www.w3.org/2000/svg", fx = document.createElementNS(NS, "svg");
      fx.setAttribute("viewBox", base.getAttribute("viewBox")); fx.setAttribute("class", "iso-fx"); fx.setAttribute("aria-hidden", "true");
      [...base.querySelectorAll(FX_SEL)].filter((el) => !el.parentElement.closest(FX_SEL)).forEach((el) => {
        let node = el; const chain = [];
        for (let a = el.parentElement; a && a !== base; a = a.parentElement) if (a.getAttribute("transform")) chain.push(a.getAttribute("transform"));
        el.remove();
        chain.forEach((tr) => { const g = document.createElementNS(NS, "g"); g.setAttribute("transform", tr); g.appendChild(node); node = g; });
        fx.appendChild(node);
      });
      base.after(fx);
    };
    const island = (dev, w, depth) => {
      ISO.reset(); const vb = ISO_VB[dev];
      return `<div class="isle iso iso-${dev}" data-depth="${depth}" style="--iw:${w}px;--bob:${rnd(6, 9).toFixed(1)}s;--bd:${(-rnd(0, 6)).toFixed(1)}s;opacity:${depth < .45 ? .7 : 1}">
        <div class="isle-bob"><svg viewBox="${vb.join(" ")}" aria-hidden="true">${ISO.SCENES[dev]()}</svg></div></div>`;
    };
    /* --- constellations --- */
    const CONS = {"shield": {"p": [[0.5, 0], [1, 0.15], [0.95, 0.55], [0.5, 1], [0.05, 0.55], [0, 0.15], [0.5, 0.45]], "l": [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [6, 3]]}, "lock": {"p": [[0.15, 0.45], [0.85, 0.45], [0.85, 1], [0.15, 1], [0.25, 0.45], [0.25, 0.18], [0.5, 0], [0.75, 0.18], [0.75, 0.45], [0.5, 0.7]], "l": [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 8]]}, "router": {"p": [[0, 0.55], [1, 0.55], [1, 0.9], [0, 0.9], [0.15, 0.55], [0.05, 0.05], [0.85, 0.55], [0.95, 0.05], [0.4, 0.72], [0.6, 0.72]], "l": [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [6, 7]]}, "cancer": {"label": "Cancer", "p": [[0.5, 0.5], [0.46, 0.22], [0.4, 0], [0.12, 0.96], [0.96, 0.82]], "l": [[0, 1], [1, 2], [0, 3], [0, 4]]}, "capricorn": {"label": "Capricorn", "p": [[0.02, 0.05], [0.1, 0.28], [0.32, 0.72], [0.38, 0.92], [0.62, 0.78], [0.86, 0.5], [1, 0.4], [0.7, 0.38], [0.45, 0.3]], "l": [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 1]]}, "libra": {"label": "Libra", "p": [[0.55, 0.02], [0.86, 0.36], [1, 0.14], [0.14, 0.42], [0.05, 0.96], [0.8, 0.84], [0.96, 0.98]], "l": [[0, 1], [0, 3], [3, 1], [1, 2], [3, 4], [1, 5], [5, 6]]}, "bulb": {"p": [[0.5, 0], [0.85, 0.12], [1, 0.4], [0.8, 0.66], [0.64, 0.78], [0.36, 0.78], [0.2, 0.66], [0, 0.4], [0.15, 0.12], [0.38, 0.9], [0.62, 0.9], [0.44, 1], [0.56, 1]], "l": [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 0], [5, 9], [4, 10], [9, 10], [9, 11], [10, 12], [11, 12]]}, "camera": {"p": [[0.12, 0.08], [0.86, 0.24], [0.82, 0.52], [0.08, 0.38], [0.98, 0.38], [0.44, 0.46], [0.44, 0.8], [0.2, 0.8], [0.7, 0.8]], "l": [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4], [4, 2], [5, 6], [7, 8]]}, "thermostat": {"p": [[0.5, 0.0], [0.854, 0.146], [1.0, 0.5], [0.854, 0.854], [0.5, 1.0], [0.146, 0.854], [0.0, 0.5], [0.146, 0.146], [0.5, 0.5], [0.75, 0.28]], "l": [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [8, 9]]}, "watch": {"p": [[0.35, 0], [0.65, 0], [0.2, 0.22], [0.8, 0.22], [0.8, 0.78], [0.2, 0.78], [0.35, 1], [0.65, 1], [0.5, 0.5], [0.5, 0.34]], "l": [[2, 3], [3, 4], [4, 5], [5, 2], [0, 2], [1, 3], [6, 5], [7, 4], [8, 9]]}, "phone": {"p": [[0.22, 0], [0.78, 0], [0.78, 1], [0.22, 1], [0.42, 0.08], [0.58, 0.08], [0.5, 0.9]], "l": [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5]]}, "laptop": {"p": [[0.15, 0], [0.85, 0], [0.85, 0.6], [0.15, 0.6], [0, 0.82], [1, 0.82]], "l": [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [2, 5], [4, 5]]}, "speaker": {"p": [[0.2, 0.1], [0.5, 0], [0.8, 0.1], [0.5, 0.2], [0.2, 0.9], [0.5, 1], [0.8, 0.9], [0.5, 0.55]], "l": [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [2, 6], [4, 5], [5, 6]]}, "cloud": {"p": [[0.1, 0.8], [0, 0.6], [0.12, 0.4], [0.3, 0.38], [0.4, 0.15], [0.62, 0.1], [0.78, 0.3], [0.95, 0.4], [1, 0.62], [0.9, 0.8]], "l": [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 0]]}, "wifi": {"p": [[0.5, 1], [0.3, 0.74], [0.5, 0.64], [0.7, 0.74], [0.14, 0.5], [0.5, 0.32], [0.86, 0.5], [0, 0.25], [0.5, 0], [1, 0.25]], "l": [[1, 2], [2, 3], [4, 5], [5, 6], [7, 8], [8, 9]]}, "server": {"p": [[0.1, 0], [0.9, 0], [0.9, 0.44], [0.1, 0.44], [0.1, 0.56], [0.9, 0.56], [0.9, 1], [0.1, 1], [0.74, 0.22], [0.74, 0.78]], "l": [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4]]}, "topology": {"p": [[0.5, 0.5], [0.5, 0.04], [0.898, 0.27], [0.898, 0.73], [0.5, 0.96], [0.102, 0.73], [0.102, 0.27]], "l": [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 2], [3, 4], [5, 6]]}, "fingerprint": {"p": [[0.15, 0.78], [0.1, 0.42], [0.3, 0.1], [0.7, 0.1], [0.9, 0.42], [0.85, 0.78], [0.3, 0.92], [0.26, 0.52], [0.5, 0.28], [0.74, 0.52], [0.7, 0.92], [0.44, 0.86], [0.4, 0.6], [0.5, 0.48], [0.6, 0.6], [0.56, 0.86]], "l": [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [6, 7], [7, 8], [8, 9], [9, 10], [11, 12], [12, 13], [13, 14], [14, 15]]}, "firewall": {"p": [[0, 0.15], [1, 0.15], [1, 1], [0, 1], [0, 0.58], [1, 0.58], [0.5, 0.15], [0.5, 0.58], [0.25, 0.58], [0.25, 1], [0.75, 0.58], [0.75, 1]], "l": [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [6, 7], [8, 9], [10, 11]]}, "key": {"p": [[0.42, 0.4], [0.32, 0.625], [0.12, 0.625], [0.02, 0.4], [0.12, 0.175], [0.32, 0.175], [1, 0.4], [0.8, 0.4], [0.8, 0.66], [0.93, 0.4], [0.93, 0.6]], "l": [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [7, 8], [9, 10]]}, "radar": {"p": [[0.08, 0.12], [0.2, 0.5], [0.45, 0.78], [0.82, 0.86], [0.55, 0.42], [0.46, 0.82], [0.46, 1], [0.28, 1], [0.64, 1], [0.78, 0.16], [0.92, 0.04]], "l": [[0, 1], [1, 2], [2, 3], [0, 4], [3, 4], [5, 6], [7, 8], [4, 9], [9, 10]]}};
    const constellation = (key, extra) => {
      const c = CONS[key], W = 160, H = 130;
      const P = c.p.map(([x, y]) => [8 + x * W, 8 + y * H]);
      return `<svg class="cst${extra ? " cst-x" : ""}" viewBox="0 0 ${W + 16} ${H + (c.label ? 34 : 16)}" data-key="${key}">
        ${c.l.map(([a, b]) => { const len = Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]).toFixed(1); return `<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" style="--len:${len}"/>`; }).join("")}
        ${P.map((q, i) => `<circle class="cst-dot" cx="${q[0]}" cy="${q[1]}" r="${i % 3 ? 1.8 : 2.6}" style="--tw:${rnd(2, 4).toFixed(2)}s"/>`).join("")}
        ${c.label ? `<text x="${(W + 16) / 2}" y="${H + 28}" text-anchor="middle">${c.label}</text>` : ""}</svg>`;
    };
    // extra IoT constellations: [shape, left %, top %, width px]
    const IOT = {
      experience: [["bulb", 2, 7, 86], ["topology", 2, 32, 96], ["watch", 93, 26, 74], ["fingerprint", 93, 50, 78], ["camera", 1, 60, 104], ["phone", 94, 80, 64]],
      projects: [["laptop", 2, 5, 112], ["firewall", 2, 25, 86], ["speaker", 94, 56, 70], ["thermostat", 2, 46, 84], ["cloud", 91, 84, 104]],
      certifications: [["wifi", 3, 9, 86], ["key", 3, 31, 96], ["camera", 93, 44, 96], ["bulb", 2, 70, 76], ["server", 93, 86, 80]],
      footer: [["wifi", 88, 62, 70], ["watch", 44, 72, 60], ["bulb", 30, 12, 60], ["radar", 66, 58, 74]]
    };
    /* --- per-section scenes --- */
    const PLAN = {
      // [device, width, depth, left %, top %]: first island sits in the open space beside the heading
      experience: { isles: [["soc", 290, .6, 42, 1], ["datacenter", 150, .9, 4, 44], ["dr", 150, .35, 95, 72]], cst: "shield", rays: "tl" },
      projects: { isles: [["database", 300, .6, 45, 3], ["stack", 104, .9, 95, 30], ["homelab", 160, .35, 4, 68]], cst: "router", rays: "r" },
      certifications: { isles: [["zerotrust", 265, .6, 44, 1], ["tower", 112, .9, 4, 44]], cst: "lock", rays: "tr" },
      footer: { isles: [["homelab", 170, .5, 82, 52]], cst: "libra", rays: "moon" }
    };
    const scenes = [];
    $$(".has-bg").forEach((sec) => {
      const key = sec.classList.contains("footer") ? "footer" : sec.id, plan = PLAN[key]; if (!plan) return;
      const bg = $(".sec-bg", sec); if (!bg) return;
      // far layer: tiny soft stars
      const nFar = small ? 12 : 28;
      const far = document.createElement("div"); far.className = "sb-far";
      far.innerHTML = Array.from({ length: nFar }, () => `<i style="left:${rnd(0, 100).toFixed(1)}%;top:${rnd(0, 100).toFixed(1)}%;--s:${rnd(1.5, 3.5).toFixed(1)}px;--tw:${rnd(3, 7).toFixed(1)}s;--dl:${(-rnd(0, 7)).toFixed(1)}s"></i>`).join("");
      // rays from this section's light
      const rays = document.createElement("div"); rays.className = `sb-rays r-${plan.rays}`;
      // horizon hills
      const hills = document.createElement("div"); hills.className = "sb-hills";
      hills.innerHTML = `<svg viewBox="0 0 1440 160" preserveAspectRatio="none"><path class="h1" d="M0 90 C180 40 320 70 480 60 C660 48 760 92 940 74 C1120 56 1260 30 1440 64 V160 H0 Z"/><path class="h2" d="M0 120 C200 92 360 128 560 110 C760 92 900 130 1100 112 C1260 98 1360 110 1440 104 V160 H0 Z"/></svg>`;
      // floating network islands
      const isles = document.createElement("div"); isles.className = "sb-isles";
      const list = small ? plan.isles.slice(0, 1) : plan.isles;
      isles.innerHTML = list.map(([dev, w, d, left, bottom]) => {
        const html = island(dev, small ? Math.min(150, Math.round(w * .5)) : w, d);
        return html.replace('style="', small ? `style="right:3%;top:10px;` : `style="left:${left}%;top:${bottom}%;translate:${left > 80 ? "-60%" : left < 5 ? "-35%" : "0"} 0;`);
      }).join("");
      // only the hero scene of each section is animated; the smaller edge scenes stay still (cheaper, and keeps the eye on one scene)
      $$(".isle.iso .isle-bob > svg", isles).forEach((sv, i) => {
        if (i === 0) return splitFx(sv);
        sv.querySelectorAll(".mv, animateTransform").forEach((el) => el.remove());
        sv.querySelectorAll(FX_SEL.replace(",g:has(> animateTransform)", "")).forEach((el) => el.removeAttribute("class"));
      });
      // constellation
      const cst = document.createElement("div"); cst.className = "sb-iot";
      cst.innerHTML = `<svg class="iot-links"></svg><div class="sb-cst">${constellation(plan.cst)}</div>` + (key === "footer" ? `<div class="sb-cst zod zod-cancer">${constellation("cancer")}</div><div class="sb-cst zod zod-cap">${constellation("capricorn")}</div>` : "") +
        (small ? "" : (IOT[key] || []).map(([k, l, t, w]) => `<div class="sb-cst x" style="left:${l}%;top:${t}%;width:${w}px;translate:${l > 80 ? "-40%" : "0"} 0">${constellation(k, true)}</div>`).join(""));
      // fireflies
      const flies = document.createElement("div"); flies.className = "sb-flies";
      const nF = key === "footer" ? (small ? 4 : 8) : (small ? 2 : 4);
      flies.innerHTML = Array.from({ length: nF }, () => `<i style="left:${rnd(4, 96).toFixed(1)}%;top:${rnd(key === "footer" ? 15 : 45, 92).toFixed(1)}%;--fd:${rnd(9, 16).toFixed(1)}s;--fb:${rnd(1.8, 3.4).toFixed(1)}s;--dl:${(-rnd(0, 12)).toFixed(1)}s;--fx:${rnd(-40, 40).toFixed(0)}px;--fy:${rnd(-40, 20).toFixed(0)}px"></i>`).join("");
      // moon (night)
      if (key === "footer") { const m = document.createElement("div"); m.className = "sb-moon"; m.innerHTML = `<svg viewBox="0 0 60 60"><defs><mask id="moonCut"><rect width="60" height="60" fill="#fff"/><circle cx="40" cy="22" r="20" fill="#000"/></mask></defs><circle cx="30" cy="30" r="22" fill="#f4f1ff" mask="url(#moonCut)"/></svg>`; bg.appendChild(m); }
      bg.insertBefore(far, bg.querySelector(".sb-glow"));
      bg.insertBefore(rays, bg.querySelector(".sb-glow").nextSibling);
      bg.appendChild(cst); bg.appendChild(hills); bg.appendChild(isles); bg.appendChild(flies);
      // near layer: big out-of-focus shards drifting past the edges, in FRONT of the content
      const near = document.createElement("div"); near.className = "sec-near"; near.setAttribute("aria-hidden", "true");
      const nN = small ? 1 : 3, SPR = ["bokeh-shard-1", "bokeh-shard-2", "bokeh-dot"];
      near.innerHTML = Array.from({ length: nN }, (_, i) => { const side = i % 2 ? rnd(90, 99) : rnd(-4, 5); return `<img src="assets/images/${SPR[i % 3]}.webp" alt="" style="left:${side.toFixed(1)}%;top:${rnd(10, 80).toFixed(1)}%;width:${(small ? rnd(60, 90) : rnd(90, 170)).toFixed(0)}px;--rot:${rnd(0, 360).toFixed(0)}deg">`; }).join("");
      sec.appendChild(near);
      scenes.push({ sec, bg, far, isles: $$(".isle", isles), hills, near, cst, glow: $(".sb-glow", bg), parts: $(".sb-parts", bg), live: false, ratio: 0, drawn: false });
    });

    /* --- keep each section's hero scene clear of its heading on every screen size (tablets, big monitors, ultrawides) --- */
    const fitMain = () => {
      if (innerWidth < 760) return;
      scenes.forEach((s) => {
        const el = s.isles[0], head = $(".sec-head", s.sec); if (!el || !head || !el.classList.contains("iso")) return;
        if (!el.dataset.w0) el.dataset.w0 = parseFloat(getComputedStyle(el).getPropertyValue("--iw")) || el.offsetWidth; if (!el.dataset.l0) { el.dataset.l0 = parseFloat(el.style.left); el.dataset.t0 = el.style.top; }
        const sr = s.sec.getBoundingClientRect(), w0 = +el.dataset.w0;
        let textRight = 0;
        $$("h2, .sec-kicker, p", head).forEach((t) => { const rg = document.createRange(); rg.selectNodeContents(t); [...rg.getClientRects()].forEach((q) => { textRight = Math.max(textRight, q.right - sr.left); }); });
        const minLeft = textRight + 44, maxRight = sr.width - 20;
        const pctLeft = +el.dataset.l0 / 100 * sr.width; el.style.top = el.dataset.t0;
        let left = Math.max(pctLeft, minLeft), w = w0;
        if (left + w > maxRight) w = Math.max(0, maxRight - left);
        if (w < 170) { w = Math.min(w0, 220); left = sr.width - w - 16; el.style.top = "-1%"; }   // no room beside the heading: tuck it top-right
        el.style.setProperty("--iw", Math.round(w) + "px"); el.style.left = Math.round(left) + "px";
      });
    };
    requestAnimationFrame(() => requestAnimationFrame(fitMain));
    addEventListener("load", fitMain);
    /* --- one bigger side scene per section, peeking in from the edge and tethered to the content by a data line --- */
    const SIDE = { experience: "r", projects: "l", certifications: "r" };
    scenes.forEach((s) => {
      const side = SIDE[s.sec.id]; if (!side || s.isles.length < 2) return;
      s.isles.slice(2).forEach((el) => el.remove()); s.isles.length = 2;
      const el = s.isles[1]; el.classList.add("side-big", "side-" + side);
      const t = document.createElementNS("http://www.w3.org/2000/svg", "svg"); t.setAttribute("class", "tether"); t.setAttribute("aria-hidden", "true"); el.appendChild(t);
    });
    const tetherAll = () => scenes.forEach((s) => {
      const el = s.isles[1]; if (!el || !el.classList.contains("side-big")) return;
      const t = $(".tether", el), head = $(".sec-head", s.sec); if (!t || !head || innerWidth < 760) { if (t) t.innerHTML = ""; return; }
      const right = el.classList.contains("side-r"), hb = head.getBoundingClientRect(), sb = s.sec.getBoundingClientRect();
      // only peek into the free margin beside the content column (more on wide screens), the rest sits off-screen
      const margin = right ? sb.right - hb.right : hb.left - sb.left, w = el.offsetWidth;
      const show = Math.max(110, Math.min(w * .78, margin + 26));
      el.style.setProperty(right ? "right" : "left", -Math.round(w - show) + "px", "important");
      const r = el.getBoundingClientRect();
      const sx = right ? (w - show) + show * .3 : show * .7, sy = r.height * .42;                   // start: inside the visible part of the scene
      const ex = (right ? hb.right + 10 : hb.left - 10) - r.left;                                     // end: at the edge of the content column
      const ey = sy + Math.min(70, r.height * .25);                                                  // gently down to the content edge, at the scene's height
      const d = `M${sx.toFixed(1)} ${sy.toFixed(1)} C ${((sx + ex) / 2).toFixed(1)} ${sy.toFixed(1)}, ${((sx + ex) / 2).toFixed(1)} ${ey.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      t.innerHTML = `<path d="${d}"/><circle class="t-end" cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="3"/><circle class="t-pk" r="2.8"><animateMotion dur="3.2s" repeatCount="indefinite" path="${d}"/></circle><circle class="t-pk t-pk2" r="2.2"><animateMotion dur="3.2s" begin="-1.6s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear" path="${d}"/></circle>`;
    });
    requestAnimationFrame(() => requestAnimationFrame(tetherAll)); addEventListener("load", tetherAll); setTimeout(tetherAll, 1500);
    let tetT = 0; addEventListener("resize", () => { clearTimeout(tetT); tetT = setTimeout(tetherAll, 200); }, { passive: true });
    let fitT = 0; addEventListener("resize", () => { clearTimeout(fitT); fitT = setTimeout(fitMain, 150); }, { passive: true });
    /* --- IoT network: faint links between constellations, packets along every line --- */
    const linkUp = (s) => {
      const box = s.cst.getBoundingClientRect(), svgs = $$(".cst", s.cst), links = $(".iot-links", s.cst);
      if (!svgs.length || !box.width) return;
      const anchor = (svg) => { const d = $$(".cst-dot", svg); const r = d[d.length >> 1].getBoundingClientRect(); return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top]; };
      const pts = svgs.map(anchor).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
      const segs = [];
      // join each constellation to its nearest neighbour that is already in the network
      const done = [pts[0]];
      pts.slice(1).forEach((p) => { let best = done[0]; done.forEach((q) => { if (Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(best[0] - p[0], best[1] - p[1])) best = q; }); segs.push([best, p]); done.push(p); });
      links.setAttribute("viewBox", `0 0 ${box.width.toFixed(0)} ${box.height.toFixed(0)}`);
      links.innerHTML = segs.map(([a, b]) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`).join("");
      s.iotSegs = segs;
    };
    const relinkAll = () => scenes.forEach((s) => { const t = s.cst.style.transform; s.cst.style.transform = "none"; linkUp(s); s.cst.style.transform = t; });
    requestAnimationFrame(() => requestAnimationFrame(relinkAll));
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(relinkAll, 250); }, { passive: true });
    const segPacket = (s, a, b, dur, cls) => {
      const d = document.createElement("i"); d.className = cls; s.cst.appendChild(d);
      const an = d.animate([{ transform: `translate3d(${a[0]}px,${a[1]}px,0)`, opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .85 }, { transform: `translate3d(${b[0]}px,${b[1]}px,0)`, opacity: 0 }], { duration: dur, easing: "ease-in-out" });
      an.onfinish = () => d.remove();
    };
    const iotTick = () => {
      if (!document.hidden && !calm() && !document.body.classList.contains("jumping")) scenes.forEach((s) => {
        if (!s.live) return;
        // a packet hops between two devices
        if (s.iotSegs && s.iotSegs.length && Math.random() < .7) { const [a, b] = s.iotSegs[(Math.random() * s.iotSegs.length) | 0]; Math.random() < .5 ? segPacket(s, a, b, 2600, "iot-packet") : segPacket(s, b, a, 2600, "iot-packet"); }
        // now and then a constellation star sends out a ping
        if (Math.random() < .35) { const dots = $$(".cst-dot", s.cst), dt = dots[(Math.random() * dots.length) | 0];
          if (dt) { const r = dt.getBoundingClientRect(), bx = s.cst.getBoundingClientRect(); const ring = document.createElement("i"); ring.className = "cst-ping"; ring.style.left = (r.left + r.width / 2 - bx.left) + "px"; ring.style.top = (r.top + r.height / 2 - bx.top) + "px"; s.cst.appendChild(ring); setTimeout(() => ring.remove(), 1600); } }
        // and one runs along a line inside a constellation
        const lines = $$(".cst line", s.cst); if (!lines.length) return;
        const ln = lines[(Math.random() * lines.length) | 0], box = s.cst.getBoundingClientRect(), m = ln.ownerSVGElement.getScreenCTM(); if (!m) return;
        const P = (x, y) => { const pt = new DOMPoint(x, y).matrixTransform(m); return [pt.x - box.left, pt.y - box.top]; };
        const A = P(+ln.getAttribute("x1"), +ln.getAttribute("y1")), B = P(+ln.getAttribute("x2"), +ln.getAttribute("y2"));
        Math.random() < .5 ? segPacket(s, A, B, 1400, "iot-packet small") : segPacket(s, B, A, 1400, "iot-packet small");
      });
      setTimeout(iotTick, 900);
    };
    setTimeout(iotTick, 1800);

    /* --- liveness --- */
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const s = scenes.find((x) => x.sec === e.target); if (!s) return;
      s.live = e.isIntersecting; s.ratio = e.intersectionRatio;
      isoAnim(s);
      if (e.isIntersecting && !s.drawn && e.intersectionRatio > .15) { s.drawn = true; s.cst.classList.add("drawn"); setTimeout(() => linkUp(s), 50); }
    }), { threshold: [0, .15, .3, .5, .7] });
    const isoAnim = (s) => s.isles.forEach((el) => el.querySelectorAll("svg").forEach((sv) => { if (!sv.pauseAnimations) return; (s.live && !calm() && !document.hidden) ? sv.unpauseAnimations() : sv.pauseAnimations(); }));
    scenes.forEach(isoAnim);
    new MutationObserver(() => scenes.forEach(isoAnim)).observe(root, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("visibilitychange", () => scenes.forEach(isoAnim));
    scenes.forEach((s) => io.observe(s.sec));

    /* --- one parallax loop: far < mid < islands < near --- */
    let mx = 0, my = 0, tick = false;
    const frame = () => {
      tick = false; if (calm() || document.body.classList.contains("jumping")) return;
      const vh = innerHeight;
      scenes.forEach((s) => {
        if (!s.live) return;
        const r = s.sec.getBoundingClientRect(), p = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
        const m = fine ? 1 : 0;
        s.far.style.transform = `translate3d(${(mx * -4 * m).toFixed(1)}px,${(p * 40).toFixed(1)}px,0)`;
        s.glow.style.transform = `translate3d(${(mx * -10 * m).toFixed(1)}px,${(p * 90).toFixed(1)}px,0)`;
        s.parts.style.transform = `translate3d(${(mx * -16 * m).toFixed(1)}px,${(p * 80 + my * -10 * m).toFixed(1)}px,0)`;
        s.hills.style.transform = `translate3d(${(mx * -6 * m).toFixed(1)}px,${(p * 30).toFixed(1)}px,0)`;
        s.cst.style.transform = `translate3d(0,${(p * 50).toFixed(1)}px,0)`;   // objects stay put under the cursor; only scroll depth moves them
        s.isles.forEach((el) => { const d = +el.dataset.depth; el.style.transform = `translate3d(0,${(p * 90 * d).toFixed(1)}px,0)`; });
        s.near.style.transform = `translate3d(0,${(p * -260).toFixed(1)}px,0)`;
      });
    };
    const req = () => { if (!tick) { tick = true; requestAnimationFrame(frame); } };
    addEventListener("scroll", req, { passive: true }); addEventListener("resize", req, { passive: true });
    if (fine) addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; req(); hot(e); }, { passive: true });
    req();

    /* --- reactive stars: brighten near the cursor, ripple on click --- */
    let hotRaf = 0, hx = 0, hy = 0;
    const hot = (e) => { hx = e.clientX; hy = e.clientY; if (!hotRaf) hotRaf = requestAnimationFrame(() => {
      hotRaf = 0; if (calm()) return;
      scenes.forEach((s) => { if (!s.live) return;
        $$(".sb-p.s, .cst-dot", s.bg).forEach((el) => {
          const b = el.getBoundingClientRect(), dd = Math.hypot(b.left + b.width / 2 - hx, b.top + b.height / 2 - hy);
          const v = dd < 170 ? (1 - dd / 170) : 0; el.style.setProperty("--hot", v.toFixed(2));
        });
      });
    }); };
    document.addEventListener("click", (e) => {
      if (calm() || e.target.closest("a, button, input, .pcard, .feat-card, .cgrid-card, .profile-card, .role-card, .exp-list, .overlay, .qol-overlay, .modal, .term")) return;
      const s = scenes.find((x) => x.live && (() => { const r = x.sec.getBoundingClientRect(); return e.clientY >= r.top && e.clientY <= r.bottom; })()); if (!s) return;
      const r = s.bg.getBoundingClientRect();
      const ring = document.createElement("i"); ring.className = "sb-ping"; ring.style.left = (e.clientX - r.left) + "px"; ring.style.top = (e.clientY - r.top) + "px";
      s.bg.appendChild(ring); setTimeout(() => ring.remove(), 1200);
      $$(".sb-p.s, .cst-dot, .sb-far i", s.bg).map((el) => [el, el.getBoundingClientRect()]).forEach(([el, b]) => {
        const dd = Math.hypot(b.left + b.width / 2 - e.clientX, b.top + b.height / 2 - e.clientY);
        if (dd < 240) { el.style.setProperty("--pd", (dd * 1.6).toFixed(0) + "ms"); el.classList.remove("pulse"); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("pulse"))); setTimeout(() => el.classList.remove("pulse"), 1400); }
      });
    });

    /* --- life: paper planes, shooting stars, Cutiefly visiting constellations --- */
    const mostVisible = () => scenes.filter((s) => s.live).sort((a, b) => b.ratio - a.ratio)[0];
    const plane = (s) => {
      const r = s.bg.getBoundingClientRect(), vTop = Math.max(0, -r.top), y = vTop + rnd(.15, .6) * innerHeight, ltr = Math.random() < .6;
      const el = document.createElement("i"); el.className = "sb-plane"; el.innerHTML = `<svg viewBox="0 0 40 24"><path d="M1 12 L39 1 L24 23 L18 15 Z" fill="#fff" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/><path d="M18 15 L39 1 L14 13" fill="#dfe7fb" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
      el.style.top = y + "px"; s.bg.appendChild(el);
      const W = r.width, kf = []; for (let i = 0; i <= 8; i++) { const u = i / 8; const x = ltr ? -60 + u * (W + 120) : W + 60 - u * (W + 120); kf.push({ transform: `translate3d(${x}px, ${Math.sin(u * Math.PI * 2) * 26 - u * 40}px, 0) rotate(${(Math.cos(u * Math.PI * 2) * 10 - 6) * (ltr ? 1 : -1)}deg) scaleX(${ltr ? 1 : -1})` }); }
      const a = el.animate(kf, { duration: rnd(9000, 13000), easing: "linear" }); a.onfinish = () => el.remove();
    };
    const shoot = (s) => {
      const r = s.bg.getBoundingClientRect(), vTop = Math.max(0, -r.top);
      const el = document.createElement("i"); el.className = "sb-shoot"; el.style.left = rnd(10, 70) + "%"; el.style.top = (vTop + rnd(.05, .35) * innerHeight) + "px"; s.bg.appendChild(el);
      const a = el.animate([{ transform: "translate3d(0,0,0) rotate(24deg) scaleX(.2)", opacity: 0 }, { opacity: 1, offset: .15 }, { transform: "translate3d(340px,150px,0) rotate(24deg) scaleX(1)", opacity: 0 }], { duration: 1100, easing: "cubic-bezier(.3,.6,.4,1)" });
      a.onfinish = () => el.remove();
    };
    const life = () => {
      const s = mostVisible();
      if (s && !document.hidden && !calm() && !document.body.classList.contains("jumping")) {
        const night = /twilight|night/.test(s.sec.dataset.sky || "");
        const roll = Math.random();
        if (roll < (night ? .55 : .3)) shoot(s); else if (roll < .8) plane(s);
        else if (window.__cutieVisit && fine && !document.documentElement.classList.contains("fairy-on")) { const dots = $$(".cst-dot", s.cst).filter((d) => { const b = d.getBoundingClientRect(); return b.top > 80 && b.bottom < innerHeight - 40; }); const d = dots[(Math.random() * dots.length) | 0]; if (d) { const b = d.getBoundingClientRect(); window.__cutieVisit(b.left + b.width / 2, b.top); } }
      }
      setTimeout(life, rnd(6000, 11000));
    };
    setTimeout(life, 4000);
  })();

  /* ---------- BR logo: a tiny terminal · typed in, live path, glitch, click to open the terminal ---------- */
  (() => {
    const br = $(".brand-br"), wrap = $(".br-wrap"), scr = $(".br-scr"), bp = $(".bp-text"); if (!br || !wrap) return;
    const calmNow = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("calm");
    const shown = () => document.body.classList.contains("hero-off") || innerWidth <= 860;
    // A · typed in when the top bar arrives
    let typedAt = 0;
    const type = () => { if (calmNow() || Date.now() - typedAt < 1900) return; typedAt = Date.now(); br.classList.remove("typing"); requestAnimationFrame(() => requestAnimationFrame(() => br.classList.add("typing"))); };
    setTimeout(() => { if (shown()) type(); }, 400);
    let was = shown();
    new MutationObserver(() => { const now = shown(); if (now && !was) { type(); setTimeout(() => setPath(true), 350); } was = now; }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

    // A · live path: the prompt shows which section you're in, like a shell's working directory
    const SECS = [["#top", "~"], ["#experience", "~/experience"], ["#projects", "~/projects"], ["#certifications", "~/certs"], [".footer", "~/contact"]];
    let cur = "~", target = "~", tTimer = 0;
    const step = () => {
      clearTimeout(tTimer);
      if (cur === target) return;
      if (!target.startsWith(cur)) cur = cur.slice(0, -1); else cur = target.slice(0, cur.length + 1);
      bp.textContent = cur; tTimer = setTimeout(step, calmNow() ? 0 : (target.startsWith(cur) ? 38 : 22));
    };
    const setPath = (force) => {
      const mid = scrollY + innerHeight * .4; let t = "~";
      SECS.forEach(([sel, path]) => { const el = $(sel); if (el && el.getBoundingClientRect().top + scrollY <= mid) t = path; });
      if (t !== target || force) { target = t; if (calmNow()) { cur = t; bp.textContent = t; } else step(); }
    };
    let rq = 0; addEventListener("scroll", () => { if (!rq) rq = requestAnimationFrame(() => { rq = 0; setPath(); }); }, { passive: true });
    setPath();

    // B · glitch: red/blue split, scrambles into code, snaps back
    const GL = "#$%&*<>/\\=+{}01ABCDEF";
    const rnd2 = () => GL[(Math.random() * GL.length) | 0] + GL[(Math.random() * GL.length) | 0];
    let glitching = false;
    const glitch = (big) => {
      if (calmNow() || glitching || br.classList.contains("typing") && Date.now() - typedAt < 1900) return;
      glitching = true; wrap.classList.add(big ? "glitch" : "glitch-sm");
      if (big) {
        const seq = [rnd2(), "0x42", "0x52", rnd2(), "BR"]; let i = 0; wrap.classList.add("scr");
        const tick = () => { if (i < seq.length) { scr.textContent = seq[i++]; setTimeout(tick, 70); } else { wrap.classList.remove("scr"); scr.textContent = ""; } };
        tick();
      }
      setTimeout(() => { wrap.classList.remove("glitch", "glitch-sm"); glitching = false; }, big ? 520 : 300);
    };
    wrap.closest(".brand")?.addEventListener("mouseenter", () => glitch(true));
    const idle = () => { setTimeout(() => { if (shown() && !document.hidden) glitch(false); idle(); }, 14000 + Math.random() * 10000); };
    idle();

    // C · click the BR to open the terminal with "whoami" typed in for you
    wrap.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      const tb = $("#term-btn"), tin = $("#term-in"), form = $("#term-form"); if (!tb || !tin) return;
      tb.click(); tin.value = "";
      const word = "whoami"; let i = 0;
      const t = () => { if (i < word.length) { tin.value += word[i++]; setTimeout(t, calmNow() ? 0 : 75); } else setTimeout(() => form && (form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true }))), 180); };
      setTimeout(t, 260);
    });
  })();

  /* ---------- floating ⋯ menu: always reachable, even on the title screen ---------- */
  (() => {
    const more = $("#more"); if (!more) return;
    document.body.appendChild(more); more.classList.add("more-float");
    const pdf = profile.resume;
    const pv = $("#mi-resume"), ct = $("#mi-contact");
    if (!pdf) pv.remove();
    const close = () => { $("#more-panel").hidden = true; $("#more-btn").setAttribute("aria-expanded", "false"); };
    pv && pv.addEventListener("click", () => { close(); $("#resume-btn") ? $("#resume-btn").click() : window.open(pdf, "_blank", "noopener"); });
    ct && ct.addEventListener("click", () => { close(); $("#cta")?.click(); });
    // tidy layout: Résumé · Contact · LinkedIn, then a collapsible Settings group
    const panel = $("#more-panel"), sep = $(".more-sep", panel), li = $("#linkedin-btn");
    if (li && sep) panel.insertBefore(li, sep);
    const tog = document.createElement("button"); tog.className = "more-item more-settings"; tog.setAttribute("aria-expanded", "false"); tog.setAttribute("aria-controls", "more-sub");
    tog.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span>Settings</span><em class="chev" aria-hidden="true">›</em>';
    const sub = document.createElement("div"); sub.className = "more-sub"; sub.id = "more-sub"; sub.hidden = true;
    ["#quick-btn", "#github-btn", "#sound-btn", "#fairy-toggle", "#theme-toggle", "#term-btn", "#keys-btn", "#intro-btn"].forEach((s) => { const el = $(s, panel); if (el) sub.appendChild(el); });
    if (sep) sep.after(tog); else panel.appendChild(tog);
    tog.after(sub);
    tog.addEventListener("click", (e) => { e.stopPropagation(); const open = sub.hidden; sub.hidden = !open; tog.setAttribute("aria-expanded", String(open)); });
    new MutationObserver(() => { if (panel.hidden) { sub.hidden = true; tog.setAttribute("aria-expanded", "false"); } }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
    // "Copy link" next to ⋯ on the title screen
    const cp = document.createElement("button"); cp.type = "button"; cp.className = "copy-link"; cp.setAttribute("aria-label", "Copy a link to this portfolio");
    const cpIdle = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Copy link</span>';
    cp.innerHTML = cpIdle; more.insertBefore(cp, more.firstChild);
    // day / night: always visible next to ⋯
    const dn = document.createElement("button"); dn.type = "button"; dn.className = "daynight";
    dn.innerHTML = '<svg class="dn-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>' +
      '<svg class="dn-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8.3 8.3 0 0 1 9.4 4a8.3 8.3 0 1 0 10.6 10.6Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M17.2 3.4l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z" fill="currentColor"/></svg>';
    const dnSync = () => { const d = document.documentElement.classList.contains("dark"); const t = d ? "Switch to day mode" : "Switch to Twilight mode"; dn.setAttribute("aria-label", t); dn.title = t; };
    dnSync(); new MutationObserver(dnSync).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    dn.addEventListener("click", (e) => { e.stopPropagation(); const tt = $("#theme-toggle"); if (tt) tt.click(); else document.documentElement.classList.toggle("dark"); });
    cp.after(dn);
    const mc = document.createElement("button"); mc.type = "button"; mc.className = "more-item mi-copy";
    const mcIdle = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Copy link</span>';
    mc.innerHTML = mcIdle; panel.insertBefore(mc, panel.firstChild);
    mc.addEventListener("click", async (e) => {
      e.stopPropagation(); const ok = await copyUrl(); Sound.play("select");
      mc.querySelector("span").textContent = ok ? "Link copied ✓" : "Copy failed";
      clearTimeout(mc._t); mc._t = setTimeout(() => { mc.innerHTML = mcIdle; close(); }, 1100);
    });
    const copyUrl = async () => {
      // a link that actually opens: your hosted site, or the preview link while it isn't hosted yet
      const local = location.protocol === "file:" || window.self !== window.top || /^(localhost|127\.|\[::1\])/.test(location.hostname);
      const here = (location.origin + location.pathname).replace(/index\.html?$/i, "");
      const url = (profile.site || "").trim() || (local ? (profile.previewLink || "").trim() : "") || here;
      let ok = false;
      try { await navigator.clipboard.writeText(url); ok = true; } catch (err) {
        const ta = document.createElement("textarea"); ta.value = url; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;left:-9999px;top:0"; document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand("copy"); } catch (err2) {} ta.remove();
      }
      return ok;
    };
    cp.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ok = await copyUrl();
      cp.classList.toggle("done", ok);
      cp.innerHTML = ok ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Copied!</span>' : cpIdle.replace("Copy link", "Copy failed");
      Sound.play("select");
      clearTimeout(cp._t); cp._t = setTimeout(() => { cp.classList.remove("done"); cp.innerHTML = cpIdle; }, 2000);
    });
    // "Copy link" only shows on the untouched title screen: once you scroll at all the top bar can appear, so it steps aside (short landscape screens)
    let onHero = null;
    const sync = () => { const v = !document.body.classList.contains("hero-off") && scrollY < 40; if (v !== onHero) { onHero = v; more.classList.toggle("on-hero", v); } };
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["class"] }); sync();
    addEventListener("scroll", sync, { passive: true });
  })();
})();

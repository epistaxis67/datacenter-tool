/* DATA C€NT€R · Animations-Engine
   Gemeinsamer Code für varianten.html (Vergleich) und tool.html (Video bearbeiten).
   build.py setzt LOGO und SYMS ein und kopiert diese Datei in beide Seiten.
   s.t = Phasenzeit (0–8 s: Anfang · Clip · Ende), s.r = echte Laufzeit (für Laufband und Störungen). */
/* Logo-Formen aus vorlage/data-center-logo.svg (Koordinaten 780 × 460), von build.py eingesetzt */
const LOGO = /*__LOGO_DATA__*/null;
const LW = 780, LH = 460, LA = LW / LH;
const TORN = new Path2D(LOGO.torn);
const LET = LOGO.letters.map(d => new Path2D(d));
const INK = "#050503", RED = "#ff0a22";
const FONT = 'Futura, "Futura PT", "Century Gothic", "Avenir Next", "Helvetica Neue", sans-serif';

const T = 8, I1 = 1.8, O0 = 5.8;           // Anfang 0–1.8 s · Clip mit Laufband · Ende 5.8–8 s
const R = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, p) => a + (b - a) * p;
const easeOut = p => 1 - Math.pow(1 - p, 3);
const easeIn = p => p * p * p;
const easeIO = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const easeBack = p => 1 + 2.7 * Math.pow(p - 1, 3) + 1.7 * Math.pow(p - 1, 2);
const seg = (t, a, b) => clamp((t - a) / (b - a));

/* ── Text ─────────────────────────────────────── */
const DEFAULT_TEXT = `Eröffnung: 11. November 2026 · 18–22 Uhr
Ausstellung: 12. November – 12. Dezember 2026 · nach Vereinbarung

Finissage: 12. Dezember 2026 · ab 19 Uhr bis open end

19:30 Uhr · Performance A11GEL
20 Uhr · T€CHNO Live Act Mistraal
21 Uhr – open end · DJ DATA C€NT€R

DATA TR€$OR
Leipziger Str. 61
Konzulát Studios`;
let LINES = [], ITEMS = [];
function parse(txt) {
  LINES = txt.split("\n").map(l => l.trim().toUpperCase());
  const groups = []; let g = [];
  for (const l of LINES) { if (l) g.push(l); else if (g.length) { groups.push(g); g = []; } }
  if (g.length) groups.push(g);
  ITEMS = groups.map(g => g.join("  ·  "));
}

/* ── Logo zeichnen ────────────────────────────── */
function redFill(x) {
  const g = x.createRadialGradient(390, 235, 0, 390, 235, 460);
  g.addColorStop(0, "#ff0042"); g.addColorStop(.57, "#ff0023"); g.addColorStop(1, "#ff0000"); return g;
}
function drawLogo(x, cx, cy, w, o = {}) {
  const s = w / LW; x.save();
  x.translate(cx - w / 2, cy - LH * s / 2); x.scale(s, s);
  if (o.alpha != null) x.globalAlpha = clamp(o.alpha);
  if (o.bg !== false) {
    if (o.glow) { x.shadowColor = "rgba(255,0,40,.95)"; x.shadowBlur = o.glow; }
    if (o.shadow) { x.shadowColor = "rgba(0,0,0,.7)"; x.shadowBlur = o.shadow; }
    x.fillStyle = o.red || redFill(x); x.fill(TORN); x.shadowBlur = 0;
  }
  if (o.letters !== false) { x.fillStyle = o.ink || INK; const n = o.count ?? LET.length; for (let i = 0; i < n; i++) x.fill(LET[i], "evenodd"); }
  x.restore();
}
function drawLetters(x, cx, cy, h, ink) {                 // nur Schriftzug, Höhe h
  const [bx, by, bw, bh] = LOGO.box, s = h / bh; x.save();
  x.translate(cx - (bx + bw / 2) * s, cy - (by + bh / 2) * s); x.scale(s, s);
  x.fillStyle = ink; LET.forEach(p => x.fill(p, "evenodd")); x.restore();
}
function hole(x, cx, cy, w, fn) {                         // fn() nur innerhalb der Riss-Fläche
  const s = w / LW; x.save(); x.translate(cx - w / 2, cy - LH * s / 2); x.scale(s, s);
  x.clip(TORN); x.setTransform(1, 0, 0, 1, 0, 0); fn(); x.restore();
}
/* ── Symbole (svg/symbol-*.svg, von build.py eingesetzt) ── */
const SYMS = /*__SYMS__*/null;
const SK = Object.keys(SYMS), symCache = {};
function symImg(k, col) {
  const key = k + col;
  if (!symCache[key]) { const im = new Image(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SYMS[k].replaceAll("currentColor", col)); symCache[key] = im; }
  return symCache[key];
}
function drawSym(x, k, cx, cy, size, col, alpha = 1, rot = 0) {
  const im = symImg(SK[((k % SK.length) + SK.length) % SK.length], col);
  if (!im.complete || !im.naturalWidth || alpha <= 0) return;
  x.save(); x.globalAlpha *= clamp(alpha); x.translate(cx, cy); if (rot) x.rotate(rot);
  x.drawImage(im, -size / 2, -size / 2, size, size); x.restore();
}
function burst(x, cx, cy, dist, size, alpha, seed = 0) {   // Symbole fliegen sternförmig aus der Mitte
  for (let k = 0; k < 10; k++) {
    const a = k / 10 * Math.PI * 2 + R(k + seed) * .5, d = dist * (.8 + R(k * 3 + seed) * .5);
    drawSym(x, k, cx + Math.cos(a) * d, cy + Math.sin(a) * d * .9, size * (.7 + R(k * 7) * .6), k % 2 ? RED : "#e6e6e6", alpha, (R(k + 5) - .5) * 1.2);
  }
}
function black(x, W, H, a = 1) { x.globalAlpha = a; x.fillStyle = "#000"; x.fillRect(0, 0, W, H); x.globalAlpha = 1; }

/* ── Laufband ─────────────────────────────────── */
function tornBand(W, y0, h, seed) {
  const p = new Path2D(), st = h * .28, a = h * .09;
  p.moveTo(-st, y0);
  for (let xx = -st, i = 0; xx <= W + st; xx += st, i++) p.lineTo(xx, y0 + (R(seed + i) - .5) * a * 2 - (R(seed + i * 7) > .88 ? a * 1.8 : 0));
  for (let xx = W + st, i = 0; xx >= -st; xx -= st, i++) p.lineTo(xx, y0 + h + (R(seed * 3 + i) - .5) * a * 2 + (R(seed + i * 5) > .88 ? a * 1.8 : 0));
  p.closePath(); return p;
}
function metal(x, x0, y0, w, h, u) {                      // Wellblech wie die Wand im Foto
  const g = x.createLinearGradient(0, y0, 0, y0 + h);
  g.addColorStop(0, "#d6d9de"); g.addColorStop(.5, "#a9adb4"); g.addColorStop(1, "#cdd0d5");
  x.fillStyle = g; x.fillRect(x0, y0, w, h);
  const gs = Math.max(3, u * .014);
  for (let yy = y0; yy < y0 + h; yy += gs) {
    x.fillStyle = "rgba(255,255,255,.5)"; x.fillRect(x0, yy, w, gs * .35);
    x.fillStyle = "rgba(55,58,66,.3)"; x.fillRect(x0, yy + gs * .5, w, gs * .3);
  }
}
function sepW(k, h) {
  return k === "letters" ? h * .5 * LOGO.box[2] / LOGO.box[3] : k === "logo" ? h * .95 * LA : k === "cursor" ? h * .3 : k === "sym" ? h * .7 : h * .22;
}
function drawSep(x, o, cx, cy, h, t, idx = 0) {
  const k = o.sep;
  if (k === "sym") drawSym(x, idx, cx, cy, h * .72, o.sepCol || o.fg);
  else if (k === "letters") drawLetters(x, cx, cy, h * .5, o.fg);
  else if (k === "logo") drawLogo(x, cx, cy, h * .95 * LA);
  else if (k === "cursor") { if (Math.floor(t * 3) % 2 === 0) { x.fillStyle = o.fg; x.fillRect(cx - h * .15, cy - h * .24, h * .3, h * .48); } }
  else { x.fillStyle = o.sepCol || o.fg; x.beginPath(); x.arc(cx, cy, h * .09, 0, 7); x.fill(); }
}
function ticker(x, s, o) {
  const { W } = s, t = s.r ?? s.t, h = o.h, y = o.y, items = o.items || ITEMS, rv = o.reveal ?? 1, dir = o.dir ?? 1;
  if (rv <= 0 || !items.length) return;
  x.save();
  const rw = W * rv; x.beginPath(); x.rect(dir > 0 ? 0 : W - rw, y - h, rw, h * 2); x.clip();
  if (o.alpha != null) x.globalAlpha = clamp(o.alpha);
  if (o.bg === "metal") metal(x, 0, y - h / 2, W, h, s.u);
  else if (o.bg) { x.fillStyle = o.bg; if (o.torn) x.fill(tornBand(W, y - h / 2, h, o.seed || 1)); else x.fillRect(0, y - h / 2, W, h); }
  x.font = `500 ${Math.round(h * (o.fs || .46))}px ${FONT}`; x.textBaseline = "middle"; x.textAlign = "left";
  if ("letterSpacing" in x) x.letterSpacing = (h * .07).toFixed(1) + "px";
  const gap = h * .55, sw = sepW(o.sep, h);
  let L = 0; const seq = items.map((tx, i) => { const w = x.measureText(tx).width, e = { tx, w, at: L, i }; L += w + gap * 2 + sw; return e; });
  const off = (t * (o.speed || 1.6) * h) % L;
  for (let base = dir > 0 ? -off : off - L, rep = 0; base < W; base += L, rep++) for (const e of seq) {
    const x0 = base + e.at; if (x0 > W) break;
    if (x0 + e.w + gap * 2 + sw < 0) continue;
    if (o.shadow) { x.shadowColor = "rgba(0,0,0,.8)"; x.shadowBlur = h * .18; }
    x.fillStyle = o.fg; x.fillText(e.tx, x0, y + h * .04); x.shadowBlur = 0;
    drawSep(x, o, x0 + e.w + gap + sw / 2, y, h, t, e.i + rep * seq.length + (o.symShift || 0));
  }
  x.restore();
}
const bandIn = t => easeOut(seg(t, I1 - .05, I1 + .5));
const bandOut = t => 1 - easeIn(seg(t, O0, O0 + .35));

/* ── Platzhalter-Clip: Serverraum ─────────────── */
function drawClip(x, W, H, t) {
  const u = Math.min(W, H);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#10131a"); g.addColorStop(1, "#040508");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const cw = u * .24, gap = u * .06, step = cw + gap, travel = t * u * .06, pan = travel % step, i0 = Math.floor(travel / step);
  const ry = H * .1, rh = H * .8, rows = 16;
  for (let i = -1; i * step - pan < W; i++) {
    const rx = i * step - pan, id = i + i0;
    x.fillStyle = "#171b24"; x.fillRect(rx, ry, cw, rh);
    for (let r = 0; r < rows; r++) {
      const yy = ry + rh * (r + .5) / rows;
      x.fillStyle = "#222835"; x.fillRect(rx + cw * .06, yy - rh / rows * .36, cw * .88, rh / rows * .72);
      for (let k = 0; k < 4; k++) {
        const on = R(id * 31 + r * 7 + k * 3 + Math.floor(t * 4 + R(id + r * 3 + k) * 4)) > .45;
        x.fillStyle = on ? (k === 0 && R(id + r) > .7 ? "#ff1f2e" : "#3dff9e") : "#2c313c";
        x.fillRect(rx + cw * .12 + k * cw * .09, yy - u * .005, u * .01, u * .01);
      }
    }
  }
  const fl = x.createLinearGradient(0, H * .75, 0, H); fl.addColorStop(0, "rgba(0,0,0,0)"); fl.addColorStop(1, "rgba(0,0,0,.8)");
  x.fillStyle = fl; x.fillRect(0, H * .75, W, H * .25);
  x.fillStyle = "rgba(255,255,255,.55)"; x.font = `500 ${Math.round(u * .065)}px ${FONT}`; x.textAlign = "center"; x.textBaseline = "middle";
  if ("letterSpacing" in x) x.letterSpacing = (u * .02).toFixed(1) + "px";
  x.fillText("DEIN CLIP", W / 2, H * .5);
  if ("letterSpacing" in x) x.letterSpacing = "0px";
}

/* ── Infotafel (Ende von V5) ──────────────────── */
function board(x, s, q) {
  const { W, H } = s, P = H >= W;
  drawLogo(x, P ? W / 2 : W * .25, P ? H * .17 : H * .5, P ? W * .74 : W * .4, { alpha: q * 4 });
  const x0 = P ? W * .09 : W * .5, y0 = P ? H * .34 : H * .1, aw = P ? W * .82 : W * .45, ah = P ? H * .6 : H * .8;
  const layout = fs => {
    x.font = `500 ${fs}px ${FONT}`; if ("letterSpacing" in x) x.letterSpacing = (fs * .06).toFixed(1) + "px";
    const rows = [];
    for (const l of LINES) {
      if (!l) { rows.push(null); continue; }
      if (x.measureText(l).width <= aw) { rows.push({ t: l }); continue; }
      // zu lang: zuerst an „·“ trennen, dann Wortumbruch; Folgezeilen eingerückt
      l.split(" · ").forEach((part, pi) => {
        let cur = pi ? "   " : "";
        for (const w of part.split(" ")) {
          const next = cur.trim() ? cur + " " + w : cur + w;
          if (x.measureText(next).width > aw && cur.trim()) { rows.push({ t: cur }); cur = "   " + w; }
          else cur = next;
        }
        rows.push({ t: cur });
      });
    }
    const hgt = rows.reduce((a, r) => a + (r ? fs * 1.55 : fs * .8), 0);
    return { rows, hgt };
  };
  let fs = P ? W * .043 : H * .045, L = layout(fs);
  if (L.hgt > ah) { fs *= ah / L.hgt; L = layout(fs); }
  x.textBaseline = "top"; x.textAlign = "left";
  let yy = P ? y0 : y0 + (ah - L.hgt) / 2, i = 0;           // quer: Textblock senkrecht mittig
  for (const r of L.rows) {
    if (!r) { yy += fs * .8; continue; }
    const a = clamp((q - .1 - i * .045) / .12); i++;
    if (a > 0) {
      x.globalAlpha = a; let f = fs; const w = x.measureText(r.t).width;
      if (w > aw) { f = fs * aw / w; x.font = `500 ${f}px ${FONT}`; }
      const m = r.t.match(/^([A-ZÄÖÜ]+:)(.*)$/), xx = x0 + (1 - easeOut(a)) * fs * 2;
      if (m) { x.fillStyle = RED; x.fillText(m[1], xx, yy); x.fillStyle = "#f2f2f2"; x.fillText(m[2], xx + x.measureText(m[1]).width, yy); }
      else { x.fillStyle = "#f2f2f2"; x.fillText(r.t, xx, yy); }
      if (f !== fs) x.font = `500 ${fs}px ${FONT}`;
      x.globalAlpha = 1;
    }
    yy += fs * 1.55;
  }
  if ("letterSpacing" in x) x.letterSpacing = "0px";
  // Symbolreihe: hoch unten, quer unter dem Logo
  const sz = P ? W * .11 : H * .1, sy = P ? H * .935 : H * .82, sx0 = P ? W / 2 : W * .25, step = sz * 1.45;
  for (let k = 0; k < 5; k++) {
    const a = clamp((q - .55 - k * .06) / .12);
    drawSym(x, k, sx0 + (k - 2) * step, sy + (1 - easeOut(a)) * sz * .4, sz, k % 2 ? "#f2f2f2" : RED, a);
  }
}

/* ── Glitch-Hilfe ─────────────────────────────── */
function logoLayer(s, w) { const mx = s.m.getContext("2d"); mx.clearRect(0, 0, s.W, s.H); drawLogo(mx, s.W / 2, s.H / 2, w); return s.m; }
function glitchImg(x, src, W, H, amt, sd, onBlack) {
  x.drawImage(src, 0, 0);
  if (amt <= 0) return;
  x.save(); x.globalCompositeOperation = "lighter"; x.globalAlpha = .4 * amt; x.drawImage(src, W * .03 * amt * (R(sd) - .3), 0); x.restore();
  for (let k = 0; k < 7; k++) {
    if (R(sd + k * 7) > amt) continue;
    const y0 = R(sd + k * 3) * H, hh = H * (.008 + R(sd + k * 5) * .05), dx = (R(sd + k * 11) - .5) * W * .3 * amt;
    if (onBlack) { x.fillStyle = "#000"; x.fillRect(0, y0, W, hh); }
    x.drawImage(src, 0, y0, W, hh, dx, y0, W, hh);
  }
}

/* ── Varianten ────────────────────────────────── */
const V = [
{ name: "RISS",
  a: "Die rote Fläche platzt ins Bild, die Symbole fliegen wie Splitter heraus, der Schriftzug schlägt ein. Dann reißt das Logo auf: Durch den Riss zoomt die Kamera in den Clip.",
  l: "Ein rot ausgerissener Streifen unten, schwarze Schrift, zwischen den Blöcken der kleine Schriftzug.",
  e: "Der Riss schließt sich um den Clip, das Logo steht, die Symbole splittern ein letztes Mal heraus.",
  k: "Am nächsten am Ausstellungsplakat. Der Riss ist das Motiv.",
  draw(x, s) {
    const { W, H, t, clip, big, u, P } = s, cx = W / 2, cy = H / 2, sd = Math.floor(t * 24);
    const cover = Math.max(W / .8, H / .72 * LA) * 1.25;
    const band = (a = 1) => ticker(x, s, { y: H * (P ? .82 : .84), h: u * .09, bg: RED, torn: true, seed: 3, fg: INK, sep: "letters", reveal: bandIn(t) * bandOut(t), alpha: a });
    if (t < I1) {
      black(x, W, H);
      if (t < 1.15) {
        const p = easeBack(seg(t, 0, .4)), sh = t < .55 ? u * .03 * (1 - seg(t, .3, .55)) : 0;
        burst(x, cx, cy, big * .75 * easeOut(seg(t, .05, .8)), u * .18, 1 - seg(t, .55, 1.1));
        drawLogo(x, cx + (R(sd) - .5) * sh, cy + (R(sd + 9) - .5) * sh, big * p, { letters: t > .3 || R(sd) > .7 });
        return;
      }
      const p = easeIn(seg(t, 1.15, I1)), w = lerp(big, cover, p);
      hole(x, cx, cy, w, () => x.drawImage(clip, 0, 0));
      drawLogo(x, cx, cy, w, { bg: false, alpha: 1 - p * 2.5 });
      return;
    }
    if (t < O0) { x.drawImage(clip, 0, 0); band(); return; }
    const q = seg(t, O0, T);
    black(x, W, H);
    if (q < .45) {
      const p = easeOut(q / .45), w = lerp(cover, big, p);
      hole(x, cx, cy, w, () => { x.drawImage(clip, 0, 0); if (q < .15) band(1 - q / .15); });
      drawLogo(x, cx, cy, w, { bg: false, alpha: seg(q, .25, .45) });
      return;
    }
    const p = seg(q, .45, .62);
    hole(x, cx, cy, big, () => x.drawImage(clip, 0, 0));
    drawLogo(x, cx, cy, big, { letters: false, alpha: p });
    const sh = q > .62 && q < .72 ? u * .02 : 0;
    if (q > .62) burst(x, cx, cy, big * .75 * easeOut(seg(q, .62, 1)), u * .17, 1 - seg(q, .78, 1), 3);
    drawLogo(x, cx + (R(sd) - .5) * sh, cy + (R(sd + 4) - .5) * sh, big, { bg: false });
  } },

{ name: "BÄNDER",
  a: "Rote und schwarze Laufbänder fahren von beiden Seiten ein und füllen das Bild, das Logo springt in die Mitte. Dann fahren die Bänder auseinander und geben den Clip frei.",
  l: "Zwei Bänder gegenläufig: oben schwarz mit roter Schrift (Termine), unten rot mit schwarzer Schrift (Programm, Ort). Die Symbole wechseln sich als Trenner ab, auch in den Bändern am Anfang und Ende.",
  e: "Die Bänder schließen sich wieder über dem Clip, das Logo springt zurück.",
  k: "Laut und rhythmisch, passt zum Techno-Abend.",
  draw(x, s) {
    const { W, H, t, clip, big, u, P } = s, cx = W / 2, cy = H / 2;
    const stack = f => {
      const N = P ? 9 : 6, h = H / N;
      for (let i = 0; i < N; i++) {
        const d = i % 2 ? 1 : -1; x.save(); x.translate(f(i) * W * d, 0);
        ticker(x, s, { y: (i + .5) * h, h: h + 1, bg: i % 2 ? "#0a0a0a" : RED, fg: i % 2 ? RED : INK, dir: d, speed: 2.4, items: ["DATA C€NT€R"], sep: "sym", symShift: i * 2, fs: .5 });
        x.restore();
      }
    };
    const half = Math.ceil(ITEMS.length / 2);
    const bands = (a = 1) => {
      const rv = bandIn(t) * bandOut(t), h = u * .075;
      ticker(x, s, { y: H * (P ? .1 : .1), h, bg: "#0a0a0a", fg: RED, dir: -1, sep: "sym", items: ITEMS.slice(0, half), reveal: rv, alpha: a });
      ticker(x, s, { y: H * (P ? .88 : .88), h, bg: RED, fg: INK, dir: 1, sep: "sym", symShift: 2, items: ITEMS.slice(half), reveal: rv, alpha: a });
    };
    if (t < I1) {
      if (t < 1.2) {
        black(x, W, H); stack(i => 1 - easeOut(seg(t, i * .04, .45 + i * .04)));
        if (t > .45) drawLogo(x, cx, cy, big * easeBack(seg(t, .45, .8)), { shadow: big * .1 });
        return;
      }
      const p = easeIn(seg(t, 1.2, I1));
      x.drawImage(clip, 0, 0); stack(i => easeIn(seg(t, 1.2 + i * .03, 1.6 + i * .03)));
      drawLogo(x, cx, cy, big * (1 + p * .6), { alpha: 1 - p * 1.4 });
      return;
    }
    if (t < O0) { x.drawImage(clip, 0, 0); bands(); return; }
    const q = seg(t, O0, T);
    x.drawImage(clip, 0, 0);
    stack(i => 1 - easeOut(seg(q, i * .03, .35 + i * .03)));
    if (q > .4) drawLogo(x, cx, cy, big * easeBack(seg(q, .4, .6)), { shadow: big * .1 });
  } },

{ name: "STÖRUNG",
  a: "Das Logo flackert aus dem Schwarz wie ein gestörtes Signal, Bildzeilen springen, für einzelne Bilder blitzen Symbole auf. Dann zerfällt es in Streifen, durch die der Clip durchkommt.",
  l: "Schwarzer Datenstreifen, rote Schrift, blinkender Cursor als Trenner. Ab und zu springt das Band kurz, dabei blitzt ein Symbol im Bild auf.",
  e: "Der Clip bricht zeilenweise weg, das Logo kommt gestört zurück und schaltet sich am Ende ab.",
  k: "Technisch, nervös, Rechenzentrum mit Störung.",
  draw(x, s) {
    const { W, H, t, clip, big, u, P } = s, r = s.r ?? t, sd = Math.floor(r * 24), n = 16;
    const band = (a = 1) => {
      const g = (r % 1.6) > 1.42, j = g ? (R(sd) - .5) * u * .06 : 0, o = { y: H * .86, h: u * .075, bg: "rgba(0,0,0,.85)", fg: RED, sep: "cursor", reveal: bandIn(t) * bandOut(t), alpha: a };
      x.save(); x.translate(j, 0); ticker(x, s, o); x.restore();
      if (g) { x.save(); x.globalAlpha = .55; x.translate(-j * 1.6, u * .005); ticker(x, s, { ...o, bg: null, fg: "#fff" }); x.restore(); flash(.6); }
    };
    const flash = (chance) => {                        // einzelne Bilder: Symbol blitzt irgendwo auf
      if (R(sd * 1.31) > chance) return;
      const k = Math.floor(R(sd * 2.17) * 5), sz = u * (.18 + R(sd * 3.1) * .25);
      const fx = W * (.15 + R(sd * 4.7) * .7), fy = H * (.15 + R(sd * 5.3) * .6);
      drawSym(x, k, fx, fy, sz, R(sd) > .4 ? RED : "#fff", .9);
      x.save(); x.globalCompositeOperation = "lighter"; drawSym(x, k, fx + sz * .05, fy, sz, "#00e5ff", .35); x.restore();
    };
    if (t < I1) {
      black(x, W, H);
      const L = logoLayer(s, big);
      if (t < .35) { if (R(sd) > .5) glitchImg(x, L, W, H, 1, sd, true); return; }
      if (t < 1.15) { glitchImg(x, L, W, H, R(sd) > .85 ? .9 : (1 - seg(t, .35, 1.0)) * .8, sd, true); flash(.3); return; }
      const p = easeIO(seg(t, 1.15, I1));
      x.drawImage(clip, 0, 0);
      for (let i = 0; i < n; i++) if (R(i * 3.7) > p) { x.fillStyle = "#000"; x.fillRect(0, i * H / n, W, H / n + 1); }
      x.save(); x.globalAlpha = 1 - p; glitchImg(x, L, W, H, .6 + p * .4, sd, false); x.restore();
      return;
    }
    if (t < O0) { x.drawImage(clip, 0, 0); band(); return; }
    const q = seg(t, O0, T), L = logoLayer(s, big);
    if (q < .4) {
      const p = easeIO(q / .4);
      x.drawImage(clip, 0, 0); band(1 - seg(q, 0, .15));
      for (let i = 0; i < n; i++) if (R(i * 5.3) < p) { x.fillStyle = "#000"; x.fillRect(0, i * H / n, W, H / n + 1); }
      x.save(); x.globalAlpha = p; glitchImg(x, L, W, H, 1 - p * .7, sd, false); x.restore();
      return;
    }
    black(x, W, H);
    if (q < .85) { glitchImg(x, L, W, H, R(sd) > .8 ? .7 : .05, sd, true); flash(.3); return; }
    if (R(sd) > seg(q, .85, 1) * 1.1) glitchImg(x, L, W, H, .5, sd, true);
  } },

{ name: "WELLBLECH",
  a: "Wie im Foto: Wellblechwand mit eingeprägten Symbolen, das Logo leuchtet auf wie eine Neonröhre. Dann teilt sich die Wand in vier Platten, die auseinanderfahren.",
  l: "Ein Streifen Wellblech mit schwarzer Schrift, rote Symbole als Trenner.",
  e: "Die vier Platten fahren wieder zusammen, das Logo flackert und glüht nach.",
  k: "Ruhiger, edler. Holt die echte Ausstellungswand in den Clip.",
  draw(x, s) {
    const { W, H, t, clip, big, u, P } = s, cx = W / 2, cy = H / 2, sd = Math.floor(t * 24);
    const band = (a = 1) => ticker(x, s, { y: H * .85, h: u * .085, bg: "metal", fg: INK, sep: "sym", sepCol: RED, reveal: bandIn(t) * bandOut(t), alpha: a });
    const wall = (on, glow) => {
      const mx = s.m.getContext("2d"); metal(mx, 0, 0, W, H, u);
      // Symbole als Prägung im Blech: dunkle Kante + helle Kante versetzt
      const row = (yy, k0) => { for (let k = 0; k < 5; k++) {
        const sx = W * (.14 + k * .18), sz = u * (P ? .13 : .12);
        drawSym(mx, k + k0, sx + 1, yy + 1, sz, "#ffffff", .55); drawSym(mx, k + k0, sx, yy, sz, "#4a4e56", .55);
      } };
      if (P) { row(H * .17, 0); row(H * .83, 2); } else { row(H * .15, 0); row(H * .86, 2); }
      mx.fillStyle = "rgba(40,42,48,.55)"; mx.fillRect(W / 2 - 1, 0, 2, H); mx.fillRect(0, H / 2 - 1, W, 2);
      mx.fillStyle = "rgba(0,0,0," + (.55 - glow * .4) + ")"; mx.fillRect(0, 0, W, H);
      if (on) drawLogo(mx, cx, cy, big, { glow: big * .18 * glow });
      return s.m;
    };
    const split = (src, p) => {
      for (let k = 0; k < 4; k++) {
        const sx = (k % 2) * W / 2, sy = (k > 1 ? 1 : 0) * H / 2, dx = (k % 2 ? 1 : -1) * p * W * .56, dy = (k > 1 ? 1 : -1) * p * H * .56;
        x.save(); x.shadowColor = "rgba(0,0,0,.7)"; x.shadowBlur = u * .05 * Math.min(1, p * 8);
        x.drawImage(src, sx, sy, W / 2, H / 2, sx + dx, sy + dy, W / 2, H / 2); x.restore();
      }
    };
    if (t < I1) {
      const on = t > .15 && (t > .7 || R(sd) > .45), glow = easeOut(seg(t, .15, .9));
      const src = wall(on, glow);
      if (t < 1.1) { x.drawImage(src, 0, 0); return; }
      x.drawImage(clip, 0, 0); split(src, easeIn(seg(t, 1.1, I1)));
      return;
    }
    if (t < O0) { x.drawImage(clip, 0, 0); band(); return; }
    const q = seg(t, O0, T);
    const on = q < .5 || q > .62 || R(sd) > .5, src = wall(on, q < .5 ? .6 : 1);
    x.drawImage(clip, 0, 0); band(1 - seg(q, 0, .15));
    if (q < .45) split(src, 1 - easeOut(q / .45)); else x.drawImage(src, 0, 0);
  } },

{ name: "PROGRAMM",
  a: "Der Schriftzug tippt sich Buchstabe für Buchstabe ins Schwarz, dahinter wächst die rote Fläche. Dann schiebt sich das Logo nach oben weg und zieht den Clip hinter sich auf.",
  l: "Freistehende weiße Laufschrift ohne Band, das ganze Logo als Trenner.",
  e: "Eine schwarze Tafel fährt hoch: Logo, das komplette Programm Zeile für Zeile und darunter die fünf Symbole, als Standbild zum Lesen.",
  k: "Am informativsten. Das Ende funktioniert auch als Story-Kachel.",
  draw(x, s) {
    const { W, H, t, clip, big, u, P } = s, cx = W / 2, cy = H / 2;
    const band = (a = 1) => ticker(x, s, { y: H * (P ? .1 : .13), h: u * .1, fg: "#fff", shadow: true, sep: "logo", fs: .48, reveal: bandIn(t) * bandOut(t), alpha: a });
    if (t < I1) {
      black(x, W, H);
      const n = Math.min(LET.length, Math.floor(seg(t, .05, .85) * (LET.length + 1)));
      const r = seg(t, .85, 1.15), lift = easeIn(seg(t, 1.3, I1)), ly = cy - lift * H * .75;
      if (lift > 0) { x.drawImage(clip, 0, 0); x.fillStyle = "#000"; x.fillRect(0, 0, W, H * (1 - lift)); }
      if (r > 0) drawLogo(x, cx, ly, big * lerp(.85, 1, easeBack(r)), { letters: false, alpha: r });
      drawLogo(x, cx, ly, big, { bg: false, ink: r > .4 ? INK : "#fff", count: n });
      return;
    }
    if (t < O0) { x.drawImage(clip, 0, 0); band(); return; }
    const q = seg(t, O0, T), p = easeOut(seg(q, 0, .22));
    x.drawImage(clip, 0, 0); band(1 - seg(q, 0, .12));
    x.fillStyle = "#08080a"; x.fillRect(0, H * (1 - p), W, H * p + 1);
    if (q > .18) board(x, s, seg(q, .18, .9));
  } }
];

/* ── Echte Videozeit → Phasenzeit ─────────────────
   Anfang (1,8 s) und Ende (2,2 s) bleiben gleich lang, dazwischen läuft das Laufband
   so lange wie das Video. Sehr kurze Clips (unter ~5 s) werden insgesamt gestaucht. */
function phaseTime(tr, D) {
  const outro = T - O0, hold = I1 + .6;               // hold = Laufband ist ganz eingefahren
  if (D < hold + outro + .4) return clamp(tr * T / D, 0, T);
  if (tr < hold) return tr;
  const oStart = D - outro;
  if (tr >= oStart) return Math.min(T, O0 + (tr - oStart));
  return hold;
}

/* the p5 overlay: a wake of binary behind the cursor, and a ripple wherever anything is clicked */
(() => {
  if (typeof window.p5 !== 'function') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const GLYPH_STEP = 15;      /* px of travel between two characters */
  const GLYPH_DECAY = 0.026;  /* ~40 frames, so the trail clears before it crowds the page */
  const GLYPH_MAX = 90;
  const RING_LIFE = 26;       /* under half a second */
  const RING_REACH = 44;      /* px of radius the single ring travels */
  const DROP_MAX = 8;

  const glyphs = [];
  const drops = [];
  const room = document.getElementById('room');
  const page = document.getElementById('page-table');

  const pointer = { x: -1e4, y: -1e4 };
  const lastSpawn = { x: -1e4, y: -1e4 };

  /* the ink follows whatever the user is looking through */
  function ink() {
    if (page.classList.contains('is-open')) return [150, 224, 255];
    return room.classList.contains('is-lit') ? [58, 49, 38] : [240, 230, 213];
  }

  function spawnGlyph() {
    const a = Math.random() * Math.PI * 2;
    const spread = 3 + Math.random() * 13;
    glyphs.push({
      ch: Math.random() < 0.5 ? '0' : '1',
      x: pointer.x + Math.cos(a) * spread,
      y: pointer.y + Math.sin(a) * spread,
      vx: (Math.random() - 0.5) * 0.45,
      vy: 0.2 + Math.random() * 0.55,
      size: 9 + Math.random() * 7,
      rot: (Math.random() - 0.5) * 0.6,
      life: 1,
    });
    if (glyphs.length > GLYPH_MAX) glyphs.shift();
    lastSpawn.x = pointer.x;
    lastSpawn.y = pointer.y;
  }

  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  }, { passive: true });

  window.addEventListener('pointerdown', (e) => {
    drops.push({ x: e.clientX, y: e.clientY, t: 0 });
    if (drops.length > DROP_MAX) drops.shift();
  }, { passive: true });

  new window.p5((p) => {
    p.setup = () => {
      const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
      cnv.style('position', 'fixed');
      cnv.style('left', '0');
      cnv.style('top', '0');
      cnv.style('z-index', '85');
      cnv.style('pointer-events', 'none');
      p.textFont('"Space Grotesk", ui-monospace, monospace');
      p.textAlign(p.CENTER, p.CENTER);
    };

    p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);

    p.draw = () => {
      p.clear();
      if (!glyphs.length && !drops.length) return;
      const [ir, ig, ib] = ink();

      if (Math.hypot(pointer.x - lastSpawn.x, pointer.y - lastSpawn.y) > GLYPH_STEP) spawnGlyph();
      drawGlyphs(ir, ig, ib);
      drawDrops(ir, ig, ib);
    };

    function drawGlyphs(ir, ig, ib) {
      for (let i = glyphs.length - 1; i >= 0; i -= 1) {
        const g = glyphs[i];
        g.life -= GLYPH_DECAY;
        if (g.life <= 0) { glyphs.splice(i, 1); continue; }
        g.x += g.vx;
        g.y += g.vy;
        g.vy *= 0.97;
        p.push();
        p.translate(g.x, g.y);
        p.rotate(g.rot);
        p.fill(ir, ig, ib, Math.pow(g.life, 1.5) * 128);
        p.noStroke();
        p.textSize(g.size);
        p.text(g.ch, 0, 0);
        p.pop();
      }
    }

    /* one short ring and a dot where the click landed, then nothing */
    function drawDrops(ir, ig, ib) {
      for (let i = drops.length - 1; i >= 0; i -= 1) {
        const d = drops[i];
        d.t += 1;
        if (d.t > RING_LIFE) { drops.splice(i, 1); continue; }
        const u = d.t / RING_LIFE;
        const radius = (1 - Math.pow(1 - u, 2.4)) * RING_REACH;
        p.noFill();
        p.stroke(ir, ig, ib, Math.pow(1 - u, 1.6) * 120);
        p.strokeWeight(Math.max(0.4, 1.2 - u * 0.9));
        p.ellipse(d.x, d.y, radius * 2, radius * 1.8);
        /* the contact point, gone within a few frames */
        if (d.t < 8) {
          const k = d.t / 8;
          p.noStroke();
          p.fill(ir, ig, ib, (1 - k) * 90);
          p.ellipse(d.x, d.y, 8 * (1 - k * 0.5), 6 * (1 - k * 0.5));
        }
      }
    }
  });
})();

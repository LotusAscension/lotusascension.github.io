(() => {
  const body = document.body;
  const level = +body.dataset.level || 0;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  const pages = [
    ["index.html", "The Mud"],
    ["prism-intelligence.html", "Prism Intelligence"],
    ["lotus-labs-x.html", "Lotus Labs X"],
    ["purple-circuit.html", "Purple Circuit"],
    ["quantum-lotus.html", "Quantum Lotus"],
    ["aether-lotus.html", "Aether Lotus"],
    ["project-violet.html", "Project Violet"],
  ];

  // ---------- build the sky ----------
  const sky = document.createElement("div");
  sky.className = "sky";
  sky.innerHTML =
    '<div class="aura a1"></div><div class="aura a2"></div><div class="aura a3"></div>' +
    '<canvas id="motes"></canvas><div class="grain"></div><div class="vignette"></div>';
  body.prepend(sky);
  const spot = document.createElement("div");
  spot.className = "spot";
  const core = document.createElement("div");
  core.className = "core";
  const mist = document.createElement("div");
  mist.className = "mist";
  mist.innerHTML = "<i></i><i></i><i></i>";
  body.append(spot, core, mist);

  // ---------- landing: if we arrived through the mist, lift it away ----------
  if (sessionStorage.getItem("mist")) {
    sessionStorage.removeItem("mist");
    mist.classList.add("cover", "instant");
    body.classList.add("arriving");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      mist.classList.remove("instant", "cover");
      mist.classList.add("lift");
    }));
    setTimeout(() => { mist.classList.remove("lift"); body.classList.remove("arriving"); }, 2600);
  }
  // bfcache: coming back with the Back button must not leave the mist covering the page
  addEventListener("pageshow", (e) => {
    if (e.persisted) { mist.className = "mist"; body.classList.remove("leaving"); }
  });

  // ---------- leaving: rise into the mist, then navigate ----------
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const href = a.getAttribute("href");
    const u = new URL(href, location.href);
    if (u.origin !== location.origin || a.getAttribute("target") || u.pathname === location.pathname || reduce) return;
    e.preventDefault();
    sessionStorage.setItem("mist", "1");
    body.classList.add("leaving");
    mist.classList.add("cover");
    setTimeout(() => (location.href = u.href), 1250);
  });

  // ---------- altitude gauge ----------
  const nav = document.createElement("nav");
  nav.className = "ascent";
  nav.setAttribute("aria-label", "Ascent");
  nav.innerHTML = "<i></i>" + pages.map(([href, label], i) =>
    `<a href="${href}" data-label="${i}. ${label}"${i === level ? " aria-current=page" : ""}></a>`).join("");
  body.append(nav);
  const alt = document.createElement("div");
  alt.className = "altitude";
  body.append(alt);

  // ---------- moving light: motes / stars ----------
  const cv = sky.querySelector("canvas");
  const ctx = cv.getContext("2d");
  let W, H, DPR, motes = [], shooting = null;
  const mouse = { x: 0, y: 0 };
  const stars = level === 6;
  const warm = level === 5;

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * DPR;
    H = cv.height = innerHeight * DPR;
  }
  function spawn(initial) {
    const depth = Math.random();
    return {
      x: Math.random() * W,
      y: initial ? Math.random() * H : H + 20,
      z: depth,
      r: (0.4 + depth * 1.8) * DPR,
      v: (0.08 + depth * 0.35) * DPR * (stars ? 0.15 : 1),
      p: Math.random() * 6.28,
      hue: Math.random(),
    };
  }
  function seed() {
    const n = +body.dataset.motes || (stars ? 220 : 70);
    motes = Array.from({ length: n }, () => spawn(true));
  }
  const css = getComputedStyle(body);
  let t = 0;
  function frame() {
    t += 0.016;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    const sc = scrollY / Math.max(1, document.body.scrollHeight - innerHeight);
    const a1 = css.getPropertyValue("--accent2").trim() || "#E879F9";
    const a0 = css.getPropertyValue("--accent").trim() || "#9333EA";
    for (const m of motes) {
      // parallax: near motes react more to the pointer and to scrolling
      const px = (mouse.x - 0.5) * 40 * m.z * DPR;
      const py = scrollY * m.z * 0.25 * DPR;
      m.y -= m.v;
      m.x += Math.sin(t + m.p) * 0.2 * DPR;
      if (m.y < -20) Object.assign(m, spawn(false));
      const tw = 0.5 + 0.5 * Math.sin(t * (stars ? 1.2 : 2) + m.p);
      const alpha = (stars ? 0.25 + 0.75 * tw : 0.15 + 0.5 * tw) * (0.4 + m.z * 0.6);
      const x = m.x + px, y = ((m.y - py) % H + H) % H;
      const g = ctx.createRadialGradient(x, y, 0, x, y, m.r * 5);
      const col = warm && m.hue > 0.5 ? "#FDE68A" : m.hue > 0.7 ? a1 : a0;
      g.addColorStop(0, col);
      g.addColorStop(1, "transparent");
      ctx.globalAlpha = alpha;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, m.r * 5, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = Math.min(1, alpha * 1.6);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x, y, m.r * 0.6, 0, 6.283);
      ctx.fill();
    }
    // a rare shooting star on the deepest page
    if (stars) {
      if (!shooting && Math.random() < 0.002)
        shooting = { x: Math.random() * W, y: Math.random() * H * 0.4, l: 0 };
      if (shooting) {
        const s = shooting;
        s.l += 14 * DPR;
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.l, s.y - s.l * 0.4);
        g.addColorStop(0, "#fff");
        g.addColorStop(1, "transparent");
        ctx.globalAlpha = Math.max(0, 1 - s.l / (500 * DPR));
        ctx.strokeStyle = g;
        ctx.lineWidth = 2 * DPR;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.l, s.y - s.l * 0.4);
        ctx.stroke();
        s.x += 10 * DPR; s.y += 4 * DPR;
        if (s.l > 500 * DPR) shooting = null;
      }
    }
    ctx.globalAlpha = 1;
    if (!reduce) requestAnimationFrame(frame);
  }
  resize(); seed();
  addEventListener("resize", () => { resize(); seed(); });
  frame();

  // ---------- pointer: spotlight + card tilt ----------
  // the halo eases toward the pointer so it trails like a slow lantern
  let hx = innerWidth / 2, hy = innerHeight / 2, tx = hx, ty = hy;
  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX / innerWidth;
    mouse.y = e.clientY / innerHeight;
    tx = e.clientX; ty = e.clientY;
    core.classList.add("on");
    core.style.transform = `translate(${tx}px,${ty}px)`;
    core.classList.toggle("big", !!e.target.closest("a,button,summary"));
  }, { passive: true });
  document.addEventListener("pointerleave", () => core.classList.remove("on"));
  (function follow() {
    hx += (tx - hx) * 0.08; hy += (ty - hy) * 0.08;
    spot.style.setProperty("--cx", hx + "px");
    spot.style.setProperty("--cy", hy + "px");
    requestAnimationFrame(follow);
  })();
  document.querySelectorAll(".card").forEach((c) => {
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--mx", x * 100 + "%");
      c.style.setProperty("--my", y * 100 + "%");
      if (!reduce) {
        c.style.setProperty("--ry", (x - 0.5) * 6 + "deg");
        c.style.setProperty("--rx", (0.5 - y) * 6 + "deg");
      }
    });
    c.addEventListener("pointerleave", () => {
      c.style.setProperty("--rx", "0deg");
      c.style.setProperty("--ry", "0deg");
    });
  });

  // ---------- reveal on scroll ----------
  document.querySelectorAll(".words").forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map((w, i) => `<span style="transition-delay:${i * 0.09}s">${w}</span>`).join(" ");
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.18 });
  document.querySelectorAll(".reveal,.words").forEach((el, i) => {
    el.style.setProperty("--d", (i % 3) * 0.12 + "s");
    io.observe(el);
  });

  // ---------- altitude readout ----------
  function readout() {
    const p = scrollY / Math.max(1, document.body.scrollHeight - innerHeight);
    const metres = Math.round(level * 1000 + p * 1000);
    alt.textContent = "ALT " + metres.toLocaleString() + " M";
    root.style.setProperty("--p", p.toFixed(3));
  }
  addEventListener("scroll", readout, { passive: true });
  readout();

  // ---------- ambient drone: generated live with Web Audio, only after a click ----------
  const btn = document.createElement("button");
  btn.className = "sound";
  btn.setAttribute("aria-pressed", "false");
  btn.textContent = "ENTER WITH SOUND";
  body.append(btn);
  let ac, master;
  btn.addEventListener("click", () => {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = 0;
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 500 + level * 160;
      const lfo = ac.createOscillator(), lfoG = ac.createGain();
      lfo.frequency.value = 0.07; lfoG.gain.value = 250;
      lfo.connect(lfoG).connect(lp.frequency); lfo.start();
      lp.connect(master).connect(ac.destination);
      // each level sits higher: a root note that climbs a fifth-ish per step
      const base = 55 * Math.pow(2, level / 6);
      [1, 1.5, 2, 3.01].forEach((m, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = i % 2 ? "triangle" : "sine";
        o.frequency.value = base * m; o.detune.value = (i - 1.5) * 6;
        g.gain.value = 0.16 / (i + 1);
        o.connect(g).connect(lp); o.start();
      });
    }
    const on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", on);
    btn.textContent = on ? "SOUND ON" : "ENTER WITH SOUND";
    ac.resume();
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.linearRampToValueAtTime(on ? 0.5 : 0, ac.currentTime + 3);
  });

  // ---------- saved reflections ----------
  document.querySelectorAll("textarea[data-save]").forEach((ta) => {
    const key = "violet:" + ta.dataset.save;
    const note = ta.parentElement.querySelector(".saved");
    ta.value = localStorage.getItem(key) || "";
    let timer;
    ta.addEventListener("input", () => {
      localStorage.setItem(key, ta.value);
      if (note) { note.classList.add("on"); clearTimeout(timer); timer = setTimeout(() => note.classList.remove("on"), 1400); }
    });
  });

  // ---------- hidden: type "ascend" anywhere ----------
  let typed = "";
  addEventListener("keydown", (e) => {
    if (/textarea|input/i.test(e.target.tagName)) return;
    typed = (typed + e.key.toLowerCase()).slice(-6);
    if (typed === "ascend") {
      const msg = document.createElement("div");
      msg.textContent = "You said the word. Keep climbing.";
      msg.style.cssText = "position:fixed;inset:0;display:grid;place-items:center;z-index:50;background:radial-gradient(circle,rgba(255,255,255,.35),transparent 60%);font-family:var(--serif);letter-spacing:.3em;text-align:center;padding:20px;pointer-events:none;transition:opacity 3s;opacity:1";
      body.append(msg);
      requestAnimationFrame(() => setTimeout(() => (msg.style.opacity = 0), 100));
      setTimeout(() => msg.remove(), 3300);
    }
  });

  console.log("%c🪷 You looked under the surface. There is a word. Type it.", "color:#E879F9;font-size:14px");
})();

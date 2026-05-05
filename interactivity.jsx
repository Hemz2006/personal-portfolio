/* global React */
/* Awe-factor interactivity: scramble, magnetic, particle field, easter eggs */
const { useEffect, useRef, useState } = React;

/* Text scramble: glitches the chars to random glyphs and resolves to target */
function ScrambleText({ children, className, style, intensity = 8 }) {
  const ref = useRef(null);
  const original = typeof children === "string" ? children : String(children);

  const scramble = () => {
    const el = ref.current;
    if (!el) return;
    const target = original;
    const chars = "!<>-_\\/[]{}—=+*^?#________";
    let frame = 0;
    const queue = target.split("").map((c, i) => ({
      from: c,
      to: c,
      start: Math.floor(Math.random() * intensity),
      end: Math.floor(Math.random() * intensity * 2) + intensity,
    }));
    const update = () => {
      let out = "";
      let complete = 0;
      for (let i = 0; i < queue.length; i++) {
        const { from, to, start, end } = queue[i];
        if (frame >= end) { complete++; out += to; }
        else if (frame >= start) {
          const c = chars[Math.floor(Math.random() * chars.length)];
          out += `<span style="color:var(--accent);opacity:0.7">${c}</span>`;
        }
        else { out += from; }
      }
      el.innerHTML = out;
      if (complete < queue.length) {
        frame++;
        requestAnimationFrame(update);
      } else {
        el.textContent = target;
      }
    };
    update();
  };

  return (
    <span ref={ref} className={className} style={style} onMouseEnter={scramble}>
      {original}
    </span>
  );
}

/* Magnetic button — element drifts toward cursor on hover */
function useMagnetic(strength = 0.35) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    let cur = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      target.x = (e.clientX - cx) * strength;
      target.y = (e.clientY - cy) * strength;
    };
    const onLeave = () => { target = { x: 0, y: 0 }; };
    const loop = () => {
      cur.x += (target.x - cur.x) * 0.18;
      cur.y += (target.y - cur.y) * 0.18;
      el.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);
  return ref;
}

/* Canvas particle field that follows cursor + parallaxes with scroll */
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let dpr = window.devicePixelRatio || 1;
    let w, h;
    const N = 90;
    const dots = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0006,
      vy: (Math.random() - 0.5) * 0.0006,
      r: Math.random() * 1.4 + 0.4,
    }));
    const mouse = { x: 0.5, y: 0.5, active: false };

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = (e.clientY - r.top) / r.height;
      mouse.active = true;
    };
    const onLeave = () => { mouse.active = false; };

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // accent color from CSS var
      const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#222";
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#c66";

      // update + draw
      for (let i = 0; i < N; i++) {
        const d = dots[i];
        d.x += d.vx; d.y += d.vy;
        // mouse repel
        if (mouse.active) {
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 0.15) {
            const f = (0.15 - dist) * 0.0008;
            d.x += (dx / dist) * f * 100;
            d.y += (dy / dist) * f * 100;
          }
        }
        // wrap
        if (d.x < 0) d.x = 1; if (d.x > 1) d.x = 0;
        if (d.y < 0) d.y = 1; if (d.y > 1) d.y = 0;
        ctx.fillStyle = ink;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(d.x * w, d.y * h, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // connecting lines for nearby dots
      ctx.strokeStyle = accent;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = dots[i], b = dots[j];
          const dx = (a.x - b.x) * w;
          const dy = (a.y - b.y) * h;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.globalAlpha = (1 - dist / 110) * 0.25;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0, width: "100vw", height: "100vh",
        pointerEvents: "none", zIndex: 1, opacity: 0.55,
      }}
    />
  );
}

/* 3D rotating skill orb — draggable */
function SkillOrb({ items }) {
  const ref = useRef(null);
  const rotRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const [, force] = useState(0);

  useEffect(() => {
    let raf;
    const tick = () => {
      // auto-rotate when not dragging
      if (!dragRef.current) {
        targetRef.current.y += 0.3;
        targetRef.current.x = Math.sin(Date.now() * 0.0006) * 8;
      }
      rotRef.current.x += (targetRef.current.x - rotRef.current.x) * 0.08;
      rotRef.current.y += (targetRef.current.y - rotRef.current.y) * 0.08;
      force((n) => (n + 1) % 1000);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  const onDown = (e) => {
    dragRef.current = { x: e.clientX, y: e.clientY, rx: targetRef.current.x, ry: targetRef.current.y };
    const onMove = (ev) => {
      if (!dragRef.current) return;
      targetRef.current.y = dragRef.current.ry + (ev.clientX - dragRef.current.x) * 0.5;
      targetRef.current.x = dragRef.current.rx - (ev.clientY - dragRef.current.y) * 0.5;
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const N = items.length;
  const radius = 200;
  const rx = rotRef.current.x;
  const ry = rotRef.current.y;

  return (
    <div
      ref={ref}
      onMouseDown={onDown}
      style={{
        position: "relative",
        width: 480, height: 480,
        margin: "0 auto",
        cursor: "grab",
        perspective: "1000px",
        userSelect: "none",
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        transformStyle: "preserve-3d",
        transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
      }}>
        {items.map((item, i) => {
          // distribute on sphere
          const phi = Math.acos(-1 + (2 * i) / N);
          const theta = Math.sqrt(N * Math.PI) * phi;
          const x = radius * Math.cos(theta) * Math.sin(phi);
          const y = radius * Math.sin(theta) * Math.sin(phi);
          const z = radius * Math.cos(phi);
          return (
            <span
              key={i}
              style={{
                position: "absolute",
                left: "50%", top: "50%",
                transform: `translate3d(${x}px, ${y}px, ${z}px)`,
                fontFamily: "var(--mono)",
                fontSize: 12,
                letterSpacing: "0.04em",
                color: "var(--ink)",
                background: "var(--bg-elev)",
                padding: "5px 10px",
                border: "1px solid var(--rule)",
                borderRadius: 4,
                whiteSpace: "nowrap",
                marginLeft: -40, marginTop: -12,
              }}
            >{item}</span>
          );
        })}
      </div>
      {/* drag hint */}
      <div className="mono" style={{
        position: "absolute", bottom: -32, left: 0, right: 0,
        textAlign: "center", color: "var(--ink-mute)",
      }}>↻ drag to rotate</div>
    </div>
  );
}

/* Konami-style easter egg: type "hi" to flash a greeting */
function Easter() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let buf = "";
    const onKey = (e) => {
      if (e.key.length === 1) {
        buf = (buf + e.key.toLowerCase()).slice(-4);
        if (buf.endsWith("hi")) {
          setShow(true);
          setTimeout(() => setShow(false), 2400);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", bottom: 32, left: 32, zIndex: 300,
      padding: "16px 24px",
      background: "var(--ink)", color: "var(--bg)",
      borderRadius: 8,
      fontFamily: "var(--serif)", fontSize: 28,
      animation: "popIn 0.4s cubic-bezier(.2,1.4,.4,1)",
      boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
    }}>
      hey there 👋 — thanks for poking around
    </div>
  );
}

/* Spotlight that follows cursor on hover targets */
function Spotlight() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      el.style.background = `radial-gradient(circle 240px at ${e.clientX}px ${e.clientY}px, color-mix(in oklch, var(--accent) 14%, transparent), transparent 70%)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div ref={ref} style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2,
      mixBlendMode: "multiply",
    }} />
  );
}

Object.assign(window, { ScrambleText, useMagnetic, ParticleField, SkillOrb, Easter, Spotlight });

/* global React, ReactDOM, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakColor */
const { useState, useEffect, useRef, useMemo, useCallback } = React;
// Pull in components from interactivity.jsx (loaded earlier — exported to window)
const ScrambleText = window.ScrambleText;
const ParticleField = window.ParticleField;
const Spotlight = window.Spotlight;
const Easter = window.Easter;
const SkillOrb = window.SkillOrb;

/* ============================================================
   DATA
   ============================================================ */

const ME = {
  name: "Hemanth Varma Kanumuri",
  title: "AI Engineer & Game Developer",
  location: "Hyderabad, India",
  email: "hemanthvarmak2006@gmail.com",
  phone: "+91 8374445888",
  github: "https://github.com/Hemz2006",
  blurb: "Building at the intersection of machine learning, interactive media, and product. B.Tech (AI) student at Mahindra University, working on medical AI by day and game systems by night.",
};

const EXPERIENCE = [
  {
    role: "AI Engineer — Medical AI",
    org: "ElectronWIZ Pvt. Ltd.",
    when: "Nov 2025 — Present",
    notes: "Deep-learning-based medical risk prediction. Model experimentation, evaluation, and production integration.",
    tag: "Industry",
  },
  {
    role: "Technical Head",
    org: "Abhinaya — MU Drama Club",
    when: "Nov 2025 — Present",
    notes: "Lead lighting, sound, and AV for live productions. Translate creative briefs into stage executions.",
    tag: "Leadership",
  },
  {
    role: "Lead Developer & Documentation",
    org: "CYK Solutions",
    when: "Jun 2025 — Nov 2025",
    notes: "Technical development and structured documentation. Requirement analysis, lifecycle planning, deployment.",
    tag: "Industry",
  },
  {
    role: "Game Developer & Designer",
    org: "GaMUverse — Mahindra Game Lab",
    when: "Feb 2025 — Present",
    notes: "Founding team of MU's Game Lab. Shaping direction and early projects at the intersection of tech and interactive media.",
    tag: "Founding",
  },
  {
    role: "Research Assistant",
    org: "Maker's Lab, Mahindra University",
    when: "Jan 2025 — Present",
    notes: "Computer vision with quantum computing in C++. Exploring quantum-classical hybrids for vision tasks.",
    tag: "Research",
  },
];

const EDUCATION = [
  { deg: "B.Tech, Artificial Intelligence", school: "Mahindra University", when: "Aug 2023 — Present", note: "CGPA 7.0/10 (through 5th semester)" },
  { deg: "International Baccalaureate Diploma", school: "DRS International School", when: "Jun 2021 — May 2023", note: "30/45" },
  { deg: "CBSE", school: "Sri Swaminarayan Gurukul Int'l School", when: "Jun 2019 — May 2021", note: "84.3%" },
];

const SKILLS = {
  "Languages & Core": ["Python", "C", "C++", "C#", "Node.js", "Data Structures", "OOP"],
  "ML / AI": ["PyTorch", "Deep Learning", "CNN-LSTM", "Transformers", "SBERT", "NLP"],
  "Game & Interactive": ["Unity 2D", "Unity 3D", "C#", "FSM / AI Logic"],
  "Tools & Platforms": ["Figma", "Cloud Firestore", "Git", "Web Dev"],
  "Creative": ["Audio Design", "Video Editing", "Graphic Design"],
};

const AWARDS = [
  { title: "1st Place — Ethical Hacking Hackathon", where: "BITS Hyderabad", year: "" },
  { title: "Devslopes 35-hour Game Development", where: "Course Completed", year: "" },
  { title: "Generative AI Workshops", where: "Outskill & IITH", year: "" },
  { title: "Quantum Computing — Qiskit Specialization", where: "Course Completed", year: "" },
];

const KIND_LABEL = {
  ai: "AI / ML",
  viz: "Data Viz",
  tool: "Tooling",
  app: "Mobile",
  game: "Game",
  web: "Web",
};

/* ============================================================
   HOOKS
   ============================================================ */

function useScrollSpy(sectionIds, offset = 120) {
  const [active, setActive] = useState(sectionIds[0]);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + offset;
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sectionIds, offset]);
  return active;
}

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    const observe = () => {
      document.querySelectorAll(".reveal:not(.in)").forEach((el) => {
        const r = el.getBoundingClientRect();
        // Force-reveal anything above the fold OR already in viewport
        if (r.bottom < window.innerHeight && r.top < window.innerHeight) {
          el.classList.add("in");
        } else {
          io.observe(el);
        }
      });
    };
    observe();
    const mo = new MutationObserver(() => observe());
    mo.observe(document.body, { childList: true, subtree: true });
    // Re-check on scroll occasionally too, in case a section was just past the viewport
    const onScroll = () => observe();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { io.disconnect(); mo.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);
}

/* Smooth scroll-driven parallax: map [start, end] page-Y to [from, to] */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { setY(window.scrollY); raf = null; });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return y;
}

/* 3D tilt on hover */
function useTilt(max = 12) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = null;
    let target = { rx: 0, ry: 0, tz: 0 };
    let cur = { rx: 0, ry: 0, tz: 0 };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      target.ry = (px - 0.5) * max * 2;
      target.rx = -(py - 0.5) * max * 2;
      target.tz = 8;
    };
    const onLeave = () => { target = { rx: 0, ry: 0, tz: 0 }; };
    const loop = () => {
      cur.rx += (target.rx - cur.rx) * 0.12;
      cur.ry += (target.ry - cur.ry) * 0.12;
      cur.tz += (target.tz - cur.tz) * 0.12;
      el.style.transform = `perspective(1000px) rotateX(${cur.rx}deg) rotateY(${cur.ry}deg) translateZ(${cur.tz}px)`;
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
  }, [max]);
  return ref;
}

function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/* ============================================================
   CURSOR
   ============================================================ */

function CursorDot() {
  const ref = useRef(null);
  useEffect(() => {
    const dot = ref.current;
    if (!dot) return;
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;
    const onMove = (e) => { tx = e.clientX; ty = e.clientY; };
    const onOver = (e) => {
      if (e.target.closest("a, button, [data-magnet]")) dot.classList.add("big");
      else dot.classList.remove("big");
    };
    let raf;
    const loop = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      dot.style.left = x + "px";
      dot.style.top = y + "px";
      raf = requestAnimationFrame(loop);
    };
    loop();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, []);
  return <div ref={ref} className="cursor-dot" />;
}

/* ============================================================
   NAV
   ============================================================ */

const SECTIONS = [
  { id: "intro", label: "Index" },
  { id: "work", label: "Work" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

function Nav({ onOpenPalette, menuOpen }) {
  const active = useScrollSpy(SECTIONS.map((s) => s.id));
  const clock = useClock();
  const time = clock.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  return (
    <nav style={navStyles.bar}>
      <div style={navStyles.inner}>
        <a href="#intro" style={navStyles.brand}>
          <span style={{ fontFamily: "var(--serif)", fontSize: 22, lineHeight: 1 }}>Hemanth</span>
          <span className="mono" style={{ marginLeft: 10, color: "var(--ink-mute)" }}>K.</span>
        </a>

        <ul style={navStyles.list}>
          {SECTIONS.map((s, i) => (
            <li key={s.id} style={navStyles.item}>
              <a href={`#${s.id}`} style={{
                ...navStyles.link,
                color: active === s.id ? "var(--ink)" : "var(--ink-mute)",
              }}>
                <span className="mono" style={{ marginRight: 6 }}>{String(i + 1).padStart(2, "0")}</span>
                {s.label}
                {active === s.id && <span style={navStyles.dot} />}
              </a>
            </li>
          ))}
        </ul>

        <div style={navStyles.right}>
          <span className="mono" style={{ color: "var(--ink-mute)" }}>HYD · {time}</span>
          <button
            onClick={onOpenPalette}
            style={navStyles.menuBtn}
            data-magnet
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <span style={{ ...navStyles.menuLine, ...(menuOpen ? navStyles.menuLineTop : null) }} />
            <span style={{ ...navStyles.menuLine, ...(menuOpen ? navStyles.menuLineMid : null) }} />
            <span style={{ ...navStyles.menuLine, ...(menuOpen ? navStyles.menuLineBot : null) }} />
          </button>
        </div>
      </div>
    </nav>
  );
}

const navStyles = {
  bar: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
    background: "color-mix(in oklch, var(--bg) 78%, transparent)",
    backdropFilter: "blur(10px) saturate(140%)",
    WebkitBackdropFilter: "blur(10px) saturate(140%)",
    borderBottom: "1px solid var(--rule-soft)",
  },
  inner: {
    maxWidth: 1320, margin: "0 auto",
    padding: "14px 32px",
    display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 24,
  },
  brand: { display: "flex", alignItems: "baseline" },
  list: { display: "flex", gap: 4, listStyle: "none", margin: 0, padding: 0 },
  item: {},
  link: {
    position: "relative",
    padding: "8px 14px", borderRadius: 999,
    fontSize: 13, letterSpacing: "-0.005em",
    transition: "color 0.3s",
    display: "inline-flex", alignItems: "center",
  },
  dot: {
    width: 4, height: 4, borderRadius: 999,
    background: "var(--accent)",
    marginLeft: 8,
  },
  right: { display: "flex", alignItems: "center", gap: 14, justifyContent: "flex-end" },
  menuBtn: {
    position: "relative",
    width: 40, height: 32,
    border: "1px solid var(--rule)",
    borderRadius: 6,
    background: "transparent",
    display: "inline-flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 5,
    transition: "border-color 0.3s, background 0.3s",
  },
  menuLine: {
    display: "block", width: 16, height: 1.2,
    background: "var(--ink-soft)",
    transition: "transform 0.4s cubic-bezier(.7,0,.2,1), opacity 0.25s, background 0.3s",
    transformOrigin: "center",
  },
  menuLineTop: { transform: "translateY(6.2px) rotate(45deg)", background: "var(--accent)" },
  menuLineMid: { opacity: 0, transform: "scaleX(0.2)" },
  menuLineBot: { transform: "translateY(-6.2px) rotate(-45deg)", background: "var(--accent)" },
};

/* ============================================================
   HERO
   ============================================================ */

function Hero() {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const scrollY = useScrollY();
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMouse({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  };
  // 3D parallax: each line tilts by mouse + lifts/sinks on scroll
  const sp = Math.min(scrollY / 600, 1); // 0..1 over first 600px
  const tilt = (depth, scrollDepth = 0) => ({
    transform: `translate3d(${(mouse.x - 0.5) * depth}px, ${(mouse.y - 0.5) * depth - sp * scrollDepth}px, 0) rotateX(${(mouse.y - 0.5) * -3}deg) rotateY(${(mouse.x - 0.5) * 3}deg)`,
    transition: "transform 0.6s cubic-bezier(.2,.7,.2,1)",
  });

  return (
    <section id="intro" style={{ ...heroStyles.wrap, perspective: "1200px" }} onMouseMove={onMove}>
      {/* 3D floating glyphs in background */}
      <div style={heroStyles.glyphLayer} aria-hidden="true">
        {["▲","■","●","◆","✦","◯","✕","∞"].map((g, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${(i * 13.7) % 100}%`,
              top: `${(i * 23.3) % 100}%`,
              fontSize: 14 + (i % 4) * 8,
              color: "var(--ink-mute)",
              opacity: 0.18,
              transform: `translate3d(${(mouse.x - 0.5) * (20 + i * 8)}px, ${(mouse.y - 0.5) * (20 + i * 8) - sp * (i * 30)}px, 0) rotate(${sp * 360 + i * 30}deg)`,
              transition: "transform 0.8s cubic-bezier(.2,.7,.2,1)",
              fontFamily: "var(--mono)",
            }}
          >{g}</span>
        ))}
      </div>

      <div style={heroStyles.gridLines} aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => <div key={i} style={heroStyles.gridLine} />)}
      </div>

      <header style={heroStyles.top}>
        <div className="mono">Portfolio · 2026</div>
        <div className="mono">Vol. 01</div>
      </header>

      <div style={{ ...heroStyles.body, transformStyle: "preserve-3d" }}>
        <div style={heroStyles.label} className="mono">— Currently —</div>
        <h1 style={heroStyles.h1} className="serif">
          <span style={{ ...tilt(8, 30), display: "inline-block" }}>Hemanth Varma</span><br />
          <span style={{ ...tilt(14, 60), display: "inline-block", marginRight: "0.25em" }}>Kanumuri,</span>
          <span className="serif-italic" style={{ color: "var(--accent)", ...tilt(10, 40), display: "inline-block" }}>building</span>
          <br />
          <span style={{ ...tilt(6, 20), display: "inline-block", marginRight: "0.25em" }}>at the edge of</span>
          <span className="serif-italic" style={{ ...tilt(12, 50), display: "inline-block" }}>AI, games &amp; product.</span>
        </h1>

        <div style={heroStyles.metaRow}>
          <Meta k="Role" v="AI Engineer · Game Dev" />
          <Meta k="Based in" v="Hyderabad, IN" />
          <Meta k="Open to" v="Internships · Collabs" />
          <Meta k="Studying" v="B.Tech AI · Mahindra Univ." />
        </div>
      </div>

      <footer style={heroStyles.bottom}>
        <div style={heroStyles.scroll} className="mono">
          <span>Scroll</span>
          <div style={heroStyles.scrollLine}><div style={heroStyles.scrollDot} /></div>
        </div>
        <div className="mono" style={{ color: "var(--ink-mute)" }}>{ME.email}</div>
      </footer>
    </section>
  );
}

function Meta({ k, v }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span className="mono">{k}</span>
      <span style={{ fontSize: 14, color: "var(--ink)" }}>{v}</span>
    </div>
  );
}

const heroStyles = {
  wrap: {
    position: "relative",
    minHeight: "100vh",
    padding: "120px 32px 40px",
    maxWidth: 1320, margin: "0 auto",
    display: "flex", flexDirection: "column",
    overflow: "hidden",
  },
  glyphLayer: {
    position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
  },
  gridLines: {
    position: "absolute", inset: 0, pointerEvents: "none",
    display: "grid", gridTemplateColumns: "repeat(12, 1fr)",
    maxWidth: 1320, margin: "0 auto",
    paddingInline: 32,
  },
  gridLine: {
    borderRight: "1px dashed var(--rule-soft)",
  },
  top: {
    display: "flex", justifyContent: "space-between",
    paddingBottom: 32,
  },
  body: {
    flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
    paddingBlock: "40px",
  },
  label: {
    color: "var(--accent)",
    marginBottom: 24,
  },
  h1: {
    fontSize: "clamp(56px, 9vw, 148px)",
    lineHeight: 0.95,
    margin: 0,
    fontWeight: 400,
    letterSpacing: "-0.025em",
    maxWidth: "16ch",
  },
  metaRow: {
    marginTop: 64,
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 32,
    paddingTop: 24,
    borderTop: "1px solid var(--rule-soft)",
    maxWidth: 760,
  },
  bottom: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-end",
    paddingTop: 32,
  },
  scroll: { display: "flex", alignItems: "center", gap: 12 },
  scrollLine: {
    position: "relative",
    width: 80, height: 1, background: "var(--rule)",
    overflow: "hidden",
  },
  scrollDot: {
    position: "absolute", top: -1, left: 0,
    width: 14, height: 3, background: "var(--ink)",
    animation: "scrollSlide 2s ease-in-out infinite",
  },
};

/* ============================================================
   SECTION HEADER
   ============================================================ */

function SectionHead({ num, kicker, title, sub }) {
  return (
    <header style={sectionStyles.head} className="reveal">
      <div className="mono" style={{ color: "var(--accent)" }}>§ {num} — {kicker}</div>
      <h2 style={sectionStyles.h2} className="serif">{title}</h2>
      {sub && <p style={sectionStyles.sub}>{sub}</p>}
    </header>
  );
}
const sectionStyles = {
  head: {
    display: "flex", flexDirection: "column", gap: 12,
    paddingBottom: 40, marginBottom: 56,
    borderBottom: "1px solid var(--rule)",
  },
  h2: {
    fontSize: "clamp(36px, 5.5vw, 72px)",
    lineHeight: 1.15, margin: 0, fontWeight: 400,
    letterSpacing: "-0.02em", maxWidth: "20ch",
  },
  sub: {
    margin: 0, color: "var(--ink-soft)",
    maxWidth: "60ch", fontSize: 17, lineHeight: 1.55,
  },
};

const PageWrap = ({ id, children, dark }) => (
  <section id={id} style={{
    padding: "120px 32px",
    maxWidth: 1320, margin: "0 auto",
    background: dark ? "var(--bg-elev)" : "transparent",
  }}>
    {children}
  </section>
);

/* ============================================================
   WORK SECTION
   ============================================================ */

function WorkSection() {
  const [hover, setHover] = useState(null);
  return (
    <PageWrap id="work">
      <SectionHead num="01" kicker="Experience" title="The roles, the rooms, the residencies." sub="A working tour of where I've been a hand on deck — from medical AI labs to drama clubs and game studios." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0 }}>
        <div style={workStyles.headRow} className="mono reveal">
          <div>Idx</div><div>Role</div><div>Organization</div><div>Tag</div><div>Period</div>
        </div>
        {EXPERIENCE.map((e, i) => (
          <div
            key={i}
            style={{
              ...workStyles.row,
              background: hover === i ? "var(--bg-elev)" : "transparent",
            }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="reveal"
            data-magnet
          >
            <div className="mono" style={workStyles.idx}>0{i + 1}</div>
            <div style={workStyles.role}>
              <div className="serif" style={{ fontSize: 26, lineHeight: 1.15 }}>{e.role}</div>
              <div style={{
                fontSize: 14, color: "var(--ink-soft)",
                maxHeight: hover === i ? 80 : 0,
                opacity: hover === i ? 1 : 0,
                overflow: "hidden",
                marginTop: hover === i ? 8 : 0,
                transition: "all 0.45s cubic-bezier(.4,0,.2,1)",
              }}>{e.notes}</div>
            </div>
            <div style={workStyles.org}>{e.org}</div>
            <div>
              <span className="mono" style={workStyles.tag}>{e.tag}</span>
            </div>
            <div className="mono" style={{ color: "var(--ink-soft)", textAlign: "right" }}>{e.when}</div>
          </div>
        ))}
      </div>

      {/* Education */}
      <div style={{ marginTop: 96 }}>
        <div className="mono reveal" style={{ marginBottom: 24, color: "var(--accent)" }}>— Education —</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {EDUCATION.map((ed, i) => (
            <div key={i} className="reveal" style={workStyles.eduCard}>
              <div className="mono" style={{ color: "var(--ink-mute)" }}>{ed.when}</div>
              <div className="serif" style={{ fontSize: 24, marginTop: 12, lineHeight: 1.2 }}>{ed.deg}</div>
              <div style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 6 }}>{ed.school}</div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--rule-soft)", fontSize: 13, color: "var(--ink-mute)" }} className="mono">{ed.note}</div>
            </div>
          ))}
        </div>
      </div>
    </PageWrap>
  );
}

const workStyles = {
  headRow: {
    display: "grid",
    gridTemplateColumns: "60px 2fr 1.5fr 100px 160px",
    gap: 24,
    padding: "16px 0",
    borderTop: "1px solid var(--rule)",
    borderBottom: "1px solid var(--rule)",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "60px 2fr 1.5fr 100px 160px",
    gap: 24,
    padding: "28px 12px",
    borderBottom: "1px solid var(--rule-soft)",
    alignItems: "start",
    cursor: "default",
    transition: "background 0.3s",
  },
  idx: { color: "var(--ink-mute)", paddingTop: 10 },
  role: { paddingTop: 4 },
  org: { fontSize: 15, color: "var(--ink-soft)", paddingTop: 10 },
  tag: {
    display: "inline-block",
    padding: "3px 8px", border: "1px solid var(--rule)", borderRadius: 4,
    color: "var(--ink-soft)",
  },
  eduCard: {
    padding: "24px",
    border: "1px solid var(--rule-soft)",
    borderRadius: 4,
    background: "var(--bg-elev)",
  },
};

/* ============================================================
   PROJECT GALLERY
   ============================================================ */

function ProjectsSection({ projects }) {
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);

  const kinds = useMemo(() => {
    const counts = {};
    projects.forEach((p) => { counts[p.kind] = (counts[p.kind] || 0) + 1; });
    return counts;
  }, [projects]);

  const visibleSet = useMemo(() => {
    if (filter === "all") return new Set(projects.map((p) => p.name));
    return new Set(projects.filter((p) => p.kind === filter).map((p) => p.name));
  }, [filter, projects]);

  return (
    <PageWrap id="projects" dark>
      <SectionHead num="02" kicker="Selected Work" title="Projects across ML, games, and the in-between." sub="A mix of academic research, freelance builds, and weekend experiments. Hover to tilt; click to expand." />

      <div style={projStyles.filters}>
        <FilterChip active={filter === "all"} onClick={() => { setFilter("all"); setOpen(null); }} count={projects.length}>All</FilterChip>
        {Object.entries(kinds).map(([k, n]) => (
          <FilterChip key={k} active={filter === k} onClick={() => { setFilter(k); setOpen(null); }} count={n}>{KIND_LABEL[k] || k}</FilterChip>
        ))}
      </div>

      <div style={projStyles.grid}>
        {projects.map((p, i) => {
          const visible = visibleSet.has(p.name);
          return (
            <ProjectCard
              key={p.name}
              p={p}
              index={i}
              visible={visible}
              expanded={open === p.name && visible}
              onToggle={() => setOpen(open === p.name ? null : p.name)}
            />
          );
        })}
      </div>
    </PageWrap>
  );
}

function FilterChip({ active, onClick, children, count }) {
  return (
    <button onClick={onClick} style={{
      ...projStyles.chip,
      background: active ? "var(--ink)" : "transparent",
      color: active ? "var(--bg)" : "var(--ink)",
      borderColor: active ? "var(--ink)" : "var(--rule)",
    }} data-magnet>
      <span>{children}</span>
      <span className="mono" style={{ opacity: 0.6, marginLeft: 8 }}>{String(count).padStart(2, "0")}</span>
    </button>
  );
}

function ProjectCard({ p, index, expanded, visible, onToggle }) {
  const cardRef = useRef(null);
  const innerRef = useRef(null);

  useEffect(() => {
    const el = innerRef.current;
    if (!el || expanded) return;
    let raf;
    let target = { rx: 0, ry: 0 };
    let cur = { rx: 0, ry: 0 };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      target.ry = (px - 0.5) * 14;
      target.rx = -(py - 0.5) * 10;
    };
    const onLeave = () => { target = { rx: 0, ry: 0 }; };
    const loop = () => {
      cur.rx += (target.rx - cur.rx) * 0.12;
      cur.ry += (target.ry - cur.ry) * 0.12;
      el.style.transform = `rotateX(${cur.rx}deg) rotateY(${cur.ry}deg)`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      el.style.transform = "";
    };
  }, [expanded]);

  if (!visible) return null;

  return (
    <article
      ref={cardRef}
      style={{
        ...projStyles.cardOuter,
        gridColumn: expanded ? "span 2" : "span 1",
        transition: "grid-column 0.4s",
      }}
      onClick={onToggle}
      data-magnet
    >
      <div
        ref={innerRef}
        style={{
          ...projStyles.card,
          background: expanded ? "var(--ink)" : "var(--bg-elev)",
          color: expanded ? "var(--bg)" : "var(--ink)",
          borderColor: expanded ? "var(--ink)" : "var(--rule-soft)",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <div className="stripe-fill" style={{
          ...projStyles.media,
          backgroundImage: expanded
            ? "repeating-linear-gradient(135deg, oklch(22% 0 0) 0 1px, transparent 1px 9px)"
            : undefined,
          transform: "translateZ(20px)",
        }}>
          <div style={projStyles.mediaCaption}>
            <span className="mono" style={{ color: expanded ? "var(--bg)" : "var(--ink-mute)" }}>
              [ {p.kind.toUpperCase()} · {p.year} ]
            </span>
            <span className="mono" style={{ color: expanded ? "var(--bg)" : "var(--ink-mute)", opacity: 0.6 }}>
              {p.repo ? "GH/" + p.repo.split("/")[1] : "EXTERNAL"}
            </span>
          </div>
        </div>

        <div style={{ ...projStyles.cardBody, transform: "translateZ(30px)" }}>
          <div style={projStyles.cardTopRow}>
            <span className="mono" style={{ color: expanded ? "oklch(75% 0.005 60)" : "var(--ink-mute)" }}>
              {String(index + 1).padStart(2, "0")} / {p.year}
            </span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {p.stack.slice(0, 3).map((s) => (
                <span key={s} className="mono" style={{
                  ...projStyles.stackTag,
                  borderColor: expanded ? "color-mix(in oklch, var(--bg) 30%, transparent)" : "var(--rule)",
                  color: expanded ? "var(--bg)" : "var(--ink-soft)",
                }}>{s}</span>
              ))}
            </div>
          </div>

          <h3 className="serif" style={projStyles.cardTitle}>
            <ScrambleText>{p.name}</ScrambleText>
          </h3>

          <p style={{
            ...projStyles.cardBlurb,
            color: expanded ? "color-mix(in oklch, var(--bg) 75%, transparent)" : "var(--ink-soft)",
            maxHeight: expanded ? 220 : 80,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: expanded ? 99 : 3,
            overflow: "hidden",
          }}>{p.blurb}</p>

          <div style={projStyles.cardFoot}>
            {p.repo && !p.private ? (
              <a className="link" href={`https://github.com/${p.repo}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                View repo <span className="arrow">↗</span>
              </a>
            ) : p.private ? (
              <span className="mono" style={{ color: expanded ? "oklch(75% 0.005 60)" : "var(--ink-mute)" }}>· private repo</span>
            ) : (
              <span className="mono" style={{ color: expanded ? "oklch(75% 0.005 60)" : "var(--ink-mute)" }}>· offline build</span>
            )}
            <span className="mono" style={{ color: expanded ? "var(--bg)" : "var(--ink)" }}>
              {expanded ? "− Collapse" : "+ Expand"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

const projStyles = {
  filters: {
    display: "flex", flexWrap: "wrap", gap: 8,
    marginBottom: 40,
  },
  chip: {
    padding: "8px 14px",
    border: "1px solid",
    borderRadius: 999,
    fontSize: 13,
    transition: "all 0.25s",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
    perspective: "1500px",
  },
  cardOuter: {
    cursor: "pointer",
  },
  card: {
    border: "1px solid",
    borderRadius: 4,
    overflow: "hidden",
    transition: "background 0.5s, color 0.5s, border-color 0.5s",
    display: "flex", flexDirection: "column",
    height: "100%",
  },
  media: {
    aspectRatio: "16 / 9",
    position: "relative",
    borderBottom: "1px solid var(--rule-soft)",
  },
  mediaCaption: {
    position: "absolute", inset: 0, padding: 16,
    display: "flex", alignItems: "flex-end", justifyContent: "space-between",
  },
  cardBody: {
    padding: "24px 24px 28px",
    display: "flex", flexDirection: "column", gap: 12, flex: 1,
  },
  cardTopRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  stackTag: {
    padding: "2px 7px", border: "1px solid",
    borderRadius: 3,
  },
  cardTitle: {
    fontSize: 32, lineHeight: 1.1, margin: 0,
    fontWeight: 400, letterSpacing: "-0.01em",
  },
  cardBlurb: {
    fontSize: 15, lineHeight: 1.55, margin: 0,
    transition: "max-height 0.5s",
  },
  cardFoot: {
    marginTop: "auto", paddingTop: 16,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderTop: "1px solid color-mix(in oklch, currentColor 15%, transparent)",
  },
};

/* ============================================================
   SKILLS SECTION
   ============================================================ */

function SkillsSection() {
  const allSkills = useMemo(() => Object.values(SKILLS).flat(), []);
  return (
    <PageWrap id="skills">
      <SectionHead num="03" kicker="Stack" title="Tools and territory." sub="What I reach for, in roughly the order I reach for it. Drag the orb." />

      <div className="reveal" style={{ padding: "32px 0 80px" }}>
        <SkillOrb items={allSkills} />
      </div>

      <div style={skillStyles.grid}>
        {Object.entries(SKILLS).map(([cat, items]) => (
          <div key={cat} className="reveal" style={skillStyles.col}>
            <div className="mono" style={{ color: "var(--accent)", marginBottom: 16 }}>// {cat}</div>
            <ul style={skillStyles.list}>
              {items.map((s) => (
                <li key={s} style={skillStyles.skill} data-magnet>
                  <span style={skillStyles.skillDot} />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 96 }}>
        <div className="mono reveal" style={{ marginBottom: 24, color: "var(--accent)" }}>— Awards & Certifications —</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0 }}>
          {AWARDS.map((a, i) => (
            <div key={i} style={skillStyles.award} className="reveal">
              <span className="mono" style={{ color: "var(--ink-mute)", minWidth: 32 }}>0{i + 1}</span>
              <div>
                <div className="serif" style={{ fontSize: 22, lineHeight: 1.2 }}>{a.title}</div>
                <div style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 4 }}>{a.where}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageWrap>
  );
}

const skillStyles = {
  grid: {
    display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
    gap: 24,
  },
  col: { padding: "0 0 0 0" },
  list: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 },
  skill: {
    display: "flex", alignItems: "center", gap: 10,
    fontSize: 15, color: "var(--ink)",
    cursor: "default",
    transition: "transform 0.2s",
  },
  skillDot: {
    width: 5, height: 5, borderRadius: 999,
    background: "var(--ink)",
    flexShrink: 0,
  },
  award: {
    display: "flex", gap: 16,
    padding: "20px 0",
    borderTop: "1px solid var(--rule-soft)",
    alignItems: "center",
  },
};

/* ============================================================
   NOW SECTION (the "right now" diary)
   ============================================================ */

function MarqueeStrip() {
  const items = ["AI Engineer", "Game Dev", "ML Research", "PyTorch", "Unity", "Hyderabad", "Mahindra Univ.", "Founding Game Lab", "Open to Collabs", "B.Tech AI"];
  const scrollY = useScrollY();
  const offset = (scrollY * 0.4) % 1000;
  return (
    <div style={{
      padding: "60px 0",
      borderBlock: "1px solid var(--rule)",
      background: "var(--bg)",
      overflow: "hidden",
      perspective: "800px",
    }}>
      <div style={{
        display: "flex",
        gap: 48,
        whiteSpace: "nowrap",
        transform: `translate3d(${-offset}px, 0, 0) rotateX(8deg)`,
        transformStyle: "preserve-3d",
      }}>
        {[...items, ...items, ...items].map((s, i) => (
          <span key={i} className="serif" style={{
            fontSize: "clamp(48px, 8vw, 120px)",
            lineHeight: 1, letterSpacing: "-0.02em",
            color: i % 3 === 1 ? "var(--accent)" : "var(--ink)",
            fontStyle: i % 4 === 0 ? "italic" : "normal",
            display: "inline-flex", alignItems: "center", gap: 48,
          }}>
            {s} <span style={{ color: "var(--ink-mute)", fontSize: "0.3em" }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   CONTACT
   ============================================================ */

function ContactSection() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(ME.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <PageWrap id="contact">
      <div style={contactStyles.wrap}>
        <div className="mono reveal" style={{ color: "var(--accent)" }}>§ 04 — Contact</div>
        <h2 className="serif reveal" style={contactStyles.h2}>
          Got a project, a problem, or<br/>
          <span className="serif-italic">just want to say hi?</span>
        </h2>

        <button onClick={copy} className="reveal" style={contactStyles.bigEmail} data-magnet>
          <span>{ME.email}</span>
          <span className="mono" style={{ fontSize: 12, color: "var(--ink-mute)", transition: "all 0.3s" }}>
            {copied ? "✓ COPIED" : "COPY ↗"}
          </span>
        </button>

        <a
          href="Hemanth_Varma_Kanumuri_Resume.pdf"
          download
          className="reveal"
          style={contactStyles.resumeBtn}
          data-magnet
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="mono" style={{ color: "var(--ink-mute)" }}>// PDF · 3 pages</span>
            <span className="serif" style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1 }}>
              Download résumé
            </span>
          </div>
          <span style={contactStyles.dlIcon}>
            <span className="mono" style={{ fontSize: 12 }}>DL</span>
            <span style={{ fontSize: 24 }}>↓</span>
          </span>
        </a>

        <div style={contactStyles.links}>
          <a className="link reveal" href={ME.github} target="_blank" rel="noreferrer">
            GitHub <span className="arrow">↗</span>
          </a>
          <a className="link reveal" href={`tel:${ME.phone.replace(/\s/g, '')}`}>
            {ME.phone} <span className="arrow">↗</span>
          </a>
          <a className="link reveal" href="https://linkedin.com" target="_blank" rel="noreferrer">
            LinkedIn <span className="arrow">↗</span>
          </a>
        </div>

        <footer style={contactStyles.foot} className="reveal">
          <div>
            <div className="mono" style={{ color: "var(--ink-mute)" }}>Located</div>
            <div style={{ marginTop: 4 }}>{ME.location}</div>
          </div>
          <div>
            <div className="mono" style={{ color: "var(--ink-mute)" }}>Last updated</div>
            <div style={{ marginTop: 4 }} className="mono">2026.05.05</div>
          </div>
          <div>
            <div className="mono" style={{ color: "var(--ink-mute)" }}>Set in</div>
            <div style={{ marginTop: 4 }} className="serif-italic">Instrument Serif &amp; JetBrains Mono</div>
          </div>
        </footer>
      </div>
    </PageWrap>
  );
}

const contactStyles = {
  wrap: { display: "flex", flexDirection: "column", gap: 32, paddingBlock: 40 },
  h2: {
    fontSize: "clamp(48px, 8vw, 120px)",
    lineHeight: 0.96, margin: 0, fontWeight: 400,
    letterSpacing: "-0.025em",
  },
  bigEmail: {
    marginTop: 24,
    border: "1px solid var(--rule)",
    padding: "32px 36px",
    borderRadius: 6,
    fontFamily: "var(--serif)",
    fontSize: "clamp(28px, 4vw, 48px)",
    fontWeight: 400,
    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24,
    textAlign: "left",
    transition: "all 0.3s",
    background: "var(--bg-elev)",
  },
  resumeBtn: {
    border: "1px solid var(--rule)",
    padding: "28px 32px",
    borderRadius: 6,
    background: "var(--ink)",
    color: "var(--bg)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
    transition: "transform 0.3s, background 0.3s",
    cursor: "pointer",
  },
  dlIcon: {
    width: 64, height: 64, borderRadius: 999,
    background: "var(--accent)",
    color: "var(--bg)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexDirection: "column", gap: 2,
    flexShrink: 0,
  },
  links: {
    display: "flex", gap: 32, flexWrap: "wrap",
    fontSize: 17,
  },
  foot: {
    marginTop: 80,
    paddingTop: 24,
    borderTop: "1px solid var(--rule-soft)",
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: 24,
    fontSize: 14, color: "var(--ink-soft)",
  },
};

/* ============================================================
   SIDE MENU
   ============================================================ */

function SideMenu({ open, onClose, projects }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // lock scroll when open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const jump = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 40;
    window.scrollTo({ top, behavior: "smooth" });
    onClose();
  };

  const featured = projects.slice(0, 4);

  return (
    <>
      <div
        style={{
          ...menuStyles.scrim,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
      />
      <aside
        style={{
          ...menuStyles.panel,
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
        aria-hidden={!open}
      >
        <div style={menuStyles.head}>
          <span className="mono">— Menu —</span>
          <span className="mono" style={{ color: "var(--ink-mute)" }}>{String(SECTIONS.length).padStart(2, "0")} sections</span>
        </div>

        <nav style={menuStyles.nav}>
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => jump(s.id)}
              style={menuStyles.row}
              className="menu-row"
            >
              <span className="mono" style={menuStyles.rowNum}>{String(i + 1).padStart(2, "0")}</span>
              <span className="serif" style={menuStyles.rowLabel}>{s.label}</span>
              <span style={menuStyles.rowArrow}>→</span>
            </button>
          ))}
        </nav>

        <div style={menuStyles.featuredHead}>
          <span className="mono">— Selected work —</span>
        </div>
        <div style={menuStyles.featured}>
          {featured.map((p, i) => (
            <a
              key={i}
              href={p.repo ? `https://github.com/${p.repo}` : (p.external || "#")}
              target="_blank"
              rel="noreferrer"
              onClick={onClose}
              style={menuStyles.proj}
              className="menu-proj"
            >
              <span className="mono" style={{ color: "var(--ink-mute)", fontSize: 10 }}>{p.year}</span>
              <span style={{ fontFamily: "var(--serif)", fontSize: 18 }}>{p.name}</span>
              <span className="mono" style={{ color: "var(--ink-mute)", fontSize: 10 }}>↗</span>
            </a>
          ))}
        </div>

        <div style={menuStyles.foot}>
          <a href={`mailto:${ME.email}`} className="link mono" style={{ fontSize: 12 }}>{ME.email}</a>
          <div style={{ display: "flex", gap: 16 }}>
            <a href={ME.github} target="_blank" rel="noreferrer" className="link mono" style={{ fontSize: 12 }}>GH</a>
            <a href={ME.linkedin} target="_blank" rel="noreferrer" className="link mono" style={{ fontSize: 12 }}>LI</a>
          </div>
        </div>
      </aside>
    </>
  );
}

const menuStyles = {
  scrim: {
    position: "fixed", inset: 0, zIndex: 199,
    background: "color-mix(in oklch, var(--ink) 28%, transparent)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    transition: "opacity 0.4s ease",
  },
  panel: {
    position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 200,
    width: "min(440px, 92vw)",
    background: "var(--bg)",
    borderLeft: "1px solid var(--rule)",
    boxShadow: "-30px 0 80px rgba(0,0,0,0.10)",
    transition: "transform 0.5s cubic-bezier(.7,0,.2,1)",
    display: "flex", flexDirection: "column",
    paddingTop: 80,
  },
  head: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 36px 20px",
    borderBottom: "1px solid var(--rule-soft)",
  },
  nav: { display: "flex", flexDirection: "column", padding: "8px 0" },
  row: {
    display: "flex", alignItems: "baseline", gap: 18,
    padding: "18px 36px",
    border: 0, background: "transparent",
    textAlign: "left", cursor: "pointer",
    borderBottom: "1px solid var(--rule-soft)",
    transition: "background 0.25s, padding-left 0.3s",
  },
  rowNum: { color: "var(--ink-mute)", fontSize: 11, width: 24 },
  rowLabel: { fontSize: 30, color: "var(--ink)", flex: 1, letterSpacing: "-0.01em" },
  rowArrow: { fontFamily: "var(--mono)", fontSize: 14, color: "var(--ink-mute)", transition: "transform 0.3s, color 0.3s" },
  featuredHead: {
    padding: "24px 36px 12px",
  },
  featured: { display: "flex", flexDirection: "column" },
  proj: {
    display: "grid", gridTemplateColumns: "44px 1fr auto", alignItems: "baseline",
    gap: 12, padding: "12px 36px",
    color: "var(--ink-soft)",
    transition: "background 0.25s, color 0.25s",
  },
  foot: {
    marginTop: "auto",
    padding: "20px 36px 28px",
    borderTop: "1px solid var(--rule-soft)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "var(--bg-elev)",
  },
};

/* ============================================================
   APP
   ============================================================ */

function App() {
  useReveal();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const projects = useMemo(() => {
    try { return JSON.parse(document.getElementById("github-projects").textContent); }
    catch { return []; }
  }, []);

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "showCursor": true,
    "showGrain": true,
    "accentHue": 25
  }/*EDITMODE-END*/;
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // apply tweaks
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", `oklch(48% 0.16 ${tweaks.accentHue})`);
    document.documentElement.style.setProperty("--accent-soft", `oklch(92% 0.04 ${tweaks.accentHue})`);
    const g = document.querySelector(".grain");
    if (g) g.style.display = tweaks.showGrain ? "block" : "none";
  }, [tweaks]);

  // hover styles for menu rows + global accent
  useEffect(() => {
    const css = `
      a:hover, button:hover { color: var(--accent); }
      .link:hover, .link:hover * { color: inherit; }
      .menu-row:hover { background: var(--bg-elev); padding-left: 44px !important; }
      .menu-row:hover [class*="rowArrow"], .menu-row:hover span:last-child { color: var(--accent); transform: translateX(4px); }
      .menu-proj:hover { background: var(--bg-elev); color: var(--ink); }
      @keyframes scrollSlide { 0% { transform: translateX(-14px); } 100% { transform: translateX(80px); } }
    `;
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  return (
    <>
      {tweaks.showCursor && <CursorDot />}
      <ParticleField />
      <Spotlight />
      <Easter />
      <Nav onOpenPalette={() => setPaletteOpen((o) => !o)} menuOpen={paletteOpen} />

      <Hero />
      <WorkSection />
      <ProjectsSection projects={projects} />
      <SkillsSection />
      <MarqueeStrip />
      <ContactSection />

      <SideMenu open={paletteOpen} onClose={() => setPaletteOpen(false)} projects={projects} />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Accent">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="mono" style={{ fontSize: 11, color: "var(--ink-mute)" }}>Hue</label>
            <input type="range" min="0" max="360" step="1"
              value={tweaks.accentHue}
              onChange={(e) => setTweak("accentHue", Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        </TweakSection>
        <TweakSection title="Visual chrome">
          <TweakToggle label="Custom cursor" value={tweaks.showCursor} onChange={(v) => setTweak("showCursor", v)} />
          <TweakToggle label="Paper grain" value={tweaks.showGrain} onChange={(v) => setTweak("showGrain", v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

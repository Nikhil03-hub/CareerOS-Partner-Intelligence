import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, ArrowRight, ChevronRight, FileText, Users, Target, Building2, Code2, Brain, MessageSquare, Send, BarChart3, GraduationCap } from "lucide-react";
import { api } from "../lib/api";

gsap.registerPlugin(ScrollTrigger);

/* ---- Split into chars (custom, no plugin) ---- */
function splitChars(node) {
  if (!node || node.dataset.split === "1") return [];
  const text = node.textContent;
  node.textContent = "";
  const words = text.split(/(\s+)/);
  const spans = [];
  words.forEach((w) => {
    if (/^\s+$/.test(w)) {
      node.appendChild(document.createTextNode(w));
      return;
    }
    [...w].forEach((c) => {
      const s = document.createElement("span");
      s.className = "split-char";
      s.textContent = c;
      node.appendChild(s);
      spans.push(s);
    });
  });
  node.dataset.split = "1";
  return spans;
}

function NumberTicker({ value, decimals = 0, suffix = "", prefix = "", duration = 1.5 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const obj = { n: 0 };
    const tween = gsap.to(obj, {
      n: value, duration, ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 88%" },
      onUpdate() { ref.current.textContent = prefix + obj.n.toFixed(decimals) + suffix; },
    });
    return () => tween.kill();
  }, [value, decimals, suffix, prefix, duration]);
  return <span ref={ref} className="font-mono tnum">{prefix}0{suffix}</span>;
}

export default function Landing() {
  const heroH1Ref = useRef(null);
  const heroSubRef = useRef(null);
  const storyRef = useRef(null);
  const moduleRef = useRef(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/public/landing-stats").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // HERO — char-by-char reveal with stagger
      const heroChars = splitChars(heroH1Ref.current);
      gsap.set(heroChars, { yPercent: 110, opacity: 0 });
      gsap.to(heroChars, {
        yPercent: 0, opacity: 1, duration: 1.1, ease: "expo.out",
        stagger: { each: 0.012, from: "start" }, delay: 0.2,
      });
      // Subhead split (line-by-line via slice-line spans)
      gsap.utils.toArray(".slice-line > span").forEach((el, i) => {
        gsap.fromTo(el, { yPercent: 105 }, {
          yPercent: 0, duration: 1, ease: "expo.out", delay: 0.6 + i * 0.08,
        });
      });

      // Standard reveal-up
      gsap.utils.toArray(".reveal-up").forEach((el) => {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 1, ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });

      // STORY — pinned section reveals "spreadsheets → fog → OS"
      const storySteps = gsap.utils.toArray(".story-step");
      if (storyRef.current && storySteps.length) {
        ScrollTrigger.create({
          trigger: storyRef.current,
          start: "top top",
          end: () => `+=${storySteps.length * 60}%`,
          pin: ".story-pin",
          pinSpacing: false,
        });
        storySteps.forEach((s, i) => {
          gsap.to(s, {
            opacity: 1, y: 0, duration: 1, ease: "expo.out",
            scrollTrigger: { trigger: s, start: "top 70%" },
          });
        });
      }

      // Modules — bento staggered
      if (moduleRef.current) {
        gsap.utils.toArray(".module-card").forEach((el, i) => {
          gsap.fromTo(el, { y: 60, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.9, ease: "expo.out", delay: i * 0.03,
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });
      }

      // Parallax accent shape
      gsap.utils.toArray(".parallax-mark").forEach((el) => {
        gsap.to(el, {
          yPercent: -30, ease: "none",
          scrollTrigger: { trigger: el.parentElement, scrub: true, start: "top bottom", end: "bottom top" },
        });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <main className="bg-bone-100 text-ink-900 overflow-x-hidden">
      {/* ===== TOP NAV ===== */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-line">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" data-testid="brand-logo">
            <div className="w-6 h-6 bg-ink-900 grid place-items-center"><div className="w-1.5 h-1.5 bg-accent" /></div>
            <span className="font-display font-bold tracking-tight text-[14px]">CareerOS</span>
            <span className="font-mono text-[9px] tracking-[0.28em] text-ink-400 hidden md:inline">CAMPUS · INTELLIGENCE</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-[13px]">
            <a href="#story" className="ink-link">The fog</a>
            <a href="#modules" className="ink-link">Operating system</a>
            <a href="#data" className="ink-link">Live data</a>
            <a href="#cta" className="ink-link">For institutions</a>
          </div>
          <Link to="/login" data-testid="nav-login-btn" className="group btn py-2 px-4 text-[13px]">
            Sign in <ArrowUpRight size={13} className="group-hover:rotate-45 transition-transform" />
          </Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen pt-28 pb-16 px-6 md:px-10 grain">
        <div className="max-w-[1440px] mx-auto relative">
          <div className="flex items-center gap-3 mb-10 reveal-up" data-testid="hero-eyebrow-row">
            <span className="pill">v2 · KMIT pilot live · 6 institutions seeded</span>
            <span className="font-mono text-[11px] text-ink-400 tracking-[0.18em]">SKILL TANK / CAMPUS OS</span>
          </div>

          <h1
            ref={heroH1Ref}
            data-testid="hero-h1"
            className="font-display font-black tracking-tightest leading-[0.88] text-[15vw] md:text-[10.5vw] lg:text-[9vw]"
          >
            The operating system for placement intelligence.
          </h1>

          <div className="mt-12 grid grid-cols-12 gap-8" ref={heroSubRef}>
            <div className="col-span-12 md:col-span-7">
              <div className="font-serif text-xl md:text-2xl text-ink-700 leading-[1.45] max-w-2xl">
                <span className="slice-line"><span>Colleges run training. Companies run hiring.</span></span>
                <span className="slice-line"><span><span className="text-ink-400">Between them sits a fog of spreadsheets,</span></span></span>
                <span className="slice-line"><span><span className="text-ink-400">WhatsApp groups, and quarterly PDFs.</span></span></span>
                <span className="slice-line"><span>CareerOS is the layer that makes it institutional.</span></span>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link to="/login" data-testid="hero-cta-primary" className="group btn">
                  Open the command center
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#story" data-testid="hero-cta-secondary" className="btn btn-ghost">
                  See the storyline
                </a>
              </div>
            </div>
            <div className="col-span-12 md:col-span-5 md:col-start-9 self-end space-y-5 reveal-up">
              <div className="hairline" />
              <div className="grid grid-cols-2 gap-6">
                <div data-testid="hero-stat-offers">
                  <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">AY · 2025–26</div>
                  <div className="font-display text-5xl mt-2"><NumberTicker value={702} /></div>
                  <div className="text-sm text-ink-500 mt-1">offers across 148 recruiters</div>
                </div>
                <div data-testid="hero-stat-top">
                  <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">TOP OFFER</div>
                  <div className="font-display text-5xl mt-2"><NumberTicker value={80} prefix="₹" suffix="L" /></div>
                  <div className="text-sm text-ink-500 mt-1">Amazon · SDE</div>
                </div>
                <div data-testid="hero-stat-students">
                  <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">SEEDED</div>
                  <div className="font-display text-5xl mt-2"><NumberTicker value={stats?.totals?.students || 470} /></div>
                  <div className="text-sm text-ink-500 mt-1">student records</div>
                </div>
                <div data-testid="hero-stat-inst">
                  <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">INSTITUTIONS</div>
                  <div className="font-display text-5xl mt-2"><NumberTicker value={stats?.totals?.institutions || 6} /></div>
                  <div className="text-sm text-ink-500 mt-1">across streams</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recruiter marquee */}
        <div className="mt-20 border-t border-line pt-5 overflow-hidden">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400 px-6 md:px-10 mb-3">PARTNER RECRUITERS · LIVE</div>
          <div className="overflow-hidden">
            <div className="flex marquee-track whitespace-nowrap will-change-transform">
              {[...Array(2)].map((_, k) => (
                <div key={k} className="flex items-center gap-14 px-8 shrink-0">
                  {["Amazon","Google","Microsoft","Salesforce","ServiceNow","Adobe","Goldman Sachs","Intuit","Walmart Global Tech","DE Shaw","Cisco","JP Morgan","Nvidia","Oracle","SAP","Atlassian","Uber","Deloitte","Accenture","TCS","Infosys","ZS Associates","Capgemini"].map((c) => (
                    <span key={`${k}-${c}`} className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink-900 inline-flex items-center gap-3">
                      <span>{c}</span>
                      <span className="w-1.5 h-1.5 bg-accent" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== STORY (pinned) ===== */}
      <section id="story" ref={storyRef} className="relative px-6 md:px-10 py-24 bg-bone-50 border-t border-b border-line">
        <div className="max-w-[1440px] mx-auto grid grid-cols-12 gap-8">
          <div className="story-pin col-span-12 md:col-span-4 self-start md:sticky md:top-24 h-fit">
            <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ 01 · THE FOG</div>
            <h2 className="font-display text-5xl md:text-6xl tracking-tightest mt-3 leading-[0.96]" data-testid="story-title">
              Spreadsheets <span className="text-ink-400">don't scale</span>
              <br />placement cells.
            </h2>
            <p className="font-serif text-lg text-ink-500 mt-5 max-w-md">
              Walk into any TPO office in India. You'll find the same setup —
              one master Excel, a dozen WhatsApp groups, faculty memory, last-week's screenshot. CareerOS is the layer above.
            </p>
          </div>
          <div className="col-span-12 md:col-span-8 space-y-32 pt-8">
            {[
              { tag: "PAIN · 01", title: "Which student is actually placement-ready?", body: "Today: gut feel from faculty + CGPA. CareerOS: a composite Readiness Score combining DSA solve rate, ATS resume score, mock interview confidence, aptitude accuracy and project depth." },
              { tag: "PAIN · 02", title: "Did the training program actually work?", body: "Today: anecdotes after results are out. CareerOS: module-level telemetry — completion %, drop-off, intervention triggers, before-after impact on placement rate." },
              { tag: "PAIN · 03", title: "Who really hires from this campus?", body: "Today: a recruiter list someone forwarded. CareerOS: a live ledger of every recruiter × selection × CTC across a decade, queryable by department and year." },
              { tag: "PAIN · 04", title: "Is our partnership healthy?", body: "Today: 'when does the MOU expire?' is a quarterly fire-drill. CareerOS: countdowns, seat utilization, accrued revenue share — audit-ready always." },
            ].map((s, i) => (
              <div key={i} className="story-step opacity-0 translate-y-12" data-testid={`story-step-${i}`}>
                <div className="font-mono text-[10px] tracking-[0.28em] text-accent">{s.tag}</div>
                <h3 className="font-display text-4xl md:text-5xl tracking-tightest mt-3 leading-[0.96]">{s.title}</h3>
                <p className="font-serif text-lg text-ink-700 mt-4 max-w-xl">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MODULES BENTO ===== */}
      <section id="modules" ref={moduleRef} className="relative px-6 md:px-10 py-24 bg-ink-900 text-bone-100">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-12 gap-8 mb-14">
            <div className="col-span-12 md:col-span-6">
              <div className="font-mono text-[10px] tracking-[0.28em] text-bone-100/40">§ 02 · THE OPERATING SYSTEM</div>
              <h2 className="font-display text-5xl md:text-7xl tracking-tightest mt-3 leading-[0.92]" data-testid="modules-title">
                Thirteen modules. <span className="text-accent">One canvas.</span>
              </h2>
            </div>
            <div className="col-span-12 md:col-span-5 md:col-start-8 self-end">
              <p className="font-serif text-lg text-bone-100/70" data-testid="modules-subtitle">
                Each module replaces a workflow that currently lives in spreadsheets,
                group chats or faculty memory. Together they form an institutional layer.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 auto-rows-[260px]">
            {[
              { code: "01", title: "Student Intelligence", body: "Composite readiness score from CGPA, skills, DSA, ATS and interviews.", icon: Users, span: "col-span-12 md:col-span-6 md:row-span-2", big: true },
              { code: "02", title: "DSA Intelligence", body: "Striver A2Z tracker. Topic-level analytics, leaderboard, intervention triggers.", icon: Code2, span: "col-span-12 md:col-span-6" },
              { code: "03", title: "Aptitude Intelligence", body: "Quant · Reasoning · Verbal · DI. Accuracy, speed, weakness map.", icon: Brain, span: "col-span-12 md:col-span-3" },
              { code: "04", title: "Resume ATS", body: "Score, keyword gap, recruiter compatibility.", icon: FileText, span: "col-span-12 md:col-span-3" },
              { code: "05", title: "Interview AI", body: "Confidence, communication, technical depth — score every mock.", icon: MessageSquare, span: "col-span-12 md:col-span-4" },
              { code: "06", title: "Application Pipeline", body: "Applied → Shortlisted → Interview → Selected. Track every candidate.", icon: Send, span: "col-span-12 md:col-span-4" },
              { code: "07", title: "Placement Intelligence", body: "Decade of offers, CTC trajectory, department win-rate.", icon: BarChart3, span: "col-span-12 md:col-span-4" },
              { code: "08", title: "Recruiter Network", body: "Talent pool view, drive scheduling, hiring trends.", icon: Building2, span: "col-span-12 md:col-span-6" },
              { code: "09", title: "Training Ops", body: "CRT · FDP · Communication. Module-level completion, instructor accountability.", icon: GraduationCap, span: "col-span-12 md:col-span-3" },
              { code: "10", title: "MOU Vault", body: "Documents, renewal countdown, revenue share.", icon: FileText, span: "col-span-12 md:col-span-3" },
            ].map((m) => (
              <div key={m.code} data-testid={`module-${m.code}`}
                className={`module-card opacity-0 ${m.span} border border-bone-100/15 hover:border-accent transition-colors p-6 flex flex-col justify-between relative overflow-hidden`}>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] tracking-[0.24em] text-bone-100/40">§ {m.code}</span>
                  <m.icon size={18} className="text-accent" />
                </div>
                <div>
                  <h3 className={`font-display tracking-tight leading-[1] ${m.big ? "text-5xl md:text-6xl" : "text-2xl"}`}>{m.title}</h3>
                  <p className={`text-bone-100/60 mt-3 ${m.big ? "text-base max-w-md" : "text-sm"}`}>{m.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LIVE DATA / DECADE ===== */}
      <section id="data" className="relative px-6 md:px-10 py-28 bg-bone-100">
        <div className="parallax-mark absolute right-8 top-12 w-32 h-32 bg-accent opacity-90 hidden md:block" />
        <div className="max-w-[1440px] mx-auto relative">
          <div className="flex items-baseline justify-between mb-12">
            <div>
              <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ 03 · INSTITUTIONAL LIVE FEED</div>
              <h2 className="font-display text-5xl md:text-7xl tracking-tightest mt-3" data-testid="data-title">A decade. <span className="text-ink-400">On one canvas.</span></h2>
            </div>
            <Link to="/login" className="hidden md:inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-ink-700 hover:text-accent">VIEW FULL DATASET <ArrowUpRight size={14} /></Link>
          </div>
          <div className="grid grid-cols-12 gap-4">
            {(stats?.years || []).slice(0, 9).reverse().slice(-9).map((y) => (
              <div key={y.academic_year} className="col-span-12 sm:col-span-6 md:col-span-4 editorial p-7" data-testid={`year-${y.academic_year}`}>
                <div className="font-mono text-[11px] text-ink-400 tracking-[0.2em]">AY · {y.academic_year}</div>
                <div className="font-display text-6xl mt-3 tracking-tightest tnum"><NumberTicker value={y.offers} /></div>
                <div className="text-sm text-ink-500 mt-1">offers · {y.companies} recruiters</div>
                <div className="hairline my-5" />
                <div className="flex items-end justify-between">
                  <div>
                    <div className="font-mono text-[10px] text-ink-400 tracking-[0.24em]">AVG</div>
                    <div className="font-display text-2xl mt-1"><NumberTicker value={y.avg_lpa} decimals={2} prefix="₹" suffix="L" /></div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[10px] text-ink-400 tracking-[0.24em]">TOP · {y.top_company?.toUpperCase?.()}</div>
                    <div className="font-display text-2xl mt-1"><NumberTicker value={y.top_offer_lpa} decimals={1} prefix="₹" suffix="L" /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TOP RECRUITERS LEDGER ===== */}
      <section className="px-6 md:px-10 py-24 bg-bone-50">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-12 gap-8 mb-10">
            <div className="col-span-12 md:col-span-6">
              <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ 04 · WHO ACTUALLY HIRES?</div>
              <h2 className="font-display text-5xl md:text-6xl tracking-tightest mt-3 reveal-up">Every selection on record.</h2>
            </div>
            <div className="col-span-12 md:col-span-5 md:col-start-8 self-end">
              <p className="font-serif text-lg text-ink-700">Pulled live from the placement layer. Sorted by all-time selections.</p>
            </div>
          </div>

          <div className="editorial">
            <div className="grid grid-cols-12 px-6 py-3 border-b border-line font-mono text-[10px] tracking-[0.24em] text-ink-400">
              <div className="col-span-1">#</div>
              <div className="col-span-5">RECRUITER</div>
              <div className="col-span-3 text-right">SELECTS · ALL TIME</div>
              <div className="col-span-3 text-right">MAX CTC</div>
            </div>
            {(stats?.top_recruiters || []).slice(0, 12).map((r, i) => (
              <div key={r.company} className="grid grid-cols-12 px-6 py-5 border-b border-line items-center hover:bg-bone-200 transition-colors group" data-testid={`recruiter-row-${i}`}>
                <div className="col-span-1 font-mono text-sm text-ink-400">{String(i + 1).padStart(2, "0")}</div>
                <div className="col-span-5 font-display text-2xl tracking-tight group-hover:text-accent transition-colors">{r.company}</div>
                <div className="col-span-3 text-right font-mono text-lg tnum">{r.selects}</div>
                <div className="col-span-3 text-right font-mono text-lg text-accent tnum">₹{r.max_ctc?.toFixed(1)}L</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section id="cta" className="px-6 md:px-10 py-36 bg-ink-900 text-bone-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "linear-gradient(135deg, transparent 49.5%, #FF3B00 49.5%, #FF3B00 50.5%, transparent 50.5%)", backgroundSize: "60px 60px" }} />
        <div className="max-w-[1440px] mx-auto relative">
          <div className="font-mono text-[11px] tracking-[0.28em] text-bone-100/40">§ 05 · GET ACCESS</div>
          <h2 className="font-display text-6xl md:text-[8vw] tracking-tightest leading-[0.9] mt-6 max-w-5xl">
            Bring your placement cell <span className="text-accent">into the present.</span>
          </h2>
          <p className="font-serif text-xl text-bone-100/70 mt-8 max-w-2xl">
            Verified institutional partners only. Onboarding takes 9 minutes — Google OAuth + super-admin approval.
          </p>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link to="/login" data-testid="footer-cta-primary" className="inline-flex items-center gap-3 bg-accent text-bone-100 px-8 py-5 text-base font-medium hover:bg-bone-100 hover:text-ink-900 transition-colors">
              Request access <ArrowUpRight size={18} />
            </Link>
            <a href="mailto:hello@careeros.app" className="inline-flex items-center gap-3 border border-bone-100/30 px-8 py-5 text-base font-medium hover:border-accent hover:text-accent transition-colors">
              Talk to founders
            </a>
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-10 py-10 border-t border-line bg-bone-100">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-ink-900 grid place-items-center"><div className="w-1.5 h-1.5 bg-accent" /></div>
            <span className="font-mono text-[11px] tracking-[0.24em] text-ink-500">CAREEROS · SKILL TANK · {new Date().getFullYear()}</span>
          </div>
          <div className="font-mono text-[11px] tracking-[0.24em] text-ink-400">DATA SEEDED FROM KMIT.IN/PLACEMENTS · 2017–2026</div>
        </div>
      </footer>
    </main>
  );
}

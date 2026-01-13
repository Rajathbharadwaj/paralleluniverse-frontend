"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Eye, FileText, AlertTriangle, Check, X } from "lucide-react";

// Typewriter hook for cycling through words
function useTypewriter(words: string[], typingSpeed = 100, deletingSpeed = 50, pauseDuration = 2000) {
  const [displayText, setDisplayText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentWord.length) {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

  return displayText;
}

// Interactive Agent Demo showing the engage flow
function AgentActivityDemo() {
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [tasks, setTasks] = useState<Array<{ text: string; done: boolean }>>([]);
  const [results, setResults] = useState<Array<{ label: string; value: string }>>([]);
  const [qualityChecks, setQualityChecks] = useState<string[]>([]);

  const fullCommand = "engage";

  const taskList = [
    "Analyze page to see what posts are visible",
    "Navigate to For You page",
    "Find relevant conversations",
    "Generate authentic comments",
    "Send thoughtful replies",
    "Workflow complete",
  ];

  const campaignResults = [
    { label: "Thoughtful Interactions", value: "13 successful replies" },
    { label: "Timely Responses", value: "3 comments" },
    { label: "Genuine Engagement", value: "4 meaningful interactions" },
    { label: "Strategic Replies", value: "3 well-placed responses" },
  ];

  const qualityItems = [
    "Quality over quantity engagement",
    "All comments authentic to your voice",
    "Mix of technical depth + relatable content",
    "Strategic positioning in relevant threads",
  ];

  useEffect(() => {
    let cancelled = false;
    const timeouts: NodeJS.Timeout[] = [];
    const intervals: NodeJS.Timeout[] = [];

    if (phase === 0) {
      let i = 0;
      const typeInterval = setInterval(() => {
        if (cancelled) return;
        if (i < fullCommand.length) {
          setTypedText(fullCommand.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typeInterval);
          const t = setTimeout(() => !cancelled && setPhase(1), 600);
          timeouts.push(t);
        }
      }, 120);
      intervals.push(typeInterval);
    }

    if (phase === 1) {
      let i = 0;
      const taskInterval = setInterval(() => {
        if (cancelled) return;
        if (i < taskList.length) {
          setTasks(taskList.slice(0, i + 1).map(text => ({ text, done: true })));
          i++;
        } else {
          clearInterval(taskInterval);
          const t = setTimeout(() => !cancelled && setPhase(2), 400);
          timeouts.push(t);
        }
      }, 350);
      intervals.push(taskInterval);
    }

    if (phase === 2) {
      let i = 0;
      const resultInterval = setInterval(() => {
        if (cancelled) return;
        if (i < campaignResults.length) {
          setResults(campaignResults.slice(0, i + 1));
          i++;
        } else {
          clearInterval(resultInterval);
          let q = 0;
          const qualityInterval = setInterval(() => {
            if (cancelled) return;
            if (q < qualityItems.length) {
              setQualityChecks(qualityItems.slice(0, q + 1));
              q++;
            } else {
              clearInterval(qualityInterval);
              const t = setTimeout(() => {
                if (cancelled) return;
                setPhase(0);
                setTypedText("");
                setTasks([]);
                setResults([]);
                setQualityChecks([]);
              }, 3500);
              timeouts.push(t);
            }
          }, 300);
          intervals.push(qualityInterval);
        }
      }, 400);
      intervals.push(resultInterval);
    }

    return () => {
      cancelled = true;
      intervals.forEach(clearInterval);
      timeouts.forEach(clearTimeout);
    };
  }, [phase]);

  return (
    <div className="relative max-w-4xl mx-auto mt-16">
      <div className="absolute -inset-px bg-gradient-to-b from-orange-500/20 to-transparent rounded-2xl blur-xl opacity-50" />

      <div className="relative bg-[#111111] border border-zinc-800/80 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/50 bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">
                <InfinityLogo className="w-4 h-4" />
              </div>
              <span className="text-white text-sm font-medium">Parallel Universe</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-500">
              <span className="px-2 py-1 bg-zinc-800/50 rounded">Dashboard</span>
              <span className="px-2 py-1 hover:bg-zinc-800/50 rounded">Workflows</span>
              <span className="px-2 py-1 hover:bg-zinc-800/50 rounded">Automations</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              VNC Connected
            </span>
          </div>
        </div>

        <div className="flex">
          <div className="w-1/2 border-r border-zinc-800/50 p-4 min-h-[340px] relative">
            <div className="mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Tasks</span>
              <span className="ml-2 text-xs text-zinc-600">COMPLETED</span>
            </div>

            <div className="space-y-2 mb-4">
              {tasks.map((task, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm"
                  style={{ animation: "slideIn 0.2s ease-out" }}
                >
                  <span className="text-green-400 text-xs">✓</span>
                  <span className="text-zinc-400">{task.text}</span>
                </div>
              ))}
              {tasks.length === 0 && phase === 0 && (
                <div className="text-zinc-600 text-sm">Waiting for command...</div>
              )}
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2 text-zinc-300 text-sm">
                  <span className="text-zinc-500">{phase === 0 ? "Write your message..." : ""}</span>
                  {phase === 0 && typedText && <span className="text-white">{typedText}</span>}
                  {phase === 0 && <span className="w-0.5 h-4 bg-orange-500 animate-pulse" />}
                  {phase > 0 && <span className="text-zinc-400">engage</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="w-1/2 p-4 min-h-[340px] bg-zinc-900/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-orange-400 text-sm font-medium">PsY Agent</span>
              <span className="text-zinc-600 text-xs">Threads</span>
            </div>

            {results.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-400">📊</span>
                  <span className="text-white text-sm font-medium">Campaign Results</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {results.filter(Boolean).map((result, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between"
                      style={{ animation: "slideIn 0.2s ease-out" }}
                    >
                      <span className="text-zinc-400">{result?.label}:</span>
                      <span className="text-zinc-300">{result?.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {qualityChecks.length > 0 && (
              <div>
                <div className="text-zinc-500 text-xs mb-2">Quality Summary:</div>
                <div className="space-y-1">
                  {qualityChecks.filter(check => check && check.trim()).map((check, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs"
                      style={{ animation: "slideIn 0.2s ease-out" }}
                    >
                      <span className="text-green-400 mt-0.5">✅</span>
                      <span className="text-zinc-400">{check}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.length === 0 && (
              <div className="flex items-center justify-center h-[200px] text-zinc-600 text-sm">
                Results will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Infinity Logo Component
function InfinityLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 20" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 10C20 10 15 3 9 3C4.5 3 2 6.5 2 10C2 13.5 4.5 17 9 17C15 17 20 10 20 10ZM20 10C20 10 25 17 31 17C35.5 17 38 13.5 38 10C38 6.5 35.5 3 31 3C25 3 20 10 20 10Z"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Generate stars with fixed positions (seeded)
function generateStars(count: number) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 1.618033988749;
    stars.push({
      left: `${(seed * 61.8) % 100}%`,
      top: `${(seed * 38.2) % 100}%`,
      delay: `${(seed * 0.5) % 3}s`,
      duration: `${2 + (seed % 3)}s`,
      opacity: 0.2 + ((seed * 0.3) % 0.5),
      size: `${1 + (seed % 2)}px`,
    });
  }
  return stars;
}

const STARS = generateStars(50);

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Custom styles */}
      <style jsx global>{`
        .font-mono { font-family: 'MonoLisa', monospace !important; }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(1deg); }
        }

        @keyframes heartbeat-glow {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }

        .gradient-text {
          background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stars {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          animation: twinkle 3s ease-in-out infinite;
        }

        .nebula {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: float-slow 20s ease-in-out infinite;
        }
      `}</style>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] transition-all ${scrolled ? "border-b border-zinc-800" : ""}`}>
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center font-mono">
          <div className="flex items-center gap-3">
            <InfinityLogo className="w-10 h-5" />
            <span className="font-semibold text-white text-lg">Parallel Universe</span>
          </div>

          <div className="hidden md:flex items-center gap-12 ml-16">
            <a href="#how-it-works" className="text-zinc-400 hover:text-white transition-colors uppercase tracking-wider text-sm">How it Works</a>
            <a href="#who-its-for" className="text-zinc-400 hover:text-white transition-colors uppercase tracking-wider text-sm">Who It's For</a>
            <a href="#pricing" className="text-zinc-400 hover:text-white transition-colors uppercase tracking-wider text-sm">Pricing</a>
            <Link href="/blog" className="text-zinc-400 hover:text-white transition-colors uppercase tracking-wider text-sm">Blog</Link>
          </div>

          <div className="flex items-center ml-auto">
            <Link
              href="/sign-up"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-6 py-2.5 rounded transition-colors"
            >
              Early Access
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        {/* Galaxy Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="stars">
            {STARS.map((star, i) => (
              <div
                key={i}
                className="star"
                style={{
                  left: star.left,
                  top: star.top,
                  animationDelay: star.delay,
                  animationDuration: star.duration,
                  opacity: star.opacity,
                  width: star.size,
                  height: star.size,
                }}
              />
            ))}
          </div>

          <div
            className="nebula"
            style={{
              left: '10%',
              top: '20%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            }}
          />
          <div
            className="nebula"
            style={{
              right: '5%',
              top: '10%',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(249, 115, 22, 0.2) 0%, transparent 70%)',
              animationDelay: '5s',
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          {/* Tagline with infinity heartbeat */}
          <div className="relative mb-8 max-w-2xl mx-auto overflow-visible">
            {/* Background glow with heartbeat */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[120px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.6) 0%, rgba(249, 115, 22, 0.3) 40%, transparent 70%)',
                filter: 'blur(30px)',
                animation: 'heartbeat-glow 2.5s ease-in-out infinite'
              }}
            />
            <p className="relative text-zinc-300 text-lg md:text-xl flex items-center justify-center gap-2">
              <span>Presence</span>
              <span
                className="text-orange-400 text-3xl font-bold"
                style={{
                  textShadow: '0 0 20px rgba(249, 115, 22, 0.8), 0 0 40px rgba(249, 115, 22, 0.5), 0 0 60px rgba(249, 115, 22, 0.3)',
                  filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))'
                }}
              >∞</span>
              <span>without the time cost.</span>
            </p>
          </div>

          {/* Main headline */}
          <h1 className="font-extrabold text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1] mb-6">
            <span className="text-white">Autonomous AI agents that grow your business</span>
            <br />
            <span className="gradient-text">— without losing your voice.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-zinc-300 text-xl md:text-2xl max-w-3xl mx-auto mb-4 leading-relaxed">
            Always-on growth engines that act with restraint, judgment, and control.
          </p>

          {/* Supporting line */}
          <p className="text-zinc-500 text-sm mb-10">
            From X/Twitter engagement to local customer acquisition.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <Link
              href="/sign-up"
              className="group bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg transition-all flex items-center gap-2"
            >
              Get Early Access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="#how-it-works" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
              See how it works →
            </a>
          </div>

          {/* Interactive Workflow Demo */}
          <AgentActivityDemo />
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-bold text-3xl md:text-4xl mb-10 text-white">
            Growth today requires being everywhere.<br />
            <span className="text-zinc-400">Founders don't have that time.</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-10">
            <div className="text-left space-y-3">
              <p className="text-zinc-400">X for thought leadership.</p>
              <p className="text-zinc-400">Instagram and Facebook for local reach.</p>
            </div>
            <div className="text-left space-y-3">
              <p className="text-zinc-400">Google for discovery.</p>
              <p className="text-zinc-400">WhatsApp for customers.</p>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 max-w-2xl mx-auto">
            <p className="text-zinc-300 mb-4">
              Founders and SMB owners have less than an hour a day for marketing.
            </p>
            <p className="text-zinc-400 mb-4">
              Most tools demand weeks of setup and constant babysitting.
            </p>
            <p className="text-orange-400 font-medium">
              That's not sustainable.
            </p>
          </div>
        </div>
      </section>

      {/* Category Definition */}
      <section className="py-20 px-6 bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-bold text-3xl md:text-4xl mb-8 text-white">
            This is not marketing software.<br />
            <span className="gradient-text">It's autonomous execution.</span>
          </h2>

          <div className="space-y-6 mb-10">
            <p className="text-zinc-400 text-lg">
              Most tools assist you.<br />
              <span className="text-white">Parallel Universe operates for you.</span>
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-8 max-w-2xl mx-auto">
            <p className="text-zinc-300 leading-relaxed mb-6">
              Our agents observe live environments, make decisions continuously, execute actions autonomously, and back off when confidence is low.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-zinc-500">No prompts.</div>
              <div className="text-zinc-500">No dashboards.</div>
              <div className="text-zinc-500">No daily management.</div>
            </div>
            <p className="text-orange-400 mt-6 font-medium">
              Growth happens while you work.
            </p>
          </div>
        </div>
      </section>

      {/* Restraint & Judgment */}
      <section id="who-its-for" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-bold text-3xl md:text-4xl mb-8 text-white">
            Autonomy without restraint is reckless.
          </h2>

          <div className="space-y-4 mb-10 max-w-2xl mx-auto">
            <p className="text-zinc-300 text-lg">
              Replies aren't tasks. They're identity.<br />
              <span className="text-zinc-500">One bad reply damages trust.</span>
            </p>
            <p className="text-zinc-400 text-lg mt-6">
              Presence can be delegated. <span className="text-white">Judgment cannot.</span>
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-orange-500/20 rounded-xl p-8 max-w-2xl mx-auto">
            <p className="text-zinc-300 leading-relaxed mb-6">
              Parallel Universe learns your writing style and tone, avoids entire categories of engagement, acts only when confidence is high, and stays silent when unsure — by design.
            </p>
            <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg p-4 mt-6">
              <p className="text-xl font-semibold text-white">
                Silence is not failure. <span className="text-orange-400">Silence is safety.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Actually Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-bold text-3xl md:text-4xl tracking-tight text-white">
              How Parallel Universe Actually Works
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Connect with Control",
                description: "Secure browser extension. No passwords stored. You decide what the system can see.",
                icon: Shield,
              },
              {
                step: "02",
                title: "Scoped Learning",
                description: "The agent learns your tone and your boundaries. Entire categories can be excluded.",
                icon: Eye,
              },
              {
                step: "03",
                title: "Governed Action",
                description: "The system replies only when confidence is high. Uncertainty triggers backoff.",
                icon: AlertTriangle,
              },
              {
                step: "04",
                title: "Full Traceability",
                description: "Every action is logged. Silence is treated as a valid outcome.",
                icon: FileText,
              },
            ].map((item, i) => (
              <div key={i} className="bg-[#111111] border border-zinc-800/50 rounded-xl p-6">
                <div className="text-orange-500/30 font-bold text-4xl mb-4">
                  {item.step}
                </div>
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-white">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* X Growth Wedge */}
      <section className="py-20 px-6 bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold text-3xl md:text-4xl mb-4 text-white">
              Start with X/Twitter — where voice matters most.
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Our first agent focuses on X because public presence directly impacts credibility, hiring, deals, and distribution.
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-orange-500/20 rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="font-semibold text-lg mb-6 text-white">The X Growth Agent:</h3>
            <div className="space-y-4 mb-8">
              {[
                "Engages in your writing style",
                "Uses live web research for relevance",
                "Avoids risky conversations",
                "Logs every decision",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <span className="text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-zinc-800 pt-6">
              <p className="text-zinc-400 text-center">
                No spam. No growth hacks. No bot behavior.<br />
                <span className="text-white">Just delegated presence — carefully.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Results / Qualitative Signals */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold text-3xl md:text-4xl mb-4 text-white">
              Real signals — not guaranteed growth
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
            {[
              "Consistent presence without being online all day",
              "Replies that feel natural",
              "Backoff when uncertain",
              "Full logging and control",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-4"
              >
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-zinc-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-20 px-6 bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto">
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-10">
            <h2 className="font-bold text-2xl md:text-3xl mb-8 text-white">
              We didn't start with a hypothesis.<br />
              <span className="text-zinc-400">We started with a customer.</span>
            </h2>
            <div className="text-zinc-400 space-y-4 leading-relaxed">
              <p>
                A restaurant owner showed us the DIY system he built just to get customers — and asked us to turn it into something real.
              </p>
              <p>
                He offered to invest if we built it right.
              </p>
              <p className="text-zinc-300">
                We already had the agent infrastructure.<br />
                Applying it to local marketing was the natural next step.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expansion - SMB Roadmap */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-bold text-3xl md:text-4xl mb-6 text-white">
            The same engine powers local growth.
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10">
            The same autonomous agents that manage presence on X can run local content, manage ads, respond to customer messages, and optimize for real-world outcomes.
          </p>

          <div className="flex justify-center gap-8 mb-8">
            <span className="text-zinc-500">Restaurants.</span>
            <span className="text-zinc-500">Salons.</span>
            <span className="text-zinc-500">Gyms.</span>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 max-w-md mx-auto">
            <p className="text-zinc-300">
              Same core system. Different surfaces.<br />
              <span className="text-orange-400">Launching progressively.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-bold text-3xl md:text-4xl mb-4 text-white">
            Pricing (Intentionally Opinionated)
          </h2>
          <p className="text-zinc-400 text-lg mb-4 max-w-2xl mx-auto">
            Parallel Universe is priced to attract serious use.
          </p>
          <p className="text-zinc-500 mb-10 max-w-xl mx-auto">
            If you're experimenting casually, this probably isn't for you — and that's okay.
          </p>

          <div className="flex items-center justify-center mb-6">
            <Link
              href="/pricing"
              className="group bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors flex items-center gap-2"
            >
              Choose Your Guardrails
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <p className="text-zinc-600 text-sm">
            If it doesn't feel safe or useful, cancel anytime.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-bold text-3xl md:text-4xl mb-4 text-white">
            We're onboarding early users.
          </h2>
          <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto">
            Parallel Universe is for founders and operators who value autonomy and judgment. If that's you, we want your feedback.
          </p>

          <div className="flex flex-col items-center gap-3">
            <Link
              href="/sign-up"
              className="group bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg transition-all flex items-center gap-2"
            >
              Get Early Access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <p className="text-zinc-500 text-sm">
              Early users receive <span className="text-orange-400">25% off</span>.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <InfinityLogo className="w-7 h-3.5" />
              <span className="font-semibold text-white">Parallel Universe</span>
            </div>

            <div className="text-zinc-500 text-sm text-center">
              Delegated presence. Governed behavior. No shortcuts.
            </div>

            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
              <a href="mailto:support@paralleluniverse.ai" className="hover:text-zinc-300 transition-colors">Contact</a>
            </div>
          </div>

          <div className="text-center mt-6 text-sm text-zinc-600">
            © 2025 Parallel Universe
          </div>
        </div>
      </footer>
    </div>
  );
}

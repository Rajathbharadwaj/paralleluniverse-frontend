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
    "Find and reply to viral threads",
    "Generate authentic comments",
    "Post engagements",
    "Workflow complete",
  ];

  const campaignResults = [
    { label: "Total Engagements", value: "13 successful interactions" },
    { label: "Early Bird Special", value: "3 comments" },
    { label: "Follower Farming", value: "4 like + comment combos" },
    { label: "Reply Guy Strategy", value: "3 like + comment on viral posts" },
  ];

  const qualityItems = [
    "13 high-quality engagements with smart filtering",
    "All comments authentic to your voice",
    "Mix of technical depth + relatable content",
    "Strategic positioning on viral threads",
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
          </div>

          <div className="flex items-center ml-auto">
            <div className="hidden md:block h-6 w-px bg-zinc-700 mx-8" />
            <Link href="/sign-in" className="text-zinc-400 hover:text-white transition-colors text-sm mr-5">
              Sign In
            </Link>
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
            <span className="text-white">Delegate Your Presence</span>
            <br />
            <span className="gradient-text">Without Losing Your Voice</span>
          </h1>

          {/* Subheadline */}
          <p className="text-zinc-300 text-xl md:text-2xl max-w-3xl mx-auto mb-4 leading-relaxed">
            Parallel Universe is a governed AI engagement system that helps you stay present on X without being online all day.
          </p>

          {/* Clarifier */}
          <p className="text-zinc-500 text-sm mb-10">
            Not a growth bot. Not spam. Human judgment stays in the loop.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <Link
              href="/sign-up"
              className="group bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg transition-all flex items-center gap-2"
            >
              Try Parallel Universe (Early Access)
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <p className="text-zinc-600 text-sm">
              Built for people with reputations to protect.
            </p>
          </div>

          {/* Interactive Workflow Demo */}
          <AgentActivityDemo />
        </div>
      </section>

      {/* Trust Filter - This Is Not for Everyone */}
      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold text-3xl md:text-4xl mb-6 text-white">
              This Is Not for Everyone
            </h2>
            <p className="text-zinc-400 text-lg mb-8">
              Parallel Universe is intentionally cautious.
            </p>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 mb-8">
              <p className="text-zinc-400 mb-4">If you're looking for:</p>
              <div className="grid md:grid-cols-2 gap-3 text-left max-w-md mx-auto">
                {[
                  "mass automation",
                  "growth hacks",
                  "auto-replies everywhere",
                  '"dominate X" tactics',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-zinc-500">
                    <span className="text-zinc-600">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-zinc-500 mt-6 text-sm">
                this is probably not for you.
              </p>
            </div>
          </div>

          {/* Who It's For */}
          <div id="who-its-for" className="text-center">
            <h2 className="font-bold text-3xl md:text-4xl mb-6 text-white">
              Who It's For
            </h2>
            <p className="text-zinc-400 text-lg mb-8">
              Parallel Universe is built for:
            </p>
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[
                "Founders with an existing audience",
                "Developers who reply thoughtfully",
                "Researchers, builders, and operators",
                "Anyone whose replies represent judgment",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-4"
                >
                  <Check className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <span className="text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What This Is / Isn't */}
      <section className="py-20 px-6 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* What It's Not */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-8">
              <h3 className="font-bold text-xl mb-6 text-zinc-400">
                What Parallel Universe Is Not
              </h3>
              <div className="space-y-4">
                {[
                  "A growth hack",
                  "An auto-reply bot",
                  "A replacement for your judgment",
                  "Mass engagement automation",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <X className="w-5 h-5 text-red-400/70" />
                    <span className="text-zinc-500">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What It Is */}
            <div className="bg-zinc-900/30 border border-orange-500/20 rounded-xl p-8">
              <h3 className="font-bold text-xl mb-6 text-white">
                What Parallel Universe Is
              </h3>
              <div className="space-y-4">
                {[
                  "Delegated presence with guardrails",
                  "Signal over volume",
                  "Reputation-first engagement",
                  "Designed to back off aggressively",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
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

      {/* Behavior Over Features */}
      <section className="py-20 px-6 bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold text-3xl md:text-4xl mb-4 text-white">
              Designed to Behave Carefully
            </h2>
            <p className="text-zinc-400 text-lg">
              Parallel Universe behaves like this:
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-8">
            <div className="space-y-4 max-w-xl mx-auto">
              {[
                "Replies only when confidence is high",
                "Avoids sensitive or identity-defining contexts",
                "Backs off aggressively when uncertain",
                "Prefers silence over risky engagement",
                "Logs every action for review",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <span className="text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-zinc-500 mt-8 text-sm">
              If that sounds conservative — that's intentional.
            </p>
          </div>
        </div>
      </section>

      {/* Silence Callout */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-10">
            <p className="text-2xl md:text-3xl font-semibold text-white mb-2">
              Silence is not a failure state.
            </p>
            <p className="text-xl md:text-2xl text-zinc-400">
              It's a safety mechanism.
            </p>
          </div>
        </div>
      </section>

      {/* Results / Social Proof */}
      <section className="py-20 px-6 bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold text-3xl md:text-4xl mb-4 text-white">
              What Users Notice First
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
            {[
              "They're present without being online all day",
              "Replies feel natural, not automated",
              "Nothing embarrassing happens",
              "Conversations continue normally",
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

          <div className="text-center text-zinc-500 text-sm space-y-1">
            <p>No growth guarantees.</p>
            <p>No artificial amplification.</p>
            <p className="text-zinc-400">Just consistent presence.</p>
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

      {/* Founder Note */}
      <section className="py-20 px-6 bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto">
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-10">
            <h2 className="font-bold text-2xl mb-6 text-white">
              A Note From the Builder
            </h2>
            <div className="text-zinc-400 space-y-4 leading-relaxed">
              <p>
                I built Parallel Universe because being present online mattered — but being online all day didn't.
              </p>
              <p>
                This system is intentionally cautious.
                <br />
                It will back off more than it replies.
              </p>
              <p className="text-zinc-500">
                If that sounds boring, it's probably not for you.
                <br />
                If that sounds safe — <span className="text-orange-400">welcome</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-bold text-3xl md:text-4xl mb-4 text-white">
            Try Parallel Universe
          </h2>
          <p className="text-zinc-400 text-lg mb-8">
            Early users welcome. Honest feedback encouraged.
          </p>

          <div className="flex flex-col items-center gap-3">
            <Link
              href="/sign-up"
              className="group bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg transition-all flex items-center gap-2"
            >
              Test It Carefully
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <p className="text-zinc-600 text-sm">
              Built for people who care how they show up.
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

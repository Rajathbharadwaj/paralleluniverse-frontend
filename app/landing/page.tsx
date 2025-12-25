"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Clock, TrendingUp, Bot, Calendar, BarChart3, Play, ChevronRight, Users, Zap } from "lucide-react";

// Custom Infinity Logo Component - clean white like Browser Use
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

// Animated counter hook
function useCounter(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    if (startOnView && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [startOnView, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [hasStarted, end, duration]);

  return { count, ref };
}

// Interactive Agent Demo showing the engage flow
function AgentActivityDemo() {
  const [phase, setPhase] = useState(0); // 0: typing, 1: tasks, 2: results
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

    // Phase 0: Type "engage"
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

    // Phase 1: Show tasks completing
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

    // Phase 2: Show results and quality
    if (phase === 2) {
      let i = 0;
      const resultInterval = setInterval(() => {
        if (cancelled) return;
        if (i < campaignResults.length) {
          setResults(campaignResults.slice(0, i + 1));
          i++;
        } else {
          clearInterval(resultInterval);
          // Show quality checks
          let q = 0;
          const qualityInterval = setInterval(() => {
            if (cancelled) return;
            if (q < qualityItems.length) {
              setQualityChecks(qualityItems.slice(0, q + 1));
              q++;
            } else {
              clearInterval(qualityInterval);
              // Reset after a pause
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
    <div className="relative max-w-4xl mx-auto">
      {/* Subtle glow */}
      <div className="absolute -inset-px bg-gradient-to-b from-orange-500/20 to-transparent rounded-2xl blur-xl opacity-50" />

      <div className="relative bg-[#111111] border border-zinc-800/80 rounded-2xl overflow-hidden">
        {/* Header bar */}
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
          {/* Left Panel - Tasks */}
          <div className="w-1/2 border-r border-zinc-800/50 p-4 min-h-[340px]">
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

            {/* Chat input at bottom */}
            <div className="absolute bottom-4 left-4 right-1/2 pr-4">
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

          {/* Right Panel - Results */}
          <div className="w-1/2 p-4 min-h-[340px] bg-zinc-900/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-orange-400 text-sm font-medium">PsY Agent</span>
              <span className="text-zinc-600 text-xs">Threads</span>
            </div>

            {/* Campaign Results */}
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

            {/* Quality Summary */}
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

            {/* Empty state */}
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

// Generate stars with fixed positions (seeded)
function generateStars(count: number) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    // Use index-based pseudo-random for consistent SSR/client rendering
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
  const animatedWord = useTypewriter(["GROW", "ENGAGE", "AUTOMATE", "SCALE"], 120, 80, 1500);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const impressions = useCounter(48000, 2500);
  const engagement = useCounter(847, 2000);
  const followers = useCounter(13, 2200);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Custom styles */}
      <style jsx global>{`
        .font-mono { font-family: 'MonoLisa', monospace !important; }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
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
          {/* Logo */}
          <div className="flex items-center gap-3">
            <InfinityLogo className="w-10 h-5" />
            <span className="font-semibold text-white text-lg">Parallel Universe</span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-12 ml-16">
            <a href="#features" className="text-zinc-400 hover:text-white transition-colors uppercase tracking-wider text-sm">Features</a>
            <a href="#how-it-works" className="text-zinc-400 hover:text-white transition-colors uppercase tracking-wider text-sm">How it Works</a>
            <a href="#pricing" className="text-zinc-400 hover:text-white transition-colors uppercase tracking-wider text-sm">Pricing</a>
          </div>

          {/* Right side */}
          <div className="flex items-center ml-auto">
            {/* Separator */}
            <div className="hidden md:block h-6 w-px bg-zinc-700 mx-8" />

            <Link
              href="/sign-in"
              className="text-zinc-400 hover:text-white transition-colors text-sm mr-5"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-6 py-2.5 rounded transition-colors uppercase tracking-wide"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        {/* Galaxy Background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Stars */}
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

          {/* Nebula clouds */}
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
          <div
            className="nebula"
            style={{
              left: '50%',
              bottom: '10%',
              width: '600px',
              height: '300px',
              background: 'radial-gradient(ellipse, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
              animationDelay: '10s',
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 text-orange-400 text-sm mb-4">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              <span className="font-medium tracking-wide">[ AI-POWERED X GROWTH ]</span>
            </div>

            {/* Tagline */}
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
                <span>In another</span>
                <span
                  className="text-orange-400 text-3xl font-bold"
                  style={{
                    textShadow: '0 0 20px rgba(249, 115, 22, 0.8), 0 0 40px rgba(249, 115, 22, 0.5), 0 0 60px rgba(249, 115, 22, 0.3)',
                    filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))'
                  }}
                >∞</span>
                <span>your X account grows while you sleep.</span>
              </p>
            </div>

            {/* Main headline */}
            <h1 className="font-extrabold text-5xl md:text-7xl lg:text-[5.5rem] tracking-tight leading-[0.95] mb-8">
              <span className="text-white">ENABLE AI TO</span>
              <br />
              <span className="gradient-text inline-block min-w-[200px] md:min-w-[300px]">
                {animatedWord}
                <span className="animate-pulse text-orange-500">|</span>
              </span>
              <br />
              <span className="text-white">YOUR X PRESENCE</span>
            </h1>

            {/* Subtitle */}
            <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              The <span className="text-zinc-300">autonomous AI agent</span> that learns your voice, engages with your audience, and grows your presence on X — while you sleep.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link
                href="/sign-up"
                className="group bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg transition-all flex items-center gap-2"
              >
                Start Growing Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="text-zinc-400 hover:text-white font-medium px-8 py-4 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                See How It Works
              </a>
            </div>
          </div>

          {/* Activity Demo */}
          <AgentActivityDemo />
        </div>
      </section>


      {/* Stats Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-orange-400 text-sm font-medium uppercase tracking-wider">Real Results</span>
            <h2 className="font-bold text-3xl md:text-4xl mt-3 tracking-tight">
              What Our Agent Delivered in <span className="gradient-text">4 Days</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div ref={impressions.ref} className="text-center p-8 bg-[#111111] border border-zinc-800/50 rounded-xl">
              <div className="font-bold text-5xl md:text-6xl gradient-text mb-2 tracking-tight">
                {impressions.count.toLocaleString()}+
              </div>
              <div className="text-zinc-500">Impressions Generated</div>
            </div>

            <div ref={engagement.ref} className="text-center p-8 bg-[#111111] border border-zinc-800/50 rounded-xl">
              <div className="font-bold text-5xl md:text-6xl gradient-text mb-2 tracking-tight">
                {engagement.count.toLocaleString()}
              </div>
              <div className="text-zinc-500">Engagements Driven</div>
            </div>

            <div ref={followers.ref} className="text-center p-8 bg-[#111111] border border-zinc-800/50 rounded-xl">
              <div className="font-bold text-5xl md:text-6xl gradient-text mb-2 tracking-tight">
                +{followers.count.toLocaleString()}
              </div>
              <div className="text-zinc-500">New Followers</div>
            </div>
          </div>

          {/* Comparison */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-4 text-sm">
              <span className="text-zinc-500">Social media manager:</span>
              <span className="text-zinc-600 line-through">$3,000/mo</span>
              <ChevronRight className="w-4 h-4 text-zinc-700" />
              <span className="text-orange-400 font-semibold">Our agent: $99/mo</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-orange-400 text-sm font-medium uppercase tracking-wider">Simple Setup</span>
            <h2 className="font-bold text-3xl md:text-4xl mt-3 tracking-tight">
              Up and Running in <span className="gradient-text">3 Minutes</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect",
                description: "Install our Chrome extension and securely connect your X account. No passwords stored.",
                icon: Zap,
              },
              {
                step: "02",
                title: "Configure",
                description: "Import existing posts or tell us about yourself. The AI learns your unique voice and style.",
                icon: Bot,
              },
              {
                step: "03",
                title: "Grow",
                description: "Set automations and let the agent engage 24/7. Track results in real-time.",
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                {/* Connector */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-zinc-800" />
                )}

                <div className="bg-[#0a0a0a] border border-zinc-800/50 rounded-xl p-8">
                  <div className="text-orange-500/20 font-bold text-5xl mb-4">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-5">
                    <item.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-xl mb-3">{item.title}</h3>
                  <p className="text-zinc-500 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-orange-400 text-sm font-medium uppercase tracking-wider">Features</span>
            <h2 className="font-bold text-3xl md:text-4xl mt-3 tracking-tight">
              Everything You Need to <span className="gradient-text">Dominate X</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Bot,
                title: "AI Growth Agent",
                description: "Autonomous agent that engages with posts in your niche, generating authentic interactions.",
              },
              {
                icon: Calendar,
                title: "Content Scheduling",
                description: "AI-powered content calendar with optimal timing and post generation in your voice.",
              },
              {
                icon: Clock,
                title: "24/7 Automation",
                description: "Set it and forget it. Cron jobs run your growth strategy around the clock.",
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                description: "Track impressions, engagement, and follower growth with detailed insights.",
              },
              {
                icon: Zap,
                title: "Style Learning",
                description: "The AI analyzes your posts and learns to write exactly like you.",
              },
              {
                icon: TrendingUp,
                title: "Smart Targeting",
                description: "Identifies high-value accounts in your niche for maximum growth impact.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group bg-[#111111] border border-zinc-800/50 hover:border-zinc-700/50 rounded-xl p-6 transition-colors"
              >
                <div className="w-10 h-10 bg-zinc-800/50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500/10 transition-colors">
                  <feature.icon className="w-5 h-5 text-zinc-400 group-hover:text-orange-400 transition-colors" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section id="pricing" className="py-24 px-6 bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-orange-400 text-sm font-medium uppercase tracking-wider">Pricing</span>
          <h2 className="font-bold text-3xl md:text-4xl mt-3 mb-6 tracking-tight">
            Your 24/7 Growth Employee for <span className="gradient-text">$99/mo</span>
          </h2>
          <p className="text-zinc-500 text-lg mb-10 max-w-xl mx-auto">
            Plans from $99 to $799/month. All plans include a 30-day money-back guarantee.
          </p>

          <div className="flex items-center justify-center">
            <Link
              href="/pricing"
              className="group bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors flex items-center gap-2"
            >
              View All Plans
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-zinc-600 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              30-day money back
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Cancel anytime
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Secure payments
            </div>
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

            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
              <a href="mailto:support@paralleluniverse.ai" className="hover:text-zinc-300 transition-colors">Contact</a>
            </div>

            <div className="text-sm text-zinc-600">
              © 2025 Parallel Universe
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Eye, FileText, AlertTriangle, Check, X } from "lucide-react";

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

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(1deg); }
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

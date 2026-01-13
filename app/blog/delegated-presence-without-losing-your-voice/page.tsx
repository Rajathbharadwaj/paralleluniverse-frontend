"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-12">
        {/* Back button */}
        <Link href="/landing">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Delegated Presence Without Losing Your Voice
            </h1>
            <p className="text-xl text-muted-foreground">
              Why most AI growth tools fail — and how to stay visible without damaging trust
            </p>
          </header>

          {/* Content */}
          <section className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">The Silent Trade-Off</h2>
              <p>Most founders don't choose to disappear.</p>
              <p>They choose building.</p>
              <p>Again and again.</p>
              <p className="mt-4">
                The product needs attention.<br />
                Customers need support.<br />
                The team needs direction.
              </p>
              <p>Visibility quietly becomes optional.</p>
              <p>
                Not because distribution doesn't matter — but because there's only so much
                cognitive bandwidth in a day.
              </p>
              <p>
                Over time, presence fades.<br />
                Not intentionally.<br />
                Just gradually.
              </p>
              <p className="mt-4">
                And almost every founder I speak to carries the same background tension:
              </p>
              <blockquote className="border-l-4 border-orange-500 pl-4 italic my-6">
                "I know being visible matters."<br />
                "I just don't have the bandwidth to do it properly."
              </blockquote>
              <p>This is the tension that modern AI tools promise to solve.</p>
              <p>And most of them make it worse.</p>
            </div>

            <hr className="my-12 border-border" />

            <div>
              <h2 className="text-2xl font-semibold mb-4">Why Most AI Engagement Tools Fail</h2>
              <p>Automation assumes engagement is a task.</p>
              <p>It isn't.</p>
              <p className="mt-4">
                Replies aren't tasks.<br />
                They're identity.
              </p>
              <p className="font-semibold mt-4">
                One careless comment can do more damage than 100 good ones can repair.
              </p>
              <p className="mt-4">Most tools optimize for:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Volume</li>
                <li>Frequency</li>
                <li>Activity metrics</li>
              </ul>
              <p className="mt-4">They ignore:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Context</li>
                <li>Tone</li>
                <li>Reputation</li>
                <li>Long-term trust</li>
              </ul>
              <p className="mt-4">
                That's why founders try automation once…<br />
                …and quietly turn it off.
              </p>
              <p>
                Not because automation doesn't work —<br />
                but because <strong>unrestrained automation is reckless</strong>.
              </p>
            </div>

            <hr className="my-12 border-border" />

            <div>
              <h2 className="text-2xl font-semibold mb-4">The Rule Most Tools Ignore</h2>
              <h3 className="text-xl font-medium mb-2">Silence Is a Feature</h3>
              <p>In human conversation, silence is often the correct response.</p>
              <p className="mt-4">
                Not every post deserves a reply.<br />
                Not every conversation is safe.<br />
                Not every moment is worth showing up.
              </p>
              <p className="mt-4">Most AI systems are designed to <em>always act</em>.</p>
              <p className="font-semibold">That's the failure mode.</p>
              <p className="mt-4">
                A system that doesn't know when <em>not</em> to act should not act at all.
              </p>
              <blockquote className="border-l-4 border-orange-500 pl-4 italic my-6">
                Silence is not failure.<br />
                Silence is safety.
              </blockquote>
            </div>

            <hr className="my-12 border-border" />

            <div>
              <h2 className="text-2xl font-semibold mb-4">What "Delegated Presence" Actually Means</h2>
              <p>Delegated presence is not outsourcing your personality.</p>
              <p>It's not letting AI "be you."</p>
              <p className="mt-4">It means:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>You delegate presence, not judgment</li>
                <li>You define boundaries, not prompts</li>
                <li>You prioritize restraint over reach</li>
              </ul>
              <p className="mt-4">The system's job is not to grow at all costs.</p>
              <p className="mt-2">Its job is to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Observe</li>
                <li>Decide cautiously</li>
                <li>Act only when confidence is high</li>
                <li>Back off when it isn't</li>
              </ul>
              <p className="font-semibold mt-4">
                Autonomy without restraint isn't leverage.<br />
                It's liability.
              </p>
            </div>

            <hr className="my-12 border-border" />

            <div>
              <h2 className="text-2xl font-semibold mb-4">Where This Model Works (and Where It Doesn't)</h2>
              <p className="font-medium">Works well in:</p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>Public, asynchronous spaces (X / Twitter)</li>
                <li>Thoughtful commentary</li>
                <li>Founder-led presence</li>
                <li>Early-stage credibility building</li>
              </ul>
              <p className="font-medium">Does not belong in:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Customer support escalation</li>
                <li>Regulated or legal communication</li>
                <li>Emotionally charged disputes</li>
                <li>Situations where reversibility is low</li>
              </ul>
              <p className="mt-4 font-semibold">
                Delegation only works when the cost of a mistake is understood.
              </p>
            </div>

            <hr className="my-12 border-border" />

            <div>
              <h2 className="text-2xl font-semibold mb-4">Why I'm Building Parallel Universe</h2>
              <p>I didn't start with a growth hack.</p>
              <p className="mt-2">I started with a question:</p>
              <blockquote className="border-l-4 border-orange-500 pl-4 italic my-6">
                How do you stay visible without being always online —<br />
                without delegating your judgment, identity, or voice?
              </blockquote>
              <p>Parallel Universe is an attempt to answer that question carefully.</p>
              <p className="mt-4">It's built on:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Autonomous agents with confidence thresholds</li>
                <li>Explicit backoff behavior</li>
                <li>Full action traceability</li>
                <li>Human-in-the-loop control by design</li>
              </ul>
              <p className="mt-4">
                No prompts.<br />
                No dashboards.<br />
                No constant babysitting.
              </p>
              <p className="font-semibold mt-4">Just delegated presence — governed.</p>
            </div>

            <hr className="my-12 border-border" />

            {/* CTA Section */}
            <div className="bg-muted/50 rounded-lg p-8 mt-12">
              <h2 className="text-2xl font-semibold mb-4">Early Access</h2>
              <p className="mb-2">
                If this way of thinking resonates, I'm opening a small number of conversations
                with founders and operators who care about autonomy with restraint.
              </p>
              <p className="mb-2">This isn't a sales form — it's a signal.</p>
              <p className="mb-6">If you're curious, you can leave your details below.</p>

              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  Request Early Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <p className="text-sm text-muted-foreground mt-6">
                Parallel Universe is intentionally onboarding slowly.<br />
                Not every request will be accepted immediately.
              </p>
            </div>

            <hr className="my-12 border-border" />

            {/* Final Note */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Final Note</h2>
              <p>This isn't about guaranteed growth.</p>
              <p className="mt-4">
                It's about staying present<br />
                without becoming someone you're not.
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}

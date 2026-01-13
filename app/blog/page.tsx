"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const blogPosts = [
  {
    slug: "delegated-presence-without-losing-your-voice",
    title: "Delegated Presence Without Losing Your Voice",
    description: "On building AI that acts with restraint, judgment, and control — because autonomy without guardrails is just another way to lose trust.",
    date: "January 2026",
    readTime: "8 min read",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Back button */}
        <Link href="/landing">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-2">Blog</h1>
        <p className="text-muted-foreground mb-12">
          Thoughts on AI, autonomy, and building products that respect trust.
        </p>

        <div className="space-y-8">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <article className="border border-border rounded-lg p-6 transition-colors hover:border-orange-500/50 hover:bg-muted/30">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="text-2xl font-semibold mb-2 group-hover:text-orange-500 transition-colors">
                  {post.title}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {post.description}
                </p>
                <span className="inline-flex items-center text-orange-500 text-sm font-medium">
                  Read more
                  <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  const lastUpdated = "December 23, 2024";
  const companyName = "Parallel Universe";
  const companyEmail = "privacy@paralleluniverse.ai";
  const websiteUrl = "https://paralleluniverse.ai";

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Back button */}
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>

          <section className="mt-8">
            <h2>1. Introduction</h2>
            <p>
              {companyName} ("we", "us", or "our") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our Service.
            </p>
            <p>
              Please read this Privacy Policy carefully. By using the Service, you consent to
              the collection and use of your information as described in this policy.
            </p>
          </section>

          <section className="mt-8">
            <h2>2. Information We Collect</h2>

            <h3>2.1 Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li>Email address</li>
              <li>Name (if provided)</li>
              <li>Profile picture (from authentication provider)</li>
              <li>Account preferences and settings</li>
            </ul>

            <h3>2.2 Authentication Data</h3>
            <p>
              We use Clerk for authentication. When you sign in, Clerk may collect:
            </p>
            <ul>
              <li>Email address</li>
              <li>OAuth tokens from social login providers (Google, etc.)</li>
              <li>Session information</li>
            </ul>

            <h3>2.3 Social Media Connection Data</h3>
            <p>When you connect your social media accounts through our Chrome extension:</p>
            <ul>
              <li>
                <strong>Session Cookies:</strong> We temporarily store session cookies to
                authenticate actions on your behalf. These are encrypted and used only to
                operate the Service.
              </li>
              <li>
                <strong>Username/Handle:</strong> Your social media username for display purposes.
              </li>
              <li>
                <strong>We do NOT store:</strong> Your social media passwords, personal messages,
                or private account data beyond what's necessary to provide the Service.
              </li>
            </ul>

            <h3>2.4 Usage Data</h3>
            <p>We automatically collect:</p>
            <ul>
              <li>Actions performed through the Service (posts created, engagements made)</li>
              <li>Feature usage and preferences</li>
              <li>Performance data and error logs</li>
              <li>Device information (browser type, operating system)</li>
              <li>IP address and approximate location</li>
            </ul>

            <h3>2.5 Payment Information</h3>
            <p>
              Payment processing is handled by Stripe. We do not store your full credit card
              numbers. Stripe may collect:
            </p>
            <ul>
              <li>Payment card details (stored securely by Stripe)</li>
              <li>Billing address</li>
              <li>Transaction history</li>
            </ul>

            <h3>2.6 Content Data</h3>
            <p>
              To provide AI-powered features, we process:
            </p>
            <ul>
              <li>Posts you create or import for style analysis</li>
              <li>Content preferences and topics of interest</li>
              <li>Engagement history for learning your preferences</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2>3. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul>
              <li>Provide, maintain, and improve the Service</li>
              <li>Process transactions and manage subscriptions</li>
              <li>Authenticate and perform actions on connected social media accounts</li>
              <li>Generate AI-powered content in your writing style</li>
              <li>Analyze engagement patterns and optimize automations</li>
              <li>Send service-related communications and updates</li>
              <li>Provide customer support</li>
              <li>Detect and prevent fraud, abuse, or security issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2>4. Data Sharing and Disclosure</h2>
            <p>We may share your information with:</p>

            <h3>4.1 Service Providers</h3>
            <ul>
              <li><strong>Clerk:</strong> Authentication services</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Google Cloud Platform:</strong> Infrastructure and hosting</li>
              <li><strong>Anthropic/OpenAI:</strong> AI model providers for content generation</li>
              <li><strong>LangSmith:</strong> AI monitoring and analytics</li>
            </ul>

            <h3>4.2 Legal Requirements</h3>
            <p>
              We may disclose information if required by law, court order, or government
              request, or to protect our rights, safety, or property.
            </p>

            <h3>4.3 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or sale of assets, your information may
              be transferred to the acquiring entity.
            </p>

            <h3>4.4 With Your Consent</h3>
            <p>
              We may share information for other purposes with your explicit consent.
            </p>

            <p className="font-semibold mt-4">
              We do NOT sell your personal information to third parties.
            </p>
          </section>

          <section className="mt-8">
            <h2>5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information:
            </p>
            <ul>
              <li>Encryption in transit (TLS/HTTPS) and at rest</li>
              <li>Secure cloud infrastructure with access controls</li>
              <li>Regular security audits and monitoring</li>
              <li>Session cookies are encrypted and stored securely</li>
              <li>Employee access limited on a need-to-know basis</li>
            </ul>
            <p>
              However, no method of transmission or storage is 100% secure. We cannot
              guarantee absolute security of your data.
            </p>
          </section>

          <section className="mt-8">
            <h2>6. Data Retention</h2>
            <p>We retain your information as follows:</p>
            <ul>
              <li>
                <strong>Account Data:</strong> Retained while your account is active and for
                a reasonable period afterward for legal and business purposes.
              </li>
              <li>
                <strong>Session Cookies:</strong> Automatically expire and are refreshed as
                needed. Deleted immediately upon account disconnection.
              </li>
              <li>
                <strong>Usage Analytics:</strong> Aggregated and anonymized data may be
                retained indefinitely for product improvement.
              </li>
              <li>
                <strong>Payment Records:</strong> Retained as required for tax and legal
                compliance (typically 7 years).
              </li>
            </ul>
          </section>

          <section className="mt-8">
            <h2>7. Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul>
              <li>
                <strong>Access:</strong> Request a copy of your personal data we hold.
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate information.
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and associated data.
              </li>
              <li>
                <strong>Portability:</strong> Receive your data in a portable format.
              </li>
              <li>
                <strong>Disconnect:</strong> Revoke social media account connections at any time.
              </li>
              <li>
                <strong>Opt-out:</strong> Unsubscribe from marketing communications.
              </li>
            </ul>
            <p>
              To exercise these rights, contact us at {companyEmail}.
            </p>
          </section>

          <section className="mt-8">
            <h2>8. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies for:</p>
            <ul>
              <li>Authentication and session management</li>
              <li>Remembering your preferences</li>
              <li>Analytics and performance monitoring</li>
              <li>Security and fraud prevention</li>
            </ul>
            <p>
              You can control cookies through your browser settings, but disabling cookies
              may affect Service functionality.
            </p>
          </section>

          <section className="mt-8">
            <h2>9. Third-Party Links</h2>
            <p>
              The Service may contain links to third-party websites or services. We are not
              responsible for the privacy practices of these third parties. We encourage you
              to review their privacy policies.
            </p>
          </section>

          <section className="mt-8">
            <h2>10. Children's Privacy</h2>
            <p>
              The Service is not intended for users under 18 years of age. We do not knowingly
              collect information from children. If we learn we have collected information from
              a child, we will delete it promptly.
            </p>
          </section>

          <section className="mt-8">
            <h2>11. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than
              your own, including the United States. These countries may have different data
              protection laws. By using the Service, you consent to such transfers.
            </p>
          </section>

          <section className="mt-8">
            <h2>12. California Privacy Rights (CCPA)</h2>
            <p>
              If you are a California resident, you have additional rights under the California
              Consumer Privacy Act (CCPA):
            </p>
            <ul>
              <li>Right to know what personal information we collect and how it's used</li>
              <li>Right to delete your personal information</li>
              <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
              <li>Right to non-discrimination for exercising your privacy rights</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2>13. European Privacy Rights (GDPR)</h2>
            <p>
              If you are in the European Economic Area (EEA), you have rights under the General
              Data Protection Regulation (GDPR), including:
            </p>
            <ul>
              <li>Right to access, rectify, or erase your personal data</li>
              <li>Right to restrict or object to processing</li>
              <li>Right to data portability</li>
              <li>Right to withdraw consent</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>
            <p>
              Our legal basis for processing includes: contract performance, legitimate interests,
              and your consent.
            </p>
          </section>

          <section className="mt-8">
            <h2>14. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of
              material changes by email or through the Service. Your continued use after
              changes become effective constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mt-8">
            <h2>15. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our data practices,
              please contact us at:
            </p>
            <ul>
              <li>Email: {companyEmail}</li>
              <li>Website: {websiteUrl}</li>
            </ul>
          </section>

          <section className="mt-8 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              By using {companyName}, you acknowledge that you have read and understood this
              Privacy Policy.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}

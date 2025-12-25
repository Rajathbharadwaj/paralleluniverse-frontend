"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
  const lastUpdated = "December 23, 2024";
  const companyName = "Parallel Universe";
  const companyEmail = "support@paralleluniverse.ai";
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
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>

          <section className="mt-8">
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using {companyName} ("Service", "Platform", "we", "us", or "our"),
              you agree to be bound by these Terms of Service ("Terms"). If you disagree with
              any part of these terms, you do not have permission to access the Service.
            </p>
            <p>
              These Terms apply to all visitors, users, and others who access or use the Service.
              By using the Service, you represent that you are at least 18 years of age and have
              the legal capacity to enter into these Terms.
            </p>
          </section>

          <section className="mt-8">
            <h2>2. Description of Service</h2>
            <p>
              {companyName} is an AI-powered social media growth and automation platform.
              Our Service provides:
            </p>
            <ul>
              <li>AI-assisted content generation and scheduling</li>
              <li>Automated engagement features (likes, comments, follows, reposts)</li>
              <li>Analytics and growth tracking</li>
              <li>Content calendar management</li>
              <li>Competitor analysis tools</li>
              <li>Advertising campaign management (for eligible plans)</li>
            </ul>
            <p>
              The Service operates by connecting to your social media accounts through browser
              session authentication. You authorize our AI agents to perform actions on your
              behalf within the parameters you configure.
            </p>
          </section>

          <section className="mt-8">
            <h2>3. User Accounts and Authentication</h2>
            <h3>3.1 Account Creation</h3>
            <p>
              To use the Service, you must create an account and provide accurate, complete
              information. You are responsible for maintaining the confidentiality of your
              account credentials and for all activities under your account.
            </p>

            <h3>3.2 Social Media Authentication</h3>
            <p>
              Our Service connects to your social media accounts using browser session
              authentication via our Chrome extension. By using this feature, you:
            </p>
            <ul>
              <li>Authorize {companyName} to access and perform actions on your connected social media accounts</li>
              <li>Acknowledge that we use session cookies to authenticate actions on your behalf</li>
              <li>Understand that we do NOT store your social media passwords</li>
              <li>Can revoke access at any time by disconnecting your account</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2>4. User Responsibilities and Acceptable Use</h2>
            <h3>4.1 Compliance with Third-Party Terms</h3>
            <p className="font-semibold bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
              IMPORTANT: You are solely responsible for ensuring your use of our Service complies
              with the terms of service of any third-party platforms you connect, including but
              not limited to X (Twitter), Meta, LinkedIn, and others. Automated engagement may
              violate certain platform policies.
            </p>

            <h3>4.2 Prohibited Activities</h3>
            <p>You agree NOT to use the Service to:</p>
            <ul>
              <li>Engage in spam, harassment, or abusive behavior</li>
              <li>Spread misinformation, hate speech, or illegal content</li>
              <li>Impersonate other individuals or entities</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Attempt to gain unauthorized access to any systems</li>
              <li>Use the Service for any fraudulent or deceptive purposes</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>

            <h3>4.3 Content Responsibility</h3>
            <p>
              You are solely responsible for all content generated, posted, or engaged with
              through the Service. While our AI assists in content creation, you must review
              and approve content before it is published (unless you enable auto-posting features).
            </p>
          </section>

          <section className="mt-8">
            <h2>5. Assumption of Risk</h2>
            <p className="font-semibold bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
              BY USING THIS SERVICE, YOU ACKNOWLEDGE AND ACCEPT THE FOLLOWING RISKS:
            </p>
            <ul>
              <li>
                <strong>Platform Policy Violations:</strong> Automated engagement on social media
                platforms may violate those platforms' terms of service. This could result in
                warnings, restrictions, suspension, or permanent termination of your social
                media accounts.
              </li>
              <li>
                <strong>Account Actions:</strong> {companyName} is not responsible for any actions
                taken by third-party platforms against your accounts, including but not limited
                to shadowbanning, rate limiting, suspension, or termination.
              </li>
              <li>
                <strong>Engagement Results:</strong> Growth and engagement results vary based on
                numerous factors including your content quality, niche, timing, and platform
                algorithms. We do not guarantee any specific results.
              </li>
              <li>
                <strong>AI-Generated Content:</strong> AI-generated content may occasionally
                produce unexpected or inappropriate results. You are responsible for reviewing
                content before publication.
              </li>
            </ul>
            <p>
              You expressly agree that your use of the Service is at your sole risk. You accept
              full responsibility for any consequences to your social media accounts arising
              from the use of automated features.
            </p>
          </section>

          <section className="mt-8">
            <h2>6. Subscription and Payments</h2>
            <h3>6.1 Pricing and Plans</h3>
            <p>
              The Service is offered through various subscription plans with different features
              and pricing. Current pricing is available on our website. We reserve the right to
              modify pricing with 30 days notice to existing subscribers.
            </p>

            <h3>6.2 Billing</h3>
            <p>
              Subscriptions are billed in advance on a monthly basis. Payment is processed
              through Stripe. By subscribing, you authorize us to charge your payment method
              on a recurring basis until you cancel.
            </p>

            <h3>6.3 Refund Policy</h3>
            <p>
              We offer a <strong>30-day money-back guarantee</strong> for new subscribers.
              If you are not satisfied with the Service within the first 30 days of your
              initial subscription, contact us at {companyEmail} for a full refund.
              After 30 days, subscription fees are non-refundable.
            </p>

            <h3>6.4 Cancellation</h3>
            <p>
              You may cancel your subscription at any time through your account settings or
              by contacting support. Upon cancellation, you will retain access until the end
              of your current billing period.
            </p>
          </section>

          <section className="mt-8">
            <h2>7. Credits and Usage</h2>
            <p>
              Certain features of the Service operate on a credit-based system. Credits are
              allocated monthly based on your subscription plan and do not roll over to
              subsequent months. Additional credits may be purchased separately.
            </p>
          </section>

          <section className="mt-8">
            <h2>8. Intellectual Property</h2>
            <h3>8.1 Our Property</h3>
            <p>
              The Service, including its original content, features, and functionality, is
              owned by {companyName} and is protected by international copyright, trademark,
              and other intellectual property laws.
            </p>

            <h3>8.2 Your Content</h3>
            <p>
              You retain ownership of content you create using the Service. By using the
              Service, you grant us a limited license to process, store, and display your
              content as necessary to provide the Service.
            </p>
          </section>

          <section className="mt-8">
            <h2>9. Limitation of Liability</h2>
            <p className="font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul>
              <li>
                {companyName}, its officers, directors, employees, and agents shall not be
                liable for any indirect, incidental, special, consequential, or punitive
                damages arising from your use of the Service.
              </li>
              <li>
                We are not liable for any loss of followers, engagement, revenue, data, or
                other intangible losses resulting from your use of the Service.
              </li>
              <li>
                We are not liable for any actions taken by third-party platforms against
                your accounts.
              </li>
              <li>
                Our total liability for any claims arising from the Service shall not exceed
                the amount you paid to us in the 12 months preceding the claim.
              </li>
            </ul>
          </section>

          <section className="mt-8">
            <h2>10. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY
              KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES
              OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              We do not warrant that the Service will be uninterrupted, secure, or error-free,
              or that any defects will be corrected. We do not guarantee any specific results
              from using the Service.
            </p>
          </section>

          <section className="mt-8">
            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless {companyName} and its officers,
              directors, employees, and agents from any claims, damages, losses, liabilities,
              and expenses (including legal fees) arising from:
            </p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights or platform policies</li>
              <li>Any content you create, post, or engage with through the Service</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2>12. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately,
              without prior notice, for any reason, including breach of these Terms. Upon
              termination, your right to use the Service will immediately cease.
            </p>
            <p>
              You may terminate your account at any time by discontinuing use of the Service
              and canceling your subscription.
            </p>
          </section>

          <section className="mt-8">
            <h2>13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of
              material changes by email or through the Service. Your continued use of the
              Service after changes become effective constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="mt-8">
            <h2>14. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of
              the State of Delaware, United States, without regard to its conflict of law
              provisions. Any disputes arising from these Terms shall be resolved in the
              courts of Delaware.
            </p>
          </section>

          <section className="mt-8">
            <h2>15. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that
              provision shall be limited or eliminated to the minimum extent necessary, and
              the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section className="mt-8">
            <h2>16. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <ul>
              <li>Email: {companyEmail}</li>
              <li>Website: {websiteUrl}</li>
            </ul>
          </section>

          <section className="mt-8 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              By using {companyName}, you acknowledge that you have read, understood, and
              agree to be bound by these Terms of Service.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}

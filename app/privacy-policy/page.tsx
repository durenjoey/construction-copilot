import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Construction Copilot",
  description: "Privacy Policy for Construction Copilot",
};

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl prose prose-slate">
      <h1 className="text-3xl font-bold mb-8">Privacy Statement</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Version 1.0 | Effective Date: November 4, 2024
      </p>

      <div className="space-y-6">
        <p>
          This Privacy Statement explains how Personal Information about our
          users is collected, used, and disclosed by Weigh Anchor LLC (&quot;us&quot;,
          &quot;we&quot;, &quot;our&quot; or &quot;Company&quot;). This Privacy Statement describes our
          privacy practices for the Construction Copilot platform (&quot;Services&quot;),
          including our website, scope creation tools, proposal review
          capabilities, lessons learned repository, and any associated Project
          Management Information System (PMIS) features.
        </p>

        <p>
          By using our Services and agreeing to our Terms of Service, you agree
          to the collection, usage, storage, and disclosure of information
          described in this Privacy Statement.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            1. Personal Information Collection &amp; Use
          </h2>
          <p>We only collect and use your personal information to:</p>
          <ul className="list-disc pl-6">
            <li>Provide you with the Construction Copilot Services</li>
            <li>Communicate with you about the Services</li>
            <li>Improve our Services through voluntary user feedback</li>
            <li>Maintain security and functionality of the platform</li>
          </ul>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">1.1 Information You Provide</h3>
            <p>We collect basic user information when you create an account, including:</p>
            <ul className="list-disc pl-6">
              <li>Name</li>
              <li>Email address</li>
              <li>Professional role/category</li>
              <li>Any additional information you choose to provide</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">1.2 Information We Collect Automatically</h3>
            <p>When you use our Services, we automatically collect:</p>
            <ul className="list-disc pl-6">
              <li>Log information (access times, pages viewed, IP address)</li>
              <li>Usage analytics</li>
              <li>Authentication data</li>
              <li>Technical data necessary for platform functionality</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">1.3 Cookies</h3>
            <p>
              We use the minimum necessary cookies required for security and
              essential platform functionality. You can configure your browser
              to refuse cookies, but this may limit your ability to use certain
              features of our Services.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Data Security &amp; Protection</h2>
          <p>2.1 We implement comprehensive security measures including:</p>
          <ul className="list-disc pl-6">
            <li>
              Double encryption:
              <ul className="list-disc pl-6">
                <li>Primary encryption within our application</li>
                <li>Secondary encryption through third-party API providers</li>
              </ul>
            </li>
            <li>Strict internal access controls</li>
            <li>Regular security audits</li>
            <li>Limited backend access on a need-to-know basis</li>
          </ul>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">2.2 Data Retention</h3>
            <ul className="list-disc pl-6">
              <li>Standard data retention period is 3 years</li>
              <li>Users may request data deletion at any time</li>
              <li>Some data may be retained longer if required by law</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Third-Party Services</h2>
          <p>We utilize select third-party services for:</p>
          <ul className="list-disc pl-6">
            <li>Database management</li>
            <li>Authentication</li>
            <li>AI processing</li>
            <li>Development and deployment</li>
            <li>Domain management</li>
          </ul>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">3.1 Current Providers</h3>
            <p>
              Current providers include Firebase, OAuth, Anthropic, Stackblitz,
              GitHub, Vercel, and Namecheap. We may change service providers as
              needed for operational efficiency.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">3.2 AI Processing</h3>
            <ul className="list-disc pl-6">
              <li>Data processed by AI models maintains appropriate encryption</li>
              <li>Third-party AI providers may have their own Terms of Service</li>
              <li>
                We maintain transparency about any changes in AI provider data
                handling
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Data Usage &amp; Sharing</h2>
          <ul className="list-disc pl-6">
            <li>We do not sell user data</li>
            <li>We do not share data with unauthorized third parties</li>
            <li>We do not use data without consent for purposes other than providing and improving our Services</li>
          </ul>
          <p>We may share data:</p>
          <ul className="list-disc pl-6">
            <li>With authorized third-party service providers</li>
            <li>If required by law</li>
            <li>To protect our legal rights</li>
            <li>In connection with a business transfer or acquisition</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. User Rights &amp; Control</h2>
          <ul className="list-disc pl-6">
            <li>Access your personal information</li>
            <li>Request corrections to your data</li>
            <li>Request deletion of your data</li>
            <li>Opt out of non-essential data collection</li>
            <li>Receive an export of your data</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. Updates to Privacy Statement</h2>
          <ul className="list-disc pl-6">
            <li>Updates will be posted on our website</li>
            <li>Users will be notified through our Services</li>
            <li>Updates become effective upon posting</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">7. Contact Information</h2>
          <p>
            For questions about this Privacy Statement, contact:
            <strong> info@weighanchor.com</strong>
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">8. Governing Law</h2>
          <p>
            This Privacy Statement is governed by the laws of Washington State,
            United States.
          </p>
        </section>

        <p className="text-sm text-muted-foreground">
          Last updated: November 4, 2024
        </p>
      </div>
    </div>
  );
}
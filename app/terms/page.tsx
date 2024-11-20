import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Construction Copilot",
  description: "Terms of Service for Construction Copilot",
};

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl prose prose-slate">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Version 1.0 | Effective Date: November 4, 2024
      </p>

      <p className="mb-6">
        This Construction Copilot Terms of Service Agreement ("Agreement") is
        entered into by and between Weigh Anchor LLC ("Company," "we," "us," or
        "our") and the entity or person ("User," "you," "your") accessing or
        using the Construction Copilot services ("Services").
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Definitions</h2>
        <p className="mb-4">
          1.1 "Authority Having Jurisdiction" or "AHJ" means the organization,
          office, or individual responsible for enforcing the requirements of a
          code or standard, or for approving equipment, materials, an
          installation, or a procedure.
        </p>
        <p className="mb-4">
          1.2 "Services" means the Construction Copilot platform, including
          scope creation tools, proposal review capabilities, lessons learned
          repository, and any associated Project Management Information System
          (PMIS) features.
        </p>
        <p className="mb-4">
          1.3 "Content" means any information, data, text, documents,
          specifications, plans, drawings, designs, or other materials uploaded
          to, generated by, or accessed through the Services.
        </p>
        <p className="mb-4">
          1.4 "Professional User" means any architect, engineer, contractor,
          project manager, or other construction professional using the
          Services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Service Description and Role</h2>
        <p className="mb-4">
          2.1 <span className="font-semibold">Assistance Tool Only.</span>{" "}
          Construction Copilot is an AI-powered assistance tool designed to
          augment and expedite construction documentation and project
          management processes. The Services do not replace professional
          judgment, experience, or expertise.
        </p>
        <p className="mb-4">
          2.2 <span className="font-semibold">No Professional Advice.</span>{" "}
          The Services do not provide professional architectural, engineering,
          construction, or legal advice. Any content generated through the
          Services requires professional review and validation before use.
        </p>
        <p className="mb-4">
          2.3 <span className="font-semibold">User Responsibility.</span> Users
          retain full responsibility for:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Reviewing and validating all generated content</li>
          <li>Ensuring compliance with applicable codes, standards, and regulations</li>
          <li>Obtaining necessary approvals from relevant AHJs</li>
          <li>Professional licenses and certifications</li>
          <li>Final deliverable accuracy and completeness</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Subscriptions and Access</h2>
        <p className="mb-4">
          3.1 <span className="font-semibold">Service Tiers.</span>
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Free Viewing Tier: Limited to viewing capabilities</li>
          <li>
            Standard Subscription ($19.99/month): Full access to current scope
            creation and review features
          </li>
          <li>
            Enterprise Solutions: Custom solutions for full PMIS implementation
            (when available)
          </li>
        </ul>
        <p className="mb-4">
          3.2 <span className="font-semibold">Account Requirements.</span>{" "}
          Users must:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Provide accurate registration information</li>
          <li>Maintain account security</li>
          <li>Be at least 18 years old</li>
          <li>
            Have authority to accept these terms on behalf of their organization
            (if applicable)
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Data Privacy and Security</h2>
        <p className="mb-4">
          4.1 <span className="font-semibold">Data Protection.</span> We
          implement double encryption:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Primary encryption within our application</li>
          <li>Secondary encryption through third-party API providers</li>
        </ul>
        <p className="mb-4">
          4.2 <span className="font-semibold">No Data Selling.</span> We do not
          sell, trade, or rent user data to third parties. Our subscription
          model exists specifically to avoid data monetization.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. User Content and Feedback</h2>
        <p className="mb-4">
          5.1 <span className="font-semibold">Content Ownership.</span> Users
          retain all rights to their uploaded Content.
        </p>
        <p className="mb-4">
          5.2 <span className="font-semibold">Feedback.</span> Users may provide
          voluntary feedback for service improvement. Any provided feedback
          becomes our property and may be used to enhance the Services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Professional Responsibility and Liability</h2>
        <p className="mb-4">
          6.1 <span className="font-semibold">Professional Oversight.</span> All
          deliverables produced using the Services must be reviewed and approved
          by appropriate professional personnel.
        </p>
        <p className="mb-4">
          6.2 <span className="font-semibold">Liability Limitations.</span> We
          are not responsible for construction errors or omissions or
          professional liability claims.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Disclaimers and Warranties</h2>
        <p className="mb-4">
          7.1 <span className="font-semibold">Service Warranty.</span> Services
          are provided "as is" without warranty of any kind.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        Last updated: November 4, 2024
      </p>
    </div>
  );
}
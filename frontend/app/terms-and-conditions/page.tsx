import { LegalPage } from "@/components/legal/legal-page";
import { legalEntity, brand } from "@/lib/content";

export const metadata = {
  title: "Terms & Conditions",
  description: `The terms and conditions governing your use of ${brand.name}.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      updated="19 July 2026"
      intro={
        <p>
          These Terms & Conditions govern your access to and use of rubyzensemble.in, operated by {legalEntity.legalName}
          {" "}(&ldquo;{brand.name}&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By browsing the site, creating an
          account, or placing an order, you agree to be bound by these terms. Please read them carefully.
        </p>
      }
      sections={[
        {
          heading: "1. Eligibility",
          body: (
            <p>
              You must be at least 18 years old to create an account or place an order on your own behalf. Minors
              may use the site only under the supervision of a parent or legal guardian.
            </p>
          ),
        },
        {
          heading: "2. Products, pricing and availability",
          body: (
            <ul className="list-disc space-y-1 pl-5">
              <li>All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.</li>
              <li>Product images are for illustration; actual colour and finish may vary slightly due to photography, screen settings, or the handmade/tailored nature of some pieces.</li>
              <li>We reserve the right to correct pricing or listing errors, limit order quantities, and modify or discontinue any product at any time.</li>
              <li>Stock is subject to availability and is not reserved until an order is confirmed and paid for.</li>
            </ul>
          ),
        },
        {
          heading: "3. Orders and acceptance",
          body: (
            <p>
              Placing an order is an offer to purchase, which we may accept or decline (for example, in cases of
              pricing errors, suspected fraud, or unavailability of stock). An order is confirmed only once payment
              has been successfully processed and you receive confirmation from us.
            </p>
          ),
        },
        {
          heading: "4. Payments",
          body: (
            <p>
              Payments are processed securely through Razorpay. We do not store your card, UPI, or net-banking
              details — these are handled directly by Razorpay under its own security standards and terms. In the
              event a payment is deducted but an order is not confirmed, please contact us with your transaction
              reference so we can assist.
            </p>
          ),
        },
        {
          heading: "5. Shipping, cancellations and refunds",
          body: (
            <p>
              Delivery is handled through our shipping partner, Shiprocket, and its courier network. Details on
              delivery timelines, cancellations, returns and refunds are set out in our{" "}
              <a href="/shipping-policy" className="underline">Shipping Policy</a> and{" "}
              <a href="/refund-policy" className="underline">Cancellation & Refund Policy</a>, which form part of
              these Terms.
            </p>
          ),
        },
        {
          heading: "6. Tailoring and custom orders",
          body: (
            <p>
              Custom stitching, alteration and tailoring requests are made to the measurements and preferences you
              provide. Please double-check measurements before confirming — custom-tailored items cannot be
              cancelled or returned once production has begun, except where the finished item is materially
              defective or does not match the agreed specification.
            </p>
          ),
        },
        {
          heading: "7. Your account",
          body: (
            <p>
              You&apos;re responsible for maintaining the confidentiality of your login credentials and for all
              activity under your account. Let us know immediately if you suspect unauthorised use.
            </p>
          ),
        },
        {
          heading: "8. Intellectual property",
          body: (
            <p>
              All content on this site — including product photography, text, logos and design — belongs to{" "}
              {brand.name} or its licensors and may not be copied, reproduced or used commercially without written
              permission.
            </p>
          ),
        },
        {
          heading: "9. Limitation of liability",
          body: (
            <p>
              To the extent permitted by law, {brand.name} is not liable for indirect, incidental, or consequential
              damages arising from your use of the site or products purchased, including delays or issues caused by
              third-party payment or courier partners.
            </p>
          ),
        },
        {
          heading: "10. Governing law",
          body: (
            <p>
              These Terms are governed by the laws of India, and any disputes will be subject to the exclusive
              jurisdiction of the courts of Bhubaneswar, Odisha.
            </p>
          ),
        },
        {
          heading: "11. Changes to these terms",
          body: (
            <p>
              We may update these Terms from time to time; continued use of the site after changes are posted
              constitutes acceptance of the revised Terms.
            </p>
          ),
        },
        {
          heading: "12. Contact us",
          body: (
            <p>
              Questions about these Terms can be sent to{" "}
              <a href={`mailto:${legalEntity.email}`} className="underline">{legalEntity.email}</a> or{" "}
              {legalEntity.phone}.
            </p>
          ),
        },
      ]}
    />
  );
}

import { LegalPage } from "@/components/legal/legal-page";
import { legalEntity, brand } from "@/lib/content";

export const metadata = {
  title: "Cancellation & Refund Policy",
  description: `Cancellation, return and refund terms for orders placed with ${brand.name}.`,
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cancellation & Refund Policy"
      updated="24 July 2026"
      intro={
        <p>
          This policy explains how cancellations, returns, exchanges and refunds work for orders placed with{" "}
          {brand.name}. Please read it carefully before confirming your order.
        </p>
      }
      sections={[
        {
          heading: "1. Before your order is confirmed and paid for",
          body: (
            <p>
              You may cancel or change your order free of charge at any point before it has been confirmed by us on
              WhatsApp and paid for, simply by messaging us on the same WhatsApp chat used to place the order, or by
              contacting us at {legalEntity.phone}. No charge applies at this stage.
            </p>
          ),
        },
        {
          heading: "2. Once your order is confirmed and paid for",
          body: (
            <p>
              Once an order has been confirmed on WhatsApp and payment has been made, it is final. We do not offer
              cancellations, refunds, exchanges, or returns on any order after this point, including ready-to-wear
              and custom-stitched or tailored items. Please review your order — product, size, colour, measurements
              and delivery details — carefully before confirming and making payment.
            </p>
          ),
        },
        {
          heading: "3. Custom and tailored items",
          body: (
            <p>
              Custom-stitched, altered, or made-to-measurement items are prepared specifically to the details you
              provide at the time of order. As with all orders, these cannot be cancelled, refunded, exchanged or
              returned once confirmed and paid for, so please double-check your measurements and preferences before
              confirming.
            </p>
          ),
        },
        {
          heading: "4. Contact us",
          body: (
            <p>
              For any questions about this policy or an order you&apos;ve placed, reach {legalEntity.legalName} at{" "}
              {legalEntity.phone}. Registered address: {legalEntity.address}.
            </p>
          ),
        },
      ]}
    />
  );
}
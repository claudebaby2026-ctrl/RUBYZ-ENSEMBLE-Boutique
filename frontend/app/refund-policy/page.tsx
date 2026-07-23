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
          We want you to love what you order from {brand.name}. This policy explains how cancellations, returns,
          exchanges and refunds work.
        </p>
      }
      sections={[
        {
          heading: "1. Cancelling an order",
          body: (
            <p>
              You may cancel an order free of charge any time before it has been dispatched, by messaging us on the
              same WhatsApp chat used to place the order, or by contacting us at{" "}
              <a href={`mailto:${legalEntity.email}`} className="underline">{legalEntity.email}</a> or{" "}
              {legalEntity.phone} with your order details. Once an order has been dispatched, it can no longer be
              cancelled — but you may be eligible to return it after delivery, per the terms below.
            </p>
          ),
        },
        {
          heading: "2. Custom and tailored items",
          body: (
            <p>
              Items that are custom-stitched, altered, or made to your specific measurements cannot be cancelled
              once production has begun, and are not eligible for return or exchange for reasons of size or personal
              preference. If a custom item arrives defective or does not match the agreed specification, please see
              section 4 below.
            </p>
          ),
        },
        {
          heading: "3. Returns and exchanges",
          body: (
            <>
              <p>For ready-to-wear (non-tailored) items, you may request a return or exchange within 3 days of delivery, provided:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>The item is unused, unwashed, and in its original condition with all tags attached</li>
                <li>The item is returned in its original packaging</li>
                <li>The request is not for a category excluded below</li>
              </ul>
              <p>
                Innerwear, customised/tailored pieces, and items marked &ldquo;final sale&rdquo; at the time of
                purchase are not eligible for return, for hygiene and customisation reasons.
              </p>
            </>
          ),
        },
        {
          heading: "4. Damaged, defective or incorrect items",
          body: (
            <p>
              If you receive an item that is damaged, defective, or different from what you ordered, contact us
              within 48 hours of delivery with your order ID and photos of the item. We&apos;ll arrange a
              replacement or a full refund at no extra cost to you, once the issue is verified.
            </p>
          ),
        },
        {
          heading: "5. How to initiate a return",
          body: (
            <p>
              Write to{" "}
              <a href={`mailto:${legalEntity.email}`} className="underline">{legalEntity.email}</a> or message us at{" "}
              {legalEntity.phone} with your order ID and reason for return. Once approved, we&apos;ll arrange pickup
              through our courier partner or share drop-off instructions.
            </p>
          ),
        },
        {
          heading: "6. Refund timelines",
          body: (
            <p>
              Once a returned item is received and inspected (typically within 2–3 business days), approved refunds
              are processed within 5–7 business days. Since payment is arranged directly with us over WhatsApp/phone
              rather than through an online payment gateway, refunds are made via UPI or bank transfer to an account
              you provide, or reversed by the same method you originally paid with, wherever that&apos;s possible.
              Delivery charges are non-refundable unless the return is due to our error or a defective item.
            </p>
          ),
        },
        {
          heading: "7. Exchanges",
          body: (
            <p>
              If you&apos;d prefer a different size or colour (where available) instead of a refund, let us know
              when you initiate the return and we&apos;ll process an exchange subject to stock availability.
            </p>
          ),
        },
        {
          heading: "8. Contact us",
          body: (
            <p>
              For any cancellation, return or refund query, reach {legalEntity.legalName} at{" "}
              <a href={`mailto:${legalEntity.email}`} className="underline">{legalEntity.email}</a> or{" "}
              {legalEntity.phone}. Registered address: {legalEntity.address}.
            </p>
          ),
        },
      ]}
    />
  );
}
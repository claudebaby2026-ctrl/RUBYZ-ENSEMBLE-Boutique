import { LegalPage } from "@/components/legal/legal-page";
import { legalEntity, brand } from "@/lib/content";

export const metadata = {
  title: "Shipping Policy",
  description: `Delivery timelines, charges and coverage for ${brand.name} orders.`,
};

export default function ShippingPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Shipping Policy"
      updated="24 July 2026"
      intro={
        <p>
          This policy explains how we process, pack and ship your order from {brand.name}. It applies to every
          order placed on rubyzensemble.in.
        </p>
      }
      sections={[
        {
          heading: "1. Order processing time",
          body: (
            <p>
              Orders are placed via WhatsApp from our checkout page and are confirmed once we reply confirming
              stock, final amount and delivery details. Ready-to-ship items are typically packed and handed over to
              our courier partner within 1–2 business days of that confirmation. Items that involve custom tailoring
              or alterations may take longer — the expected timeline will be shared with you at the time of order.
            </p>
          ),
        },
        {
          heading: "2. Shipping partner",
          body: (
            <p>
              We do not use a fixed courier integration. The shipping partner and mode of delivery are agreed upon
              directly with you over WhatsApp at the time your order is placed, based on what works best for your
              location and the item ordered.
            </p>
          ),
        },
        {
          heading: "3. Delivery timelines",
          body: (
            <>
              <p>
                Once shipped, orders are typically delivered within <strong>2–7 business days</strong>, depending on
                your location and the courier/mode agreed upon at the time of order.
              </p>
              <p>
                This is a standard estimate, not a guarantee. Deliveries may take longer in special cases — for
                example during sale periods, festive seasons, extreme weather, courier disruptions, custom tailoring
                timelines, or for remote/non-serviceable pincodes — and we&apos;ll keep you informed over WhatsApp if
                that happens.
              </p>
            </>
          ),
        },
        {
          heading: "4. Shipping charges",
          body: (
            <p>
              A flat shipping charge of ₹100 per suit applies at checkout for home delivery. In-store pickup, where
              offered, is free of charge. Any promotional free-shipping offers will be clearly indicated at checkout.
            </p>
          ),
        },
        {
          heading: "5. Areas we ship to",
          body: (
            <p>
              We currently ship across India wherever our courier partners provide serviceability. International
              shipping is not offered through the website at this time — for special requests, please contact us
              directly.
            </p>
          ),
        },
        {
          heading: "6. Order tracking",
          body: (
            <p>
              Since deliveries are arranged directly rather than through a single integrated courier system, please
              contact us on WhatsApp for updates on your order&apos;s dispatch and delivery status at any time.
            </p>
          ),
        },
        {
          heading: "7. Damaged, lost or delayed shipments",
          body: (
            <p>
              If your order arrives damaged, is missing items, or seems significantly delayed, please contact us
              within 48 hours of delivery (or the expected delivery date) with your order ID and photos where
              relevant, and we&apos;ll work with our courier partner to resolve it.
            </p>
          ),
        },
        {
          heading: "8. Contact us",
          body: (
            <p>
              For shipping questions, reach us at{" "}
              {legalEntity.phone}.
            </p>
          ),
        },
      ]}
    />
  );
}
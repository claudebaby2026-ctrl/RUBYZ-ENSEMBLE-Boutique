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
              Deliveries are fulfilled through Shiprocket&apos;s courier network, which we use to reach locations
              across India reliably and to provide real-time tracking.
            </p>
          ),
        },
        {
          heading: "3. Delivery timelines",
          body: (
            <>
              <p>Once shipped, estimated delivery times are:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Metro cities: 3–6 business days</li>
                <li>Rest of India: 5–9 business days</li>
              </ul>
              <p>
                These are estimates, not guarantees. Deliveries may take longer during sale periods, festive
                seasons, extreme weather, courier disruptions, or for remote/non-serviceable pincodes, where an
                alternate delivery arrangement will be offered.
              </p>
            </>
          ),
        },
        {
          heading: "4. Shipping charges",
          body: (
            <p>
              A flat delivery fee of ₹150 applies at checkout for home delivery. In-store pickup, where offered, is
              free of charge. Any promotional free-shipping offers will be clearly indicated at checkout.
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
              Once your order is dispatched, you&apos;ll receive a tracking link via email, SMS, or WhatsApp so you
              can follow its progress until delivery.
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
              <a href={`mailto:${legalEntity.email}`} className="underline">{legalEntity.email}</a> or{" "}
              {legalEntity.phone}.
            </p>
          ),
        },
      ]}
    />
  );
}
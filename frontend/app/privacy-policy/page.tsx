import { LegalPage } from "@/components/legal/legal-page";
import { legalEntity, brand } from "@/lib/content";

export const metadata = {
  title: "Privacy Policy",
  description: `How ${brand.name} collects, uses and protects your personal information.`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="24 July 2026"
      intro={
        <p>
          {legalEntity.legalName} (&ldquo;{brand.name}&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your
          privacy. This policy explains what information we collect when you browse or shop with us at{" "}
          rubyzensemble.in, why we collect it, and the choices you have. By using this website, you agree to the
          practices described here.
        </p>
      }
      sections={[
        {
          heading: "1. Information we collect",
          body: (
            <>
              <p>We collect information you give us directly, such as when you create an account, place an order, or contact us:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Name, email address and phone number</li>
                <li>Delivery and billing address</li>
                <li>Order history and items you&apos;ve liked or added to your wishlist</li>
                <li>Any measurements or preferences you share with us for tailoring requests</li>
                <li>
                  Order details you send us on WhatsApp to place an order — the items, sizes and quantities in your
                  cart, your name, phone number and delivery address, and any coupon applied — which are pre-filled
                  into a message from our checkout page for you to review and send
                </li>
                <li>Messages you send us via the contact form, email, phone or WhatsApp</li>
              </ul>
              <p>
                We also automatically collect limited technical information (such as browser type, device type and
                pages visited) to help us keep the site secure and improve the shopping experience.
              </p>
            </>
          ),
        },
        {
          heading: "2. How we use your information",
          body: (
            <ul className="list-disc space-y-1 pl-5">
              <li>To process, fulfil and deliver your orders</li>
              <li>To create and manage your account, wishlist and order history</li>
              <li>To communicate with you about orders, tailoring requests, and customer support</li>
              <li>To send offers or updates, only where you&apos;ve opted in — you can unsubscribe at any time</li>
              <li>To detect, prevent and address fraud, abuse or technical issues</li>
              <li>To comply with applicable legal and tax obligations</li>
            </ul>
          ),
        },
        {
          heading: "3. Sharing your information",
          body: (
            <>
              <p>We do not sell your personal information. We share it only where necessary to run the business:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <span className="text-[#111111]">Order placement over WhatsApp</span> — when you tap &ldquo;Place
                  order on WhatsApp&rdquo; at checkout, your name, phone number, delivery address and order summary
                  are sent as a WhatsApp message to our business number. That message is transmitted and stored by
                  WhatsApp/Meta in accordance with{" "}
                  <a
                    href="https://www.whatsapp.com/legal/privacy-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    WhatsApp&apos;s Privacy Policy
                  </a>
                  . We do not collect or process any card, UPI or net-banking credentials through this website — we
                  do not use a payment gateway, and payment is arranged directly with us over WhatsApp/phone after
                  your order is confirmed.
                </li>
                <li>
                  <span className="text-[#111111]">Shipping and logistics</span> — your name, phone number and
                  delivery address are shared with Shiprocket and its courier network solely to dispatch and deliver
                  your order and to provide tracking updates.
                </li>
                <li>
                  <span className="text-[#111111]">Service providers</span> — hosting, analytics and communication
                  tools that help us run the storefront, bound by confidentiality obligations.
                </li>
                <li>
                  <span className="text-[#111111]">Legal requirements</span> — where required to comply with law,
                  regulation, or a valid request from a public authority.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "4. Cookies and similar technologies",
          body: (
            <p>
              We use essential cookies/local storage to keep you signed in and to remember your cart between visits.
              These are necessary for the site to function and are not used to track you across other websites.
            </p>
          ),
        },
        {
          heading: "5. Data retention and security",
          body: (
            <p>
              We retain your personal information for as long as your account is active or as needed to fulfil
              orders, resolve disputes, and meet our legal and accounting obligations. We use reasonable technical
              and organisational safeguards to protect your data, though no method of transmission or storage is
              ever completely secure.
            </p>
          ),
        },
        {
          heading: "6. Your rights",
          body: (
            <p>
              You may request access to, correction of, or deletion of your personal information, or withdraw
              consent to marketing communications, by writing to us at{" "}
              <a href={`mailto:${legalEntity.email}`} className="underline">
                {legalEntity.email}
              </a>
              . We&apos;ll respond within a reasonable time.
            </p>
          ),
        },
        {
          heading: "7. Children’s privacy",
          body: <p>Our services are intended for users who are at least 18 years old, or shopping with the involvement of a parent or guardian. We do not knowingly collect personal information from children.</p>,
        },
        {
          heading: "8. Changes to this policy",
          body: (
            <p>
              We may update this Privacy Policy from time to time. Material changes will be reflected by updating
              the &ldquo;Last updated&rdquo; date above.
            </p>
          ),
        },
        {
          heading: "9. Contact us",
          body: (
            <p>
              For any privacy-related questions, write to{" "}
              <a href={`mailto:${legalEntity.email}`} className="underline">
                {legalEntity.email}
              </a>{" "}
              or call {legalEntity.phone}. Registered address: {legalEntity.address}.
            </p>
          ),
        },
      ]}
    />
  );
}
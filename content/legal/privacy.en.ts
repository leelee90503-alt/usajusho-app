import type { LegalDoc } from "./types"

export const privacyEn: LegalDoc = {
  title: `Privacy Policy`,
  effectiveDateLabel: `Effective Date: January 1, 2026`,
  intro: [
    `This Privacy Policy explains how Victoria Tech Innovation ("USAJUSHO," "we," "us," or "our") collects, uses, discloses, and protects personal information when you use our website and Service, and describes the privacy rights available to California residents under the California Consumer Privacy Act, as amended by the California Privacy Rights Act (collectively, "CCPA").`,
  ],
  sections: [
    {
      heading: `1. Personal Information We Collect`,
      blocks: [
        { kind: "p", text: `We collect the following categories of personal information:` },
        { kind: "ul", items: [
          `Identifiers: name, email address, mailing address, phone number, USAJUSHO suite/account number.`,
          `Account Information: login credentials (managed securely by our authentication provider), profile details.`,
          `Commercial Information: purchase-proxy requests, order and quote history, shipment and package details, transaction history.`,
          `Financial Information: payment is processed directly by our payment processor (Square); we do not store your full card number. We retain limited payment metadata (e.g., transaction ID, amount, status).`,
          `Geolocation/Shipping Information: shipping and billing addresses you provide.`,
          `Communications: messages you send us and records of notifications we send you.`,
        ] },
        { kind: "p", text: `We do not knowingly collect sensitive personal information beyond what is described above (e.g., we do not collect government ID numbers, precise geolocation, or biometric data).` },
      ],
    },
    {
      heading: `2. Sources of Personal Information`,
      blocks: [
        { kind: "p", text: `We collect personal information directly from you (account registration, forms, purchase-proxy requests, support messages) and, to a limited extent, from our service providers acting on our behalf (e.g., payment confirmations from Square).` },
      ],
    },
    {
      heading: `3. How We Use Personal Information`,
      blocks: [
        { kind: "p", text: `We use personal information to: provide and operate the Service; process purchase-proxy requests, quotes, and payments; forward and track your packages; communicate with you about your account and orders; provide customer support; detect and prevent fraud; and comply with legal obligations.` },
      ],
    },
    {
      heading: `4. How We Share Personal Information`,
      blocks: [
        { kind: "p", text: `We share personal information only with service providers who process it on our behalf and are contractually restricted from using it for any other purpose:` },
        { kind: "ul", items: [
          `Square (payment processing): processes your payment information to complete transactions.`,
          `Supabase (database hosting and authentication): stores your account and order data and manages secure login.`,
          `Vercel (application hosting): hosts and delivers our website.`,
          `EmailJS (transactional email delivery): sends account and order-related notification emails on our behalf.`,
        ] },
        { kind: "p", text: `We do not sell your personal information, and we do not share it for cross-context behavioral advertising, as those terms are defined under the CCPA. We do not use analytics, advertising, or tracking technologies on this website.` },
        { kind: "p", text: `We may also disclose personal information if required by law, or to protect the rights, property, or safety of USAJUSHO, our users, or others.` },
      ],
    },
    {
      heading: `5. Data Retention`,
      blocks: [
        { kind: "p", text: `We retain personal information for as long as your account is active and as necessary to provide the Service, comply with our legal obligations (e.g., tax and accounting records), resolve disputes, and enforce our agreements. Purchase-proxy transaction records are generally retained for 7 years after order completion for accounting and dispute-resolution purposes.` },
      ],
    },
    {
      heading: `6. Your California Privacy Rights`,
      blocks: [
        { kind: "p", text: `If you are a California resident, you have the right to:` },
        { kind: "ul", items: [
          `Know: request the categories and specific pieces of personal information we have collected, used, and disclosed about you.`,
          `Delete: request deletion of your personal information, subject to certain legal exceptions (e.g., completing a transaction, legal compliance).`,
          `Correct: request correction of inaccurate personal information.`,
          `Opt-Out of Sale/Sharing: as noted above, we do not sell or share personal information, so no opt-out is currently necessary; if this changes, we will provide an opt-out mechanism at that time.`,
          `Limit Use of Sensitive Personal Information: we do not use sensitive personal information beyond what is necessary to provide the Service.`,
          `Non-Discrimination: we will not discriminate against you for exercising any of these rights.`,
        ] },
        { kind: "p", text: `To exercise these rights, contact us at info@usajusho.com. We may need to verify your identity before completing your request. We will respond within 45 days, as required by the CCPA (extendable by an additional 45 days when reasonably necessary, with notice to you).` },
        { kind: "p", text: `You may also designate an authorized agent to submit a request on your behalf, subject to our ability to verify the agent's authority.` },
      ],
    },
    {
      heading: `7. Cookies`,
      blocks: [
        { kind: "p", text: `We use only strictly necessary cookies required for authentication and to keep you signed in (set by our authentication provider). We do not use advertising or analytics cookies.` },
      ],
    },
    {
      heading: `8. Children's Privacy`,
      blocks: [
        { kind: "p", text: `The Service is not directed to children under 16, and we do not knowingly collect personal information from children under 16.` },
      ],
    },
    {
      heading: `9. International Data Transfers`,
      blocks: [
        { kind: "p", text: `Because our Service is hosted in the United States, personal information provided by customers outside the United States, including Japan, is processed and stored in the United States. By using the Service, you consent to this transfer.` },
      ],
    },
    {
      heading: `10. Security`,
      blocks: [
        { kind: "p", text: `We use reasonable administrative, technical, and physical safeguards designed to protect personal information. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.` },
      ],
    },
    {
      heading: `11. Changes to This Policy`,
      blocks: [
        { kind: "p", text: `We may update this Privacy Policy from time to time. Material changes will be posted here with a new effective date, and this policy is reviewed and updated at least annually.` },
      ],
    },
    {
      heading: `12. Contact Us`,
      blocks: [
        { kind: "p", text: `For questions about this Privacy Policy or to exercise your privacy rights, contact us at info@usajusho.com.` },
      ],
    },
  ],
}

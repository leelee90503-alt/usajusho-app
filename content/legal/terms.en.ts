import type { LegalDoc } from "./types"

export const termsEn: LegalDoc = {
  title: `Terms of Service`,
  effectiveDateLabel: `Effective Date: January 1, 2026`,
  intro: [
    `Welcome to USAJUSHO ("USAJUSHO," "we," "us," or "our"). These Terms of Service ("Terms") govern your access to and use of the USAJUSHO website, package-forwarding service, and Purchase Proxy (購入代行) service (collectively, the "Service"), operated by Victoria Tech Innovation, a California corporation with its principal place of business at 18533 S. Western Ave., Gardena, CA 90248 ("Company"). By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.`,
  ],
  sections: [
    {
      heading: `1. The Service`,
      blocks: [
        { kind: "p", text: `USAJUSHO provides a US-based package forwarding address and consolidation service, and an optional Purchase Proxy service through which you may ask us to purchase goods on your behalf from US retailers, receive them at our warehouse, and forward them to you internationally.` },
      ],
    },
    {
      heading: `2. Eligibility and Accounts`,
      blocks: [
        { kind: "p", text: `You must be at least 18 years old and capable of forming a binding contract to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree to provide accurate, current information.` },
      ],
    },
    {
      heading: `3. Purchase Proxy Service`,
      blocks: [
        { kind: "p", lead: `3.1 Requests and Quotes.`, text: `You may submit a product description and, optionally, a product URL and budget cap. We will review your request and, if we can fulfill it, send you a quote itemizing the product price and our service fee.` },
        { kind: "p", lead: `3.2 Payment.`, text: `Quotes are valid until their stated expiration. If you accept a quote, you authorize us to charge the full quoted amount via our payment processor. We will not begin purchasing until payment is received.` },
        { kind: "p", lead: `3.3 Price Changes.`, text: `If the retailer's price changes materially between the quote and purchase, we will contact you before completing the purchase. If you do not respond within the time we specify, we may cancel the request and refund your payment.` },
        { kind: "p", lead: `3.4 Cancellations and Refunds.` },
        { kind: "ol-alpha", items: [
          `Before payment: you may cancel at no charge at any time.`,
          `After payment, before we begin purchasing: full refund.`,
          `After we have purchased the item: refunds are not available except where (i) we made an error in the purchase, or (ii) the retailer is unable to fulfill the order.`,
        ] },
        { kind: "p", lead: `3.5 Prohibited Items.`, text: `We may decline any request involving counterfeit goods, items whose import into your destination country is restricted or prohibited, or items that violate applicable law.` },
        { kind: "p", lead: `3.6`, text: `Once purchased and received at our warehouse, items proceed through our standard inspection, consolidation, and international shipping process.` },
      ],
    },
    {
      heading: `4. Fees and Payment`,
      blocks: [
        { kind: "p", text: `All fees are stated in US dollars and processed through our third-party payment processor (Square). Applicable service fees are shown before you confirm any payment. You are responsible for all customs duties, import taxes, and destination-country charges, which are not included in our fees.` },
      ],
    },
    {
      heading: `5. Shipping and Customs`,
      blocks: [
        { kind: "p", text: `You are solely responsible for compliance with the import laws of your destination country, including obtaining any required permits and paying applicable duties and taxes. USAJUSHO is not liable for items seized, delayed, or destroyed by customs authorities.` },
      ],
    },
    {
      heading: `6. Intellectual Property`,
      blocks: [
        { kind: "p", text: `The Service, including its content, design, and trademarks, is owned by or licensed to the Company and is protected by intellectual property laws. You may not copy, modify, or distribute any part of the Service without our written permission.` },
      ],
    },
    {
      heading: `7. Disclaimer of Warranties`,
      blocks: [
        { kind: "p", text: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT PRODUCTS PURCHASED THROUGH THE PURCHASE PROXY SERVICE ARE FREE OF DEFECTS OR THAT THEY WILL MEET YOUR EXPECTATIONS; YOUR RECOURSE FOR A DEFECTIVE PRODUCT IS AGAINST THE ORIGINAL RETAILER OR MANUFACTURER, EXCEPT WHERE WE WERE AT FAULT.` },
      ],
    },
    {
      heading: `8. Limitation of Liability`,
      blocks: [
        { kind: "p", text: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE COMPANY'S TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THE SERVICE WILL NOT EXCEED THE FEES YOU PAID TO US FOR THE TRANSACTION GIVING RISE TO THE CLAIM. WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.` },
      ],
    },
    {
      heading: `9. Indemnification`,
      blocks: [
        { kind: "p", text: `You agree to indemnify and hold the Company harmless from any claims, damages, or expenses arising from your breach of these Terms, your violation of any law, or your submission of a prohibited item request.` },
      ],
    },
    {
      heading: `10. Governing Law and Dispute Resolution`,
      blocks: [
        { kind: "p", text: `These Terms are governed by the laws of the State of California, without regard to conflict-of-laws principles. Subject to applicable consumer-protection law in your jurisdiction, you and the Company agree that any dispute arising from these Terms or the Service will be resolved in the state or federal courts located in Los Angeles County, California, and you consent to the personal jurisdiction of those courts.` },
      ],
    },
    {
      heading: `11. Termination`,
      blocks: [
        { kind: "p", text: `We may suspend or terminate your account at any time for violation of these Terms. You may stop using the Service and close your account at any time.` },
      ],
    },
    {
      heading: `12. Changes to These Terms`,
      blocks: [
        { kind: "p", text: `We may update these Terms from time to time. Material changes will be posted on this page with an updated effective date. Continued use of the Service after changes take effect constitutes acceptance.` },
      ],
    },
    {
      heading: `13. Contact Us`,
      blocks: [
        { kind: "p", text: `Questions about these Terms may be directed to info@usajusho.com.` },
      ],
    },
  ],
}

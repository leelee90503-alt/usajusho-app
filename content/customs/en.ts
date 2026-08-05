import type { CustomsDoc } from "./types"

export const customsEn: CustomsDoc = {
  eyebrow: "Customs Guide",
  title: "Prohibited & Restricted Items for Japan",
  lede:
    "Japanese customs law bans certain items from being imported outright, and caps the quantity of others. If something turns out to be undeliverable after you've already bought it, it can't be returned or resold. Please check this page before you buy.",
  updatedNote: "Last updated: ____-__-__ / Contents are subject to change without notice",
  noticeParagraphs: [
    "If a shipment fails customs clearance, the item will be disposed of or returned at your expense. Disposal and return fees apply separately, and the item's price is not refundable.",
    "If you're unsure about an item, please contact us before you buy it — we'll check whether it can be shipped.",
  ],
  indexHeading: "Quick Reference by Item",
  indexIntro: "Tap an item to jump to its detailed conditions.",
  indexItems: [
    { name: "Wine & alcoholic beverages", note: "Not handled by this service due to air-freight carrier restrictions", status: "stop", statusLabel: "Not shippable", anchor: "alcohol" },
    { name: "Medicine (e.g. Tylenol)", note: "Up to a 2-month supply / some ingredients are not shippable", status: "warn", statusLabel: "Quantity limit", anchor: "medicine" },
    { name: "US multi-symptom cold & allergy medicine", note: "Products containing pseudoephedrine etc. cannot be accepted", status: "stop", statusLabel: "Not shippable", anchor: "medicine" },
    { name: "Vitamins & protein", note: "Up to personal-use amounts (roughly 10kg total)", status: "go", statusLabel: "Shippable", anchor: "supplement" },
    { name: "Melatonin, 5-HTP, DHEA, etc.", note: "Treated as medicine in Japan. Up to a 2-month supply", status: "warn", statusLabel: "Quantity limit", anchor: "supplement" },
    { name: "CBD & hemp products", note: "Not handled by this service — ingredient verification is too burdensome", status: "stop", statusLabel: "Not shippable", anchor: "supplement" },
    { name: "Nicotine e-liquid & pods", note: "Up to 120mL of liquid / 60 pods per month", status: "warn", statusLabel: "Quantity limit", anchor: "vape" },
    { name: "Vape devices (atomizers)", note: "Up to 1 unit (2 if a spare is needed)", status: "warn", statusLabel: "Quantity limit", anchor: "vape" },
    { name: "Cosmetics, shampoo, toothpaste", note: "Up to 24 units per item type", status: "warn", statusLabel: "Quantity limit", anchor: "cosmetics" },
    { name: "Counterfeit branded goods", note: "Seized by customs as intellectual-property-infringing goods", status: "stop", statusLabel: "Not shippable", anchor: "prohibited" },
    { name: "Fresh food, meat, dairy, fruit", note: "Subject to quarantine — cannot be handled", status: "stop", statusLabel: "Not shippable", anchor: "prohibited" },
    { name: "Replica guns, knives, stun guns", note: "Import is banned under Japan's firearms and swords law", status: "stop", statusLabel: "Not shippable", anchor: "prohibited" },
  ],
  taxHeading: "How Duty & Consumption Tax Work",
  taxFreeHeading: "How much can I import duty-free?",
  taxFreeParagraphs: [
    "If the total dutiable value is ¥10,000 or less, duty and consumption tax are generally waived. On top of that, for goods imported for personal use, the dutiable value is calculated at 60% of the overseas retail price.",
    "So as a rule of thumb, purchases up to roughly ¥16,600 stay duty-free. For personal imports, international shipping cost is not included in the dutiable value.",
  ],
  taxOverHeading: "If the value exceeds ¥10,000",
  taxOverParagraphs: [
    "If the dutiable value is ¥200,000 or less, a simplified per-category tariff applies. Most general merchandise falls under \"other goods = 5%\", plus 10% consumption tax on top.",
  ],
  taxTable: {
    caption: "Simplified tariff rates for low-value imports (dutiable value ¥200,000 or less)",
    head: ["Category", "Example items", "Rate"],
    rows: [
      ["2", "Tomato sauce, ice cream, fur products", "20%"],
      ["3", "Coffee, tea (excluding black tea)", "15%"],
      ["4", "Clothing & clothing accessories (excluding knitwear)", "10%"],
      ["5", "Plastic goods, glassware, precious-metal goods, furniture", "3%"],
      ["6", "Rubber goods, paper goods, steel goods, ceramics", "Duty-free"],
      ["7", "Everything else", "5%"],
    ],
  },
  taxDutiedHeading: "Items taxed even under ¥10,000",
  taxDutiedIntro: "Unless the item is a gift to a Japan resident, duty is not waived on the following even under ¥10,000.",
  taxDutiedList: [
    "Leather bags and travel goods",
    "Knitwear",
    "Footwear, ski boots",
    "Pantyhose, tights, gloves",
    "Small personal accessories (excluding precious-metal items)",
  ],
  taxDutiedNote: "Liquor tax and tobacco tax are also not waived under ¥10,000.",
  taxPolicyNotice: {
    label: "Notice — Policy change from April 2028",
    body: [
      "Under Japan's FY2026 tax reform, the special rule that calculates personal-use dutiable value at 60% of retail price will be abolished starting April 1, 2028. At the same time, mail-order imports of ¥10,000 or less will also become subject to consumption tax. This effectively lowers the duty-free threshold — we'll post an updated notice before it takes effect.",
    ],
  },
  prohibitedHeading: "Items That Cannot Be Shipped (Import Bans)",
  prohibitedIntro: "The following are banned from import into Japan under the Customs Act and other laws. We cannot accept these even if you place an order.",
  prohibitedList: [
    "Narcotics, psychotropic drugs, cannabis, opium, stimulants, designated drugs",
    "Handguns, rifles, ammunition and parts for these (including replica guns, spearguns, and swords)",
    "Explosives, gunpowder, and other items with a risk of ignition or combustion",
    "Counterfeit or altered currency, banknotes, securities, or credit cards",
    "Publications and images that harm public morals, and child pornography",
    "Goods that infringe intellectual property rights (counterfeit branded goods, pirated copies)",
    "Items regulated under Japan's Plant Protection Act / Livestock Infectious Disease Prevention Act (fruit, vegetables, meat, dairy, seeds, etc.)",
    "Items covered by CITES (ivory, crocodile/snake leather goods, products containing certain plant-derived ingredients)",
    "Stun guns, pepper spray, and other self-defense devices",
    "Fresh food and anything requiring refrigeration/freezing or prone to spoilage",
  ],
  prohibitedCallout: {
    label: "Please note",
    body: ["Products containing ingredients such as vanilla, agave, or aloe can sometimes fall under CITES. Please check the ingredient label."],
  },
  quantityHeading: "Items With a Quantity Limit",
  quantityIntro:
    "All limits below apply to amounts for personal use by you and family members living with you. Exceeding the limit requires an \"import verification certificate\" issued by a regional health bureau, which this service cannot arrange.",
  quantityTable: {
    caption: "Guideline quantities recognized as personal use",
    head: ["Item", "Limit"],
    rows: [
      ["Cosmetics (including soap, shampoo, conditioner, toothpaste)", "Up to 24 standard-size units per item type"],
      ["Topical medicine (ointments, eye drops, etc.)", "Up to 24 standard-size units per item type"],
      ["Other medicines & quasi-drugs", "Up to a 2-month supply based on directed use"],
      ["Home medical devices (massagers, thermometers, etc.)", "1 set"],
      ["Disposable contact lenses", "2-month supply"],
      ["In-vitro diagnostics (e.g. ovulation test kits)", "2-month supply"],
      ["Sanitary items (masks, diapers, menstrual products, etc.)", "2-month supply"],
      ["Food (including supplements)", "Roughly 10kg total"],
      ["Tableware & cookware", "Roughly 10kg total"],
      ["Baby items, toys", "Roughly 10kg total"],
    ],
  },
  quantityNote: "\"24 units per item type\" is counted together across brands and colors. For lipstick, for example, the limit is 24 tubes total including different shades.",
  quantityCallout: {
    label: "Please note",
    body: ["Products containing whitening ingredients, and pet shampoos with medicinal claims, cannot be handled under the carrier's rules."],
  },
  categoriesHeading: "Frequently Asked-About Items",
  categories: [
    {
      id: "alcohol",
      title: "Wine & Alcoholic Beverages",
      status: "stop",
      statusLabel: "Not shippable",
      blocks: [
        {
          kind: "p",
          text: "Under US postal and carrier rules, alcohol cannot travel by air except through shippers with a dedicated alcohol-handling contract. This service does not currently handle alcoholic beverages of any kind. Please avoid ordering alcohol from US shops.",
        },
        {
          kind: "callout",
          callout: {
            label: "For reference",
            body: [
              "Under Japan's own rules, personal-use imports of up to roughly twelve 750mL bottles (10L total) are allowed, subject to duty and consumption tax plus liquor tax (¥80 per liter for fruit wine). Liquor tax is not waived even under ¥10,000. Reselling imported alcohol is illegal regardless of scale.",
            ],
          },
        },
      ],
    },
    {
      id: "medicine",
      title: "Medicine (e.g. Tylenol)",
      status: "warn",
      statusLabel: "Quantity limit applies",
      blocks: [
        { kind: "p", text: "Single-ingredient acetaminophen products like Tylenol and other general OTC medicines can clear customs on inspection alone if the quantity is within a 2-month supply." },
        { kind: "p", text: "US over-the-counter drugs we cannot accept" },
        {
          kind: "p",
          text: "Products containing pseudoephedrine or ephedrine are classified in Japan as \"stimulant precursor\" substances, and cannot be imported by mail or cargo. Common US products in this category include:",
        },
        {
          kind: "ul",
          items: [
            "Sudafed",
            "Advil Cold & Sinus / Advil Allergy Sinus",
            "Products with a \"-D\" suffix such as Claritin-D, Zyrtec-D, Allegra-D",
            "Mucinex D",
            "Cough medicine containing codeine or dihydrocodeine (classified as narcotics)",
          ],
        },
        {
          kind: "callout",
          callout: {
            label: "Important",
            body: [
              "Medicine imports are limited to amounts for your own use — importing a combined supply for family or friends is not permitted. For this reason, any shipment containing medicine is never consolidated with another customer's items and is always shipped individually per customer. Reselling or transferring is also prohibited.",
            ],
          },
        },
      ],
    },
    {
      id: "supplement",
      title: "Supplements & Health Foods",
      status: "warn",
      statusLabel: "Depends on ingredients",
      blocks: [
        { kind: "p", text: "General health foods such as vitamins, minerals, and protein can be shipped within personal-use amounts (roughly 10kg total)." },
        {
          kind: "p",
          text: "However, some products sold as \"supplements\" in the US are classified as medicine in Japan based on their ingredients. In that case the limit becomes a 2-month supply.",
        },
        {
          kind: "ul",
          items: [
            "Melatonin (a regulated medicinal ingredient in Japan — not permitted for sale as food)",
            "5-HTP, DHEA, yohimbe",
            "High-dose caffeine or taurine products",
          ],
        },
        { kind: "p", text: "Products containing CBD, CBN, or CBG require documentation verifying THC content and carry a heavy procedural burden, so this service does not handle them." },
        {
          kind: "callout",
          callout: {
            label: "Please note",
            body: [
              "Other countries' import-ban lists (e.g. South Korea's) differ from Japan's standards. An ingredient banned elsewhere may only carry a quantity limit in Japan, and vice versa — please check against Japan's own standards.",
            ],
          },
        },
      ],
    },
    {
      id: "vape",
      title: "Electronic Cigarettes (Vapes)",
      status: "warn",
      statusLabel: "Quantity limit applies",
      blocks: [
        { kind: "p", text: "Nicotine-containing e-liquid and cartridges are legally classified as medicine. Customs will clear these on inspection alone only up to a 1-month supply." },
        {
          kind: "table",
          table: {
            caption: "Monthly limit (calculated per 30-day period)",
            head: ["Item", "Limit"],
            rows: [
              ["Nicotine e-liquid", "120mL (4mL per day)"],
              ["Cartridges / pods", "60 units, or 12,000 puffs"],
              ["Disposable vapes", "12,000 puffs"],
              ["Devices (atomizers)", "1 unit (2 if a spare is needed)"],
              ["Nicotine-free liquid", "No limit"],
            ],
          },
        },
        {
          kind: "p",
          text: "If liquid and cartridges are shipped in the same package, the amounts are combined. Convert at 4mL of liquid or 400 puffs of pods per day, and keep orders within a 30-day supply.",
        },
        {
          kind: "callout",
          callout: {
            label: "Conditions of use",
            body: [
              "You must be 20 or older to use this option. Age is verified at the time of order.",
              "The limit is tracked as a running total over the last 30 days. If less than 30 days have passed since your last order, we cannot accept an order that would push the combined total over the limit.",
              "Heated-tobacco sticks are classified as \"tobacco\" and are subject to tobacco tax even under ¥10,000.",
            ],
          },
        },
      ],
    },
  ],
  rulesHeading: "A Few Requests Before You Order",
  rulesItems: [
    "You, the customer, are the importer of record for every shipment. Please make sure the recipient name matches the name on your order.",
    "We cannot accept a combined order placed on behalf of family or friends — this would exceed the personal-use scope.",
    "Repeatedly ordering the same item over a short period may cause customs to treat the import as commercial, which can block clearance.",
    "Reselling or transferring imported medicine, cosmetics, supplements, or nicotine products to someone else is prohibited by law.",
    "Please enter the product name, quantity, ingredients, and volume accurately when ordering. Incomplete information delays customs clearance.",
    "When ordering alcohol, note the type, ABV, and volume next to the product name (e.g. \"XX wine, alcohol 13%, 750mL\").",
  ],
  footerDisclaimerHeading: "Disclaimer",
  footerDisclaimerItems: [
    "This page is general guidance based on information published by Japan Customs and the Ministry of Health, Labour and Welfare, and does not guarantee that any item will clear customs.",
    "Items not listed here may still be unshippable due to their ingredients or carrier rules. An item that has shipped without issue in the past can become unshippable overnight if a rule changes.",
    "The final decision rests with customs. Any disposal or return cost from a failed clearance is the customer's responsibility.",
    "Laws and their enforcement change. Please check the latest information on the relevant government sites before you buy.",
  ],
  footerOfficialHeading: "Official Resources",
  footerOfficialLinks: [
    { label: "Japan Customs — Prohibited & Restricted Items: customs.go.jp/mizugiwa/kinshi.htm", href: "https://www.customs.go.jp/mizugiwa/kinshi.htm" },
    { label: "Japan Customs — Simplified Tariff for Low-Value Imports: customs.go.jp/tsukan/kanizeiritsu.htm", href: "https://www.customs.go.jp/tsukan/kanizeiritsu.htm" },
    { label: "Japan Customs — Consultation Desk (free): customs.go.jp/question1.htm", href: "https://www.customs.go.jp/question1.htm" },
    { label: "Ministry of Health, Labour and Welfare — Personal Imports of Medicine: mhlw.go.jp", href: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iyakuhin/kojinyunyu/index.html" },
  ],
  footerContactHeading: "Questions",
  footerContactParagraph: "If you're unsure about an item, please ask us before you buy it — send us the product page URL and its ingredient list and we'll check whether it can ship.",
  footerContactLine: "Email: ____________  /  Hours: ____________",
}

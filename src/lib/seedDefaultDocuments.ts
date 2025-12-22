import { getDocumentsCollection } from "@/lib/db";

const defaultDocs = [
  {
    name: "Shipping Policy",
    type: "policy" as const,
    content: `
We ship worldwide from our warehouses within 1-2 business days.

Estimated delivery times:
- Within India: 3-5 business days
- USA & Europe: 7-10 business days
- Rest of world: 10-15 business days

Shipping is free for orders above $50, otherwise a flat $5 fee applies.
We provide tracking information via email as soon as your order ships.
    `.trim(),
  },
  {
    name: "Return & Refund Policy",
    type: "policy" as const,
    content: `
You can return most items within 30 days of delivery for a full refund.

Key points:
- Items must be unused and in original packaging.
- Refunds are processed to the original payment method within 5-7 business days after we receive the returned item.
- Return shipping is free if the product is defective or we made a mistake; otherwise, the customer pays for return shipping.

To start a return, contact support with your order number and reason.
    `.trim(),
  },
  {
    name: "Support Hours & Contact",
    type: "faq" as const,
    content: `
Our human support team is available:
- Monday to Friday: 9:00 AM – 6:00 PM IST
- Saturday: 10:00 AM – 4:00 PM IST
- Sunday and public holidays: Email support only

You can reach us via:
- Email: support@example-store.com
- Live chat on our website
    `.trim(),
  },
];

export async function ensureDefaultDocumentsSeeded() {
  const documentsCollection = await getDocumentsCollection();
  const existingCount = await documentsCollection.countDocuments();
  if (existingCount > 0) return;

  const now = new Date().toISOString();
  await documentsCollection.insertMany(
    defaultDocs.map((doc) => ({
      ...doc,
      uploadedAt: now,
    }))
  );
}



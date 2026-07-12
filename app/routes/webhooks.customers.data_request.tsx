import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

// GDPR: a shopper (or the shop on their behalf) requests their stored data.
// This app stores no customer/personal data — only shop session tokens — so
// there is nothing to return. We acknowledge the request as required.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop} (no customer data stored)`);
  return new Response();
};

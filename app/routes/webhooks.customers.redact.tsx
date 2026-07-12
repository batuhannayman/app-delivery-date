import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

// GDPR: erase a specific customer's data. This app stores no customer/personal
// data, so there is nothing to redact. We acknowledge the request as required.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop} (no customer data stored)`);
  return new Response();
};

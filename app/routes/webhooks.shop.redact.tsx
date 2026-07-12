import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// GDPR: erase a shop's data, sent 48h after uninstall. We only hold session
// records for the shop, so we delete those. (Uninstall already clears them,
// but this guarantees nothing lingers.)
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  await db.session.deleteMany({ where: { shop } });
  return new Response();
};

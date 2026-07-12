import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { shop: session.shop };
};

export default function Index() {
  const { shop } = useLoaderData<typeof loader>();
  const themeEditor = `https://${shop}/admin/themes/current/editor`;

  return (
    <s-page heading="Delivery Date">
      <s-button slot="primary-action" href={themeEditor} target="_blank">
        Open theme editor
      </s-button>

      <s-section heading="Show an accurate delivery date on your products 🚚">
        <s-paragraph>
          This app adds a block that shows shoppers a precise estimated delivery
          date — for example <s-text>“Order today, get it by Friday, 18 July”</s-text>.
          The date is calculated from your dispatch rules, correctly handling the
          order cutoff time, weekends and holidays in your shop&apos;s timezone.
        </s-paragraph>
      </s-section>

      <s-section heading="Set it up in 2 minutes">
        <s-ordered-list>
          <s-list-item>
            Open the <s-link href={themeEditor} target="_blank">theme editor</s-link>{" "}
            and go to a <s-text>product</s-text> template.
          </s-list-item>
          <s-list-item>
            Click <s-text>Add block</s-text> → <s-text>Apps</s-text> →{" "}
            <s-text>Delivery Date</s-text>, and drag it where you want the message
            to appear (usually near the price or the buy button).
          </s-list-item>
          <s-list-item>
            Set your <s-text>preparation time</s-text>, <s-text>cutoff time</s-text>,{" "}
            <s-text>shipping time</s-text>, dispatch days and holidays in the block
            settings, then <s-text>Save</s-text>.
          </s-list-item>
        </s-ordered-list>
      </s-section>

      <s-section heading="How the date is calculated">
        <s-unordered-list>
          <s-list-item>
            <s-text>Preparation time</s-text> — business days you need to dispatch an
            order (0 = same-day dispatch).
          </s-list-item>
          <s-list-item>
            <s-text>Cutoff time</s-text> — orders placed after this time (in your
            shop&apos;s timezone) count from the next business day.
          </s-list-item>
          <s-list-item>
            <s-text>Shipping time</s-text> — the carrier transit window, shown as a
            range or a single date.
          </s-list-item>
          <s-list-item>
            <s-text>Dispatch days &amp; holidays</s-text> — weekends and holidays you
            don&apos;t ship on are always skipped.
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="Good to know">
        <s-paragraph>
          The delivery date is computed right in the shopper&apos;s browser, so the
          widget keeps working even if anything else is down.
        </s-paragraph>
        <s-paragraph>
          Per-product and per-collection rules at scale are coming next.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

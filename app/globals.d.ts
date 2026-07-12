import type * as React from "react";

declare module "*.css";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Rendered by App Bridge at runtime; not yet typed in @shopify/polaris-types.
      "s-app-nav": React.HTMLAttributes<HTMLElement> & {
        children?: React.ReactNode;
      };
    }
  }
}

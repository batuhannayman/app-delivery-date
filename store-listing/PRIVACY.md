# Privacy Policy — Estimated Delivery Date

_Last updated: 12 July 2026_

This Privacy Policy explains how the **Estimated Delivery Date** app ("the App")
handles information when a Shopify merchant installs and uses it.

## Summary

The App shows an estimated delivery date on a store's product pages. **It does
not collect, store, or process any personal data about shoppers or customers.**
Delivery dates are calculated in the shopper's own browser from the rules the
merchant configures. Nothing about the shopper is sent to us.

## What the App stores

To operate as an embedded Shopify app, the App stores a **session record for the
installing store** (the store's `myshopify.com` domain and the access token
Shopify issues at install). This is used only to authenticate the store's admin
session. It contains no customer personal data.

The App does **not**:
- collect shopper names, emails, addresses, or order data;
- use cookies or tracking on the storefront;
- share or sell any data to third parties.

## Data deletion

- When the App is uninstalled, the store's session record is deleted.
- The App responds to Shopify's mandatory privacy webhooks
  (`customers/data_request`, `customers/redact`, `shop/redact`). Because no
  customer data is stored, `customers/*` requests have nothing to return or
  erase; `shop/redact` deletes any remaining session record for that store.

## Hosting & sub-processors

The App's backend is hosted on [HOSTING PROVIDER] and uses a
[DATABASE PROVIDER] database to store the session records described above. These
providers process data solely to host the App.

> Fill in [HOSTING PROVIDER] and [DATABASE PROVIDER] once hosting is chosen.

## Contact

For any privacy question, contact: **bthnnymn@gmail.com**

## Changes

We may update this policy; the "Last updated" date will reflect any change.

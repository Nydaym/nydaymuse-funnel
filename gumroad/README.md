# Nydaymuse Gumroad profile

This is the custom profile for **https://nydaymuse.gumroad.com**. It is independent of the GitHub Pages site in the repository root.

Published on 2026-09-20 after Gumroad server preview and browser validation. The previous custom HTML is saved locally in `.local/profile-before-2026-09-20.html`; preview and publication responses are beside it. These local deployment files are ignored by Git.

The upload artifact is `profile.html`: one self-contained HTML document with inline styles, scripts, and SVG artwork. Product links open Gumroad product pages; it contains no checkout widgets, purchase actions, or direct file downloads.

## Edit and build

From the repository root:

```sh
node scripts/build-gumroad.mjs
node --test gumroad/catalog.test.cjs
node scripts/preview.mjs
```

Open `http://127.0.0.1:4173/gumroad/profile.html` for a local preview. No npm packages are required to build or serve the page. Prices show “View price” locally; Gumroad provides current prices when hosting the profile.

Source files:

- `profile.template.html`: layout, copy, native email follow form, and accessible navigation.
- `profile.css`: responsive layout and light/dark palettes.
- `theme.js`: system color preference, manual theme toggle, and mobile navigation.
- `catalog.js`: live catalogue, current price display, search, filters, progressive display, and pagination.
- `catalog-meta.json`: categories, art direction, and short descriptions for known tools.
- `catalog-snapshot.json`: public catalogue snapshot used for static fallback rendering. It contains no credentials, customer data, or prices.

The initial snapshot contains the 35 published products on the public profile on 2026-09-20 (unpublished Cue, Bound, and Pitch are omitted). Authenticated product-dashboard counts may include products not eligible for the public catalogue. The hosted page uses Gumroad's injected `gumroad-data` as the authority, including newly added and removed products. Unknown tools remain visible under “More tools.” It shows 12 matches at a time, reveals already-loaded matches first, and requests another page only when needed.

## Preview and publish

Install the official [Gumroad CLI](https://github.com/antiwork/gumroad-cli) and connect the intended account with `gumroad auth login`. Before replacing an existing custom profile, save it with `gumroad pages pull profile -o <backup-path>`.

```sh
gumroad pages preview ./gumroad/profile.html --json
gumroad pages push profile ./gumroad/profile.html --json
```

Inspect the preview's `sanitization_report` before pushing. Gumroad removes the document's standalone `meta` and `title` tags and supplies its own document wrapper; the page's styles, SVGs, controls, scripts, and signup markers should remain intact.

## Hosted behavior

- Theme defaults to the visitor's system preference. The toggle works in Gumroad's sandbox. Its storage shim is in memory, so a manual choice may reset on reload there; normal local hosting can retain it.
- Static price markers use `data-gumroad-product` and `data-gumroad-field="price"`. Dynamically rendered cards read the visitor-specific `gumroad-prices` payload. No numeric fallback prices are maintained in the page.
- `gumroadProducts.request` handles catalogue pagination in the hosted sandbox. The UI reports visible and loaded counts, supports retries, and prevents overlapping requests.
- The existing email audience signup uses `form[data-gumroad-follow]`, a required email input, and `[data-gumroad-follow-message]`. Gumroad handles subscription or redirects to its subscribe page, depending on the account's eligibility. The page does not send subscription requests itself.
- All local page styling and interactions work without external fonts, image services, or JavaScript libraries. External navigation and audience signup require Gumroad.

References: [Gumroad profile documentation](https://gumroad.com/help/article/124-your-gumroad-profile-page), [official CLI](https://github.com/antiwork/gumroad-cli).

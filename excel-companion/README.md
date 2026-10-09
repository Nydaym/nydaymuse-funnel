# Nydaymuse Sheet Check / 表格检查

Release 1.0.0 (2026-10-08). Browser-only CSV/XLSX table review with the bounded behavior and limitations below.

A free, open-source, browser-only Excel/CSV companion for Nydaymuse workflows. No app server, account, API key, spreadsheet upload, analytics or runtime CDN.

## 使用 / Use

1. Open the hosted `excel-companion/` page. Switch between 中文 / English at the top.
2. Choose a workflow preset and import one `.xlsx` or UTF-8 `.csv` file. For CSV, choose comma, semicolon or tab **before** import.
3. Select the worksheet, header row and unique ID column. Optional second file enables comparison. Both sheets need the same ID column name. Composite keys must be prepared as a single column upstream.
4. Keep exact matching, or explicitly ignore outer whitespace / case. These rules affect both IDs and values.
5. Check and download a **new** XLSX or CSV report. Source files are never modified.

The built-in demo is fictional. Try `samples/before.csv` and `samples/after.csv` too.

### What it checks

- Missing IDs and duplicate IDs, with source row numbers.
- Excel formula expressions and error cells (cached formula results are ignored).
- Rows with cells beyond the header width.
- Added, removed, changed and unchanged records between two snapshots.
- Added / removed columns. Only common column names are compared.

Duplicate IDs on **either** side are excluded from comparison on **both** sides. Missing IDs are excluded. Counts are record counts; one changed record can produce multiple change rows. The preview shows the first 100 issues / changes; report downloads contain the full result and settings.

### Existing product integration

Presets suggest existing stable ID field names only. They do not recreate a paid template or validate a product's entire business logic:

| Workflow | ID candidates |
| --- | --- |
| Lane | `deal_id`, `client_id`, `project_id`, `invoice_id` |
| Margin | `project_id`, `entry_id`, `expense_id`, `role` |
| Crew | `Package ID`, `Review ID`, `Requirement ID`, `Amount record ID` |
| Proof | `Case ID`, `Evidence ID`, `Version ID`, `Reuse ID` |

For Excel sheets with differently styled headings, choose the ID column manually. Export the same table before and after a review, then compare. Files are read locally; no connection to customer accounts or template downloads is required. The app links back to the [Nydaymuse catalogue](https://nydaym.github.io/nydaymuse-funnel/).

## Important limits / 使用边界

- `.xlsx` and UTF-8 CSV only; no `.xls`, `.xlsm`, passwords or macro execution. Macro-containing workbooks are rejected. Maximum 5 MB per input, 30 MB declared expanded ZIP data, 30 sheets, 20,000 rows and 100 columns per sheet, 300,000 rectangular cells per workbook. Parsing runs in a cancellable worker with a 15-second timeout. These are resource guards, **not** a security boundary for hostile workbooks. Only use trusted files.
- This is not an Excel editor or roundtrip tool. Reports are new, value-only workbooks. Original formatting, charts, macros, merged layout, comments, hidden state and number formats are not preserved.
- Literal text `001` remains `001`. A numeric `1` displayed using Excel format `000` remains numeric value `1` and compares as text `1`. Empty is distinct from `0` and `false`; numeric `1` and text `1` compare equal because comparison uses text representations.
- Dates represented as actual XLSX dates become ISO strings. CSV dates stay as literal text. There is no automatic text-date parsing, timezone normalization, locale conversion or numeric tolerance. Align representations yourself before comparing mixed formats.
- Formula expressions appear as `[FORMULA] expression`. Cached values are ignored, formulas are never recalculated, and formula reports cannot establish whether calculated totals are current or correct. Formula/error metadata remains distinct from literal text with the same displayed prefix.
- XLSX report cells are explicitly strings, not formulas. CSV fields that could start formulas are prefixed with an apostrophe. This changes those exported strings for safety; do not remove that protection from untrusted content.
- No persistence, upload or telemetry. Clear / close the page releases app-held data, but is not secure device erasure. Hosting providers can still log ordinary page visits. No service worker / offline cache is installed.

## Run locally / 本地运行

The published GitHub Pages app needs no server operated by you. For development, serve this folder using any static file server, for example:

```sh
python3 -m http.server 8765
```

Open `http://localhost:8765`. Direct `file://` opening is not supported because browsers restrict Web Workers. All runtime scripts are vendored locally, so no dependency fetch happens while users process files.

## Tests

Node.js 20+; the core tests need no package install:

```sh
node --test tests/*.test.cjs
node --check app.js
node --check worker.js
```

Optional browser tests require the official Playwright package and Chromium. The runner starts a temporary loopback static server automatically:

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/browser.cjs
```

Browser tests cover demo, language switch, XLSX report safety, result invalidation, reset, worker CSV / XLSX loading, formula handling, failed file replacement, mobile layout and absence of external app requests. Tests write screenshots only to the OS temporary directory. `TEST_URL` can point to a different static server; `CHROMIUM_PATH` can select an installed Chromium executable.

## Deploy on GitHub Pages

Copy this whole directory into `excel-companion/` in a GitHub Pages repository. Preserve relative paths. Existing Jekyll Pages sites do not need `.nojekyll` or a workflow change. The app is self-contained; no secrets or backend configuration. Add a normal link from the catalogue if desired.

## Licensing and provenance

The MIT license in this directory applies only to original Sheet Check code, documentation and fictional samples here. It does **not** relicense the enclosing catalogue, paid products, customer data or other directories. SheetJS Community Edition 0.20.3 is separately Apache-2.0 licensed; see `vendor/SHEETJS-LICENSE.txt` and `THIRD_PARTY_NOTICES.md`.

This companion does not include paid workbook contents, paid formulas, customer spreadsheets or private business data.

## Release verification / 发布验证

Passed for this release: 20 core checks and 10 independent worker/parser checks; hosted browser demo, actual synthetic CSV import, invalid-header blocking, reset/repeated runs, English language switch, and actual XLSX/CSV report downloads reopened for inspection. The surrounding catalogue passed 9 regression tests and 42-page metadata checks.

Follow-up verification (2026-10-09): actual file-chooser XLSX import passed in hosted cloud Chromium for one synthetic, 21,730-byte report generated by this app. With the correct `.xlsx` suffix, both `Summary` and `Issues and changes` worksheets were available. Selecting `Issues and changes` and the `ID` column produced 6 rows, 2 expected issues (missing ID at source row 3 and duplicate `001` at source row 5), and 1 excluded duplicate ID. The extensionless copy was rejected as an unsupported file type. This is a bounded single-workbook import check; app code is unchanged.

Not verified: mobile layout, browser cancellation/race timing, same-file reselection, Microsoft Excel desktop, Google Sheets or Notion import. Additional XLSX parsing was checked with synthetic worker fixtures. These checks are not a guarantee of compatibility with every workbook or of financial/business-rule correctness.

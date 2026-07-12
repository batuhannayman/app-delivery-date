// Regression tests for the EDD engine (the wedge = correctness).
// Loads the browser asset with minimal window/document stubs, then asserts
// computed dates against hand-worked expectations.
// Shop timezone: Europe/Istanbul (UTC+3, no DST — clean baseline).
// Run: npm run test:engine
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));

global.window = {};
global.document = { readyState: "complete", addEventListener() {}, querySelectorAll() { return []; } };
require(join(here, "..", "extensions", "delivery-date", "assets", "delivery-date.js"));
const EDD = global.window.EDD;

const TZ = "Europe/Istanbul";
const base = { timezone: TZ, prepDays: 1, cutoff: "14:00", shipMin: 2, shipMax: 5,
  businessDays: [1, 2, 3, 4, 5], holidays: "" };

let pass = 0, fail = 0;
function check(name, cfg, ref, exp) {
  const r = EDD.compute(cfg, ref);
  const got = { e: EDD.ymd(r.earliest), l: EDD.ymd(r.latest), single: r.single };
  const ok = got.e === exp.e && got.l === exp.l && (exp.single === undefined || got.single === exp.single);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) { console.log("   expected", exp, "\n   got     ", got); fail++; } else pass++;
}

// Istanbul = UTC+3, so civil HH:00 -> UTC (HH-3):00.
const ist = (y, mo, d, h) => new Date(Date.UTC(y, mo - 1, d, h - 3, 0));

// A) Mon 2026-07-13 10:00, before cutoff. order Mon -> dispatch Tue 14 -> +2/+5 biz.
check("A before-cutoff Monday", base, ist(2026, 7, 13, 10), { e: "2026-07-16", l: "2026-07-21" });

// B) Fri 2026-07-17 16:00, AFTER cutoff -> rolls to Mon 20 (weekend skipped). The classic bug.
check("B after-cutoff Friday -> weekend rollover", base, ist(2026, 7, 17, 16), { e: "2026-07-23", l: "2026-07-28" });

// C) Sat 2026-07-18 10:00 -> Saturday must NOT dispatch; order rolls to Mon 20.
check("C Saturday order never dispatches on weekend", base, ist(2026, 7, 18, 10), { e: "2026-07-23", l: "2026-07-28" });

// D) Holiday 2026-07-14 skipped during dispatch.
check("D holiday skipped", { ...base, holidays: "2026-07-14" }, ist(2026, 7, 13, 10), { e: "2026-07-17", l: "2026-07-22" });

// E) prep 0, ship 1-1 -> same-day dispatch, single date.
check("E same-day prep, single date", { ...base, prepDays: 0, shipMin: 1, shipMax: 1 },
  ist(2026, 7, 13, 10), { e: "2026-07-14", l: "2026-07-14", single: true });

// F) exactly at cutoff (14:00) still counts for today.
check("F exactly at cutoff counts today", base, ist(2026, 7, 13, 14), { e: "2026-07-16", l: "2026-07-21" });

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

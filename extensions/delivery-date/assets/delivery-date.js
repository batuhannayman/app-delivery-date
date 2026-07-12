/*
 * Delivery Date widget — client-side estimated-delivery engine.
 *
 * Design goal (the wedge): CORRECTNESS + RESILIENCE.
 *  - All date math is done in the SHOP timezone (not the visitor's), because the
 *    estimate is about when the shop dispatches, not where the buyer sits.
 *  - Day advancement is done on UTC-midnight "anchors" so DST transitions never
 *    shift a calendar day.
 *  - Cutoff, weekends and holidays are all honoured.
 *  - If anything goes wrong we render NOTHING (never a wrong/broken date).
 *
 * This module is intentionally dependency-free and exposes its pure functions on
 * window.EDD so they can be unit-tested outside the browser.
 */
(function () {
  "use strict";

  function pad(n) { return String(n).padStart(2, "0"); }
  function ymd(d) { return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  function addDays(anchor, n) { return new Date(anchor.getTime() + n * 86400000); }

  // Civil "now" in a given IANA timezone.
  // Returns { anchor: Date at UTC-midnight of that civil day, minutes: minutes since local midnight }.
  function shopNow(tz, referenceDate) {
    var now = referenceDate || new Date();
    var parts = {};
    try {
      var fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false,
      });
      fmt.formatToParts(now).forEach(function (p) {
        if (p.type !== "literal") parts[p.type] = p.value;
      });
    } catch (e) {
      parts = {
        year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(),
        hour: now.getHours(), minute: now.getMinutes(),
      };
    }
    var hh = +parts.hour; if (hh === 24) hh = 0; // some ICU builds emit 24:00
    return {
      anchor: new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day)),
      minutes: hh * 60 + (+parts.minute),
    };
  }

  function isBusiness(anchor, bizDays, holidaySet) {
    return bizDays.indexOf(anchor.getUTCDay()) !== -1 && !holidaySet.has(ymd(anchor));
  }

  // First business day strictly after `anchor`.
  function nextBusiness(anchor, bizDays, holidaySet) {
    var a = addDays(anchor, 1), guard = 0;
    while (!isBusiness(a, bizDays, holidaySet) && guard < 400) { a = addDays(a, 1); guard++; }
    return a;
  }

  // Advance `n` business days forward. n === 0 returns `anchor` unchanged.
  function addBusinessDays(anchor, n, bizDays, holidaySet) {
    var a = anchor, count = 0, guard = 0;
    while (count < n && guard < 2000) {
      a = addDays(a, 1);
      if (isBusiness(a, bizDays, holidaySet)) count++;
      guard++;
    }
    return a;
  }

  function parseHolidays(str) {
    var set = new Set();
    if (!str) return set;
    String(str).split(/[\s,;]+/).forEach(function (t) {
      t = t.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(t)) set.add(t);
    });
    return set;
  }

  function toMinutes(cutoff) {
    if (cutoff && /^\d{1,2}:\d{2}$/.test(cutoff)) {
      var c = cutoff.split(":");
      var m = (+c[0]) * 60 + (+c[1]);
      if (m >= 0 && m <= 24 * 60) return m;
    }
    return 24 * 60; // no valid cutoff -> treat as "always before cutoff"
  }

  // Core: from a config object -> { earliest, latest, single } (anchors).
  function compute(cfg, referenceDate) {
    var bizDays = (cfg.businessDays && cfg.businessDays.length) ? cfg.businessDays : [1, 2, 3, 4, 5];
    var holidays = parseHolidays(cfg.holidays);
    var now = shopNow(cfg.timezone, referenceDate);
    var cutoffMin = toMinutes(cfg.cutoff);

    var todayBiz = isBusiness(now.anchor, bizDays, holidays);
    // Order counts for today only if today ships AND we're before the cutoff.
    var orderDay = (todayBiz && now.minutes <= cutoffMin)
      ? now.anchor
      : nextBusiness(now.anchor, bizDays, holidays);

    var prep = Math.max(0, parseInt(cfg.prepDays, 10) || 0);
    var dispatch = addBusinessDays(orderDay, prep, bizDays, holidays);

    var minD = Math.max(0, parseInt(cfg.shipMin, 10) || 0);
    var maxD = Math.max(minD, parseInt(cfg.shipMax, 10) || minD);
    var earliest = addBusinessDays(dispatch, minD, bizDays, holidays);
    var latest = addBusinessDays(dispatch, maxD, bizDays, holidays);

    return { earliest: earliest, latest: latest, single: minD === maxD };
  }

  function fmtDate(anchor, locale, opts) {
    var o = Object.assign({ timeZone: "UTC" }, opts);
    try { return new Intl.DateTimeFormat(locale || undefined, o).format(anchor); }
    catch (e) { return new Intl.DateTimeFormat(undefined, o).format(anchor); }
  }

  function render(el) {
    var cfgEl = el.querySelector("[data-edd-config]");
    var out = el.querySelector("[data-edd-text]");
    if (!cfgEl || !out) return;

    var cfg, res;
    try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }
    try { res = compute(cfg); } catch (e) { return; } // resilience: never show a broken date

    var locale = cfg.locale || document.documentElement.lang || undefined;
    var dOpts = { day: "numeric", month: "long" };
    if (cfg.showWeekday !== false) dOpts.weekday = "long";

    var text = res.single
      ? (cfg.messageSingle || "Get it by {date}").replace("{date}", fmtDate(res.latest, locale, dOpts))
      : (cfg.messageRange || "Get it between {from} and {to}")
          .replace("{from}", fmtDate(res.earliest, locale, dOpts))
          .replace("{to}", fmtDate(res.latest, locale, dOpts));

    out.textContent = text;
    el.removeAttribute("hidden");
  }

  function init() {
    var nodes = document.querySelectorAll("[data-edd]");
    for (var i = 0; i < nodes.length; i++) render(nodes[i]);
  }

  // Expose pure functions for testing.
  window.EDD = {
    shopNow: shopNow, isBusiness: isBusiness, nextBusiness: nextBusiness,
    addBusinessDays: addBusinessDays, parseHolidays: parseHolidays,
    toMinutes: toMinutes, compute: compute, ymd: ymd,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

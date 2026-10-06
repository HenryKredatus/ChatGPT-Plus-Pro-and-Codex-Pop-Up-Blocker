// ==UserScript==
// @name         ChatGPT - Hide Promo/Upgrade Nag Banners
// @namespace    https://github.com/HenryKredatus/ChatGPT-Plus-Pro-and-Codex-Pop-Up-Blocker
// @version      3.0.0
// @description  Hides ChatGPT's dismissible promo banners above the composer (Upgrade to Plus, Upgrade to Pro, Meet Codex, etc.) and the Upgrade buttons in the header/sidebar.
// @author       HenryKredatus
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @run-at       document-idle
// @grant        none
// @supportURL   https://github.com/HenryKredatus/ChatGPT-Plus-Pro-and-Codex-Pop-Up-Blocker/issues
// @updateURL    https://raw.githubusercontent.com/HenryKredatus/ChatGPT-Plus-Pro-and-Codex-Pop-Up-Blocker/main/chatgpt-hide-upgrade-nags.user.js
// @downloadURL  https://raw.githubusercontent.com/HenryKredatus/ChatGPT-Plus-Pro-and-Codex-Pop-Up-Blocker/main/chatgpt-hide-upgrade-nags.user.js
// ==/UserScript==

(function () {
  "use strict";

  // This ALWAYS prints, regardless of any debug flag, so you can confirm
  // this exact script version is actually the one running.
  console.log(
    "%c[hide-chatgpt-nags] v3.0.0 loaded on " + location.href,
    "color: #0a0; font-weight: bold;",
  );

  // NOTE: ChatGPT's banner markup uses hashed/generated CSS-module class
  // names (e.g. "surface-NbxhOL", "primary-FmM7e1") that change on every
  // OpenAI deploy, so none of the detection below keys off class names.
  // Instead it leans on things that are much more stable: ARIA labels
  // (OpenAI's own accessibility text literally calls these "banner"s) and
  // loose text patterns, plus a generic "dismiss button + CTA button"
  // structural combo as a catch-all.

  // Optional extra phrases to catch, in case a banner ever shows up without
  // any of the structural markers below. Matching is loose/lowercased so
  // it catches minor copy variants.
  const NAG_PHRASES = [
    "upgrade to plus",
    "upgrade to pro",
    "improve accuracy for documents and research",
    "meet codex",
    "get plus",
    "go plus",
    "get pro",
    "go pro",
    "upgrade plan",
    "try plus free",
    "try pro free",
  ];

  // CTA button text patterns that show up on these banners' primary buttons
  // across plans/features (Plus, Pro, Team, Codex, etc.).
  const CTA_TEXT_PATTERNS = [
    /\b(get|go|try|upgrade to)\s+(plus|pro|team)\b/i,
    /\btry\b.*\bfree\b/i,
    /\bupgrade\b/i,
    /\bdownload the app\b/i,
    /\bmeet codex\b/i,
  ];

  // Any button whose aria-label mentions "banner" alongside dismiss/close
  // wording is, by OpenAI's own labeling, a dismiss control for one of
  // these promo banners — e.g. aria-label="Dismiss ChatGPT beacon banner".
  const BANNER_DISMISS_ARIA_RE = /banner/i;
  const DISMISS_ARIA_RE = /close|dismiss/i;

  function textMatchesNag(el) {
    const text = (el.textContent || "").toLowerCase();
    if (!text) return false;
    return NAG_PHRASES.some((phrase) => text.includes(phrase));
  }

  function buttonLooksLikeCta(btn) {
    const text = (btn.textContent || "").trim();
    if (!text) return false;
    return CTA_TEXT_PATTERNS.some((re) => re.test(text));
  }

  function isPromoBanner(aside) {
    const buttons = Array.from(aside.querySelectorAll("button"));

    // Strongest signal: a dismiss/close button whose aria-label explicitly
    // says "banner" (OpenAI's own term for this component). This alone is
    // enough — it's accessibility text, not a styling class, so it's much
    // less likely to change between deploys.
    const hasBannerDismiss = buttons.some((btn) => {
      const aria = btn.getAttribute("aria-label") || "";
      return BANNER_DISMISS_ARIA_RE.test(aria) && DISMISS_ARIA_RE.test(aria);
    });
    if (hasBannerDismiss) return true;

    // Generic structural combo: some dismiss/close control (aria-label or
    // common icon-button naming) PLUS some CTA-looking button. Two controls
    // like that together in a small floating panel is the shape of every
    // version of this banner we've seen, regardless of class names or
    // whether the title is an <h3> or a plain <div>.
    const hasDismissBtn = buttons.some((btn) => {
      const aria = btn.getAttribute("aria-label") || "";
      return DISMISS_ARIA_RE.test(aria);
    });
    const hasCtaBtn = buttons.some(buttonLooksLikeCta);
    if (hasDismissBtn && hasCtaBtn) return true;

    // Fallback: known phrases anywhere in the banner's text, in case a
    // banner ships without a recognizable dismiss/CTA button at all.
    return textMatchesNag(aside);
  }

  // CSS-based first line of defense: hides an <aside> instantly if it
  // contains a dismiss/close button labeled as a "banner", so there's no
  // flash of content before the JS pass runs. This mirrors the strongest
  // JS check above and is the one part of the detection that's safe to
  // express as a plain CSS selector.
  const style = document.createElement("style");
  style.textContent = `
    aside:has(button[aria-label*="banner" i]) { display: none !important; }
  `;
  document.documentElement.appendChild(style);

  function hideUpgradeNags(root = document) {
    // 1) The dismissible promo banners above the composer.
    root.querySelectorAll("aside").forEach((aside) => {
      if (isPromoBanner(aside)) {
        aside.style.setProperty("display", "none", "important");
      }
    });

    // 2) Standalone "Upgrade" pill/button in the top-right header actions
    //    and the sidebar footer, identified by aria-label/text rather than
    //    fragile class names.
    root.querySelectorAll('button[aria-label="Upgrade"]').forEach((btn) => {
      const wrapper = btn.closest("div") || btn;
      wrapper.style.setProperty("display", "none", "important");
    });

    root.querySelectorAll("button").forEach((btn) => {
      const label = (btn.textContent || "").trim().toLowerCase();
      if (label === "upgrade" || label === "get plus" || label === "go plus") {
        const wrapper = btn.closest("div") || btn;
        wrapper.style.setProperty("display", "none", "important");
      }
    });
  }

  // Run once on load, then keep watching for React re-renders / route changes.
  hideUpgradeNags();

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes.length) {
        hideUpgradeNags(document);
        break;
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();

// ==UserScript==
// @name         ChatGPT - Hide Promo/Upgrade Nag Banners
// @namespace    https://github.com/HenryKredatus/ChatGPT-Plus-Pro-and-Codex-Pop-Up-Blocker
// @version      2.0.0
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
    "%c[hide-chatgpt-nags] v2.0.0 loaded on " + location.href,
    "color: #0a0; font-weight: bold;",
  );

  // Optional extra phrases to catch, in case a banner ever shows up without
  // the structural markers below (title/close button/CTA). Matching is
  // loose/lowercased so it catches minor copy variants.
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
  ];

  // CTA button text patterns that show up on these banners' primary buttons
  // across plans (Plus, Pro, Team, etc.) as an extra structural signal,
  // independent of the .btn-primary class name.
  const CTA_TEXT_RE = /^(get|go|upgrade to|try)\s+(plus|pro|team)$|^upgrade$/i;

  // CSS-based first line of defense: hides an <aside> the instant it has a
  // Close button and a primary CTA button inside it, which is the shared
  // markup ChatGPT uses for ALL of these dismissible promo banners
  // (Upgrade to Plus, Meet Codex, etc.) regardless of the copy inside.
  const style = document.createElement("style");
  style.textContent = `
    aside:has(button[aria-label="Close"]):has(.btn-primary) { display: none !important; }
  `;
  document.documentElement.appendChild(style);

  function textMatchesNag(el) {
    const text = (el.textContent || "").toLowerCase();
    if (!text) return false;
    return NAG_PHRASES.some((phrase) => text.includes(phrase));
  }

  function isPromoBanner(aside) {
    // Structural signature shared by every one of these banners:
    // - an <h3> title
    // - a "Close" button (aria-label="Close")
    // - a primary CTA button (Get Plus / Download the app / etc.)
    const h3 = aside.querySelector("h3");
    const hasCloseBtn = !!aside.querySelector('button[aria-label="Close"]');
    const hasPrimaryCta = Array.from(aside.querySelectorAll("button")).some(
      (btn) =>
        btn.classList.contains("btn-primary") ||
        CTA_TEXT_RE.test((btn.textContent || "").trim()),
    );
    if (h3 && hasCloseBtn && hasPrimaryCta) return true;

    // Fallback: known phrases, in case markup ever drifts.
    return h3 && textMatchesNag(h3);
  }

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

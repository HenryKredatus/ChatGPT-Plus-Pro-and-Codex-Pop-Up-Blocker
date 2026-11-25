# ChatGPT Plus/Pro and Codex Pop-Up Blocker

This is a Tampermonkey userscript to hide/block ChatGPT's dismissible upsell and announcement banners (e.g. "Upgrade to Plus," "Upgrade to Pro," "Meet Codex in the desktop app") and the inline "As this conversation gets longer... Upgrade for more context" upsell on any desktop browser.

ChatGPT renders these as banners above the message composer, and they reappear periodically no matter how many times you dismiss them. Rather than chase the wording of each new one individually, this script recognizes the underlying component ChatGPT reuses for all of them, so it catches Plus, Pro, Codex, and future promos alike, along with the standalone "Upgrade" buttons in the header and sidebar.

## Notification Example

![Example](Example.png)

## Installation

1. Install Tampermonkey from https://www.tampermonkey.net/ (On Chromium browsers like Google Chrome or Microsoft Edge, you will probably need to manually go into the extension's settings and set "site access" to "on all sites," along with changing "allow user scripts" to ON for any installed scripts like this to do anything)
2. Click this link: [chatgpt-hide-upgrade-nags.user.js](https://raw.githubusercontent.com/HenryKredatus/ChatGPT-Plus-Pro-and-Codex-Pop-Up-Blocker/main/chatgpt-hide-upgrade-nags.user.js) -Tampermonkey will pop up an install prompt.
3. Click Install.
4. Optional: adjust `NAG_PHRASES` or `CTA_TEXT_PATTERNS` near the top of the script if you want to catch/allow specific wording.

## How it works

ChatGPT builds every one of these dismissible promo banners (Plus, Pro, Codex, and presumably whatever comes next) from the same underlying component, but its styling class names are hashed/auto-generated and change on every OpenAI deploy (e.g. `surface-NbxhOL`, `primary-FmM7e1` one day, something else entirely the next). So instead of matching class names, the script matches things OpenAI itself keeps stable — accessibility (`aria-label`) text and the general shape of the banner. It:

1. Scans every `<aside>` element on the page and checks its buttons' `aria-label` attributes. If any button is labeled as a dismiss/close control for a "banner" (OpenAI's own wording, e.g. `aria-label="Dismiss ChatGPT beacon banner"`), that's treated as a certain match on its own.
2. As a fallback, looks for the general shape these banners share even when the labeling differs: some dismiss/close button (by `aria-label`) paired with some call-to-action-looking button (matched loosely against patterns like "Get/Go/Try Plus," "Upgrade," "Try ... free," "Meet Codex," "Download the app").
3. Falls back further to a plain-text phrase match (`NAG_PHRASES`) against the banner's full text, for the rare case one ships without a recognizable dismiss or CTA button at all.
4. Hides any matched `<aside>` with `display: none !important` — both immediately via an injected CSS rule keyed on the same "banner" aria-label pattern (so there's no flash before JavaScript runs), and via a JavaScript pass for anything the CSS selector alone doesn't catch.
5. Separately hides any standalone upgrade button/pill (header actions, sidebar footer, or inline in a conversation), matched by `aria-label="Upgrade"` or by the button's full text via a pattern (`UPGRADE_BUTTON_RE`) covering "Upgrade," "Upgrade to Plus/Pro," "Get/Go/Try Plus/Pro," and "Try Plus free."
6. Handles the inline upsell that appears inside long conversations ("As this conversation gets longer, ChatGPT may lose track of details... Upgrade for more context in every conversation" with an "Upgrade to Plus" button). That block isn't a banner and has no dismiss button, but it sits in a `role="status"` live region, so when an upgrade button is found inside one, the whole region (text and button) is hidden, along with its now-empty parent so no blank spacing is left. A phrase check (`NAG_PHRASES`) also hides any `role="status"` block containing known upsell wording, even if the button text changes.
7. Uses a `MutationObserver` to re-run all of the above as you navigate and as ChatGPT's React app re-renders content, so newly-appearing banners get hidden without a page reload.

## NOTE

Because matching avoids ChatGPT's hashed class names entirely and leans on `aria-label` wording and loose text patterns instead, this should keep working through most future OpenAI redesigns of these banners without needing an update — but if something ever slips through, the fastest fix is grabbing that banner's HTML and adding its phrase to `NAG_PHRASES` or its CTA wording to `CTA_TEXT_PATTERNS`, or opening an issue.

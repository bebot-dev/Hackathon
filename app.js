const inputView = document.getElementById("input-view");
const loadingView = document.getElementById("loading-view");
const resultsView = document.getElementById("results-view");
const tcInput = document.getElementById("tc-input");
const charCountEl = document.getElementById("char-count");
const scanBtn = document.getElementById("scan-btn");
const scanErrorEl = document.getElementById("scan-error");
const resetLink = document.getElementById("reset-link");
const loadDemoBtn = document.getElementById("load-demo-btn");
const newAnalysisBtn = document.getElementById("new-analysis-btn");
const verdictBanner = document.getElementById("verdict-banner");
const verdictIconEl = document.getElementById("verdict-icon");
const verdictHeadlineEl = document.getElementById("verdict-headline");
const verdictTextEl = document.getElementById("verdict-text");
const clauseGroupsEl = document.getElementById("clause-groups");

const MIN_CHARS = 200;

const SEVERITY_ORDER = ["critical", "caution", "standard"];
const SEVERITY_LABEL = {
  critical: "Critical",
  caution: "Caution",
  standard: "Standard",
};
const SEVERITY_GROUP_LABEL = {
  critical: "Critical Risks",
  caution: "Caution Risks",
  standard: "Standard Items",
};

const ICON_SEARCH =
  '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
const ICON_WARNING_TRIANGLE =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3L2 20h20L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.75" fill="currentColor" stroke="none"/></svg>';
const ICON_OCTAGON_STOP =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8l6 6v8l-6 6H8l-6-6V8l6-6z"/><path d="M12 8v5M12 16v.01"/></svg>';
const ICON_CHECK_SHIELD =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>';
const ICON_FLAME =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 3-3 4-3 8a3 3 0 006 0c1-2-1-3-1-5 2 1 4 4 4 7a6 6 0 11-12 0c0-4 3-6 6-10z"/></svg>';
const ICON_EYE =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_CHECK_CIRCLE =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>';
const ICON_LIGHTBULB =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0012 3z"/></svg>';

const GROUP_ICON = {
  critical: ICON_FLAME,
  caution: ICON_EYE,
  standard: ICON_CHECK_CIRCLE,
};

tcInput.addEventListener("input", onInputChange);
scanBtn.addEventListener("click", onScan);
resetLink.addEventListener("click", onReset);
newAnalysisBtn.addEventListener("click", onReset);
loadDemoBtn.addEventListener("click", onLoadDemo);

async function onLoadDemo() {
  hideScanError();
  loadDemoBtn.disabled = true;
  try {
    const response = await fetch("/OmniLife Terms of Service.txt");
    if (!response.ok) throw new Error(`Failed to load demo text: ${response.status}`);
    tcInput.value = await response.text();
    onInputChange();
    tcInput.focus();
  } catch (err) {
    console.error(err);
    showScanError("Couldn't load the demo document. Please try again.");
  } finally {
    loadDemoBtn.disabled = false;
  }
}

function onInputChange() {
  const length = tcInput.value.length;
  charCountEl.textContent = `${length.toLocaleString()} character${length === 1 ? "" : "s"}`;
  scanBtn.disabled = length < MIN_CHARS;
  hideScanError();
}

async function onScan() {
  const text = tcInput.value.trim();
  if (text.length < MIN_CHARS) return;

  hideScanError();
  showView(loadingView);

  try {
    const { clauses, truncated } = await scanTerms(text);
    const verdict = computeVerdict(clauses);
    renderResults({ verdict, clauses, truncated });
    showView(resultsView);
    resultsView.focus();
  } catch (err) {
    console.error(err);
    showView(inputView);
    showScanError("Something went wrong scanning this text. Please try again.");
  }
}

function onReset() {
  tcInput.value = "";
  onInputChange();
  hideScanError();
  showView(inputView);
}

function showView(view) {
  for (const v of [inputView, loadingView, resultsView]) {
    v.classList.toggle("view--hidden", v !== view);
  }
}

function showScanError(message) {
  scanErrorEl.textContent = message;
  scanErrorEl.classList.remove("view--hidden");
}

function hideScanError() {
  scanErrorEl.classList.add("view--hidden");
  scanErrorEl.textContent = "";
}

/**
 * Calls the serverless Analysis Call endpoint (SPEC.md CAP-2) and returns
 * the structured clause array.
 */
async function scanTerms(text) {
  const response = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Scan request failed: ${response.status}`);
  }

  return response.json();
}

const VERDICT = {
  RECONSIDER: "Reconsider",
  CAUTION: "Proceed with Caution",
  PROCEED: "Proceed",
};

const VERDICT_CONFIG = {
  [VERDICT.RECONSIDER]: {
    className: "reconsider",
    headline: "Reconsider Agreement",
    text: "This document contains multiple critical risks. Review them carefully before signing.",
    icon: ICON_OCTAGON_STOP,
  },
  [VERDICT.CAUTION]: {
    className: "caution",
    headline: "Proceed with Caution",
    text: "This document contains some risks worth understanding before you agree.",
    icon: ICON_WARNING_TRIANGLE,
  },
  [VERDICT.PROCEED]: {
    className: "proceed",
    headline: "Looks Safe to Sign",
    text: "No significant risks were found in this document.",
    icon: ICON_CHECK_SHIELD,
  },
};

/** SPEC.md CAP-3 verdict logic. */
function computeVerdict(clauses) {
  const criticalCount = clauses.filter((c) => c.severity === "critical").length;
  const cautionCount = clauses.filter((c) => c.severity === "caution").length;

  if (criticalCount >= 2) return VERDICT.RECONSIDER;
  if (criticalCount === 1 || cautionCount >= 2) return VERDICT.CAUTION;
  return VERDICT.PROCEED;
}

function renderResults({ verdict, clauses, truncated }) {
  const config = VERDICT_CONFIG[verdict];
  verdictBanner.className = `verdict-banner verdict-banner--${config.className}`;
  verdictIconEl.innerHTML = config.icon;
  verdictHeadlineEl.textContent = config.headline;
  verdictTextEl.textContent = config.text;

  clauseGroupsEl.innerHTML = "";

  if (truncated) {
    const notice = document.createElement("p");
    notice.className = "truncation-notice";
    notice.textContent =
      "This document was long enough that analysis may be incomplete — some clauses past this point may not have been reviewed.";
    clauseGroupsEl.appendChild(notice);
  }

  for (const severity of SEVERITY_ORDER) {
    const group = clauses.filter((c) => c.severity === severity);
    if (group.length === 0) continue;

    const section = document.createElement("div");
    section.className = `clause-group clause-group--${severity}`;

    const title = document.createElement("div");
    title.className = "clause-group__title";
    title.innerHTML = `
      <span class="clause-group__icon">${GROUP_ICON[severity]}</span>
      <span class="clause-group__label">${SEVERITY_GROUP_LABEL[severity]}</span>
      <span class="clause-group__count">${group.length}</span>
    `;
    section.appendChild(title);

    for (const clause of group) {
      section.appendChild(renderClauseCard(clause, severity));
    }

    clauseGroupsEl.appendChild(section);
  }
}

function renderClauseCard(clause, severity) {
  const card = document.createElement("div");
  card.className = `clause-card clause-card--${severity}`;

  const badge = document.createElement("span");
  badge.className = `clause-card__badge clause-card__badge--${severity}`;
  badge.textContent = SEVERITY_LABEL[severity];
  card.appendChild(badge);

  const consequenceLabel = document.createElement("span");
  consequenceLabel.className = "eyebrow clause-card__label";
  consequenceLabel.textContent = "Plain English Consequence";
  card.appendChild(consequenceLabel);

  const statement = document.createElement("p");
  statement.className = "clause-card__statement";
  statement.textContent = clause.consequence;
  card.appendChild(statement);

  const quoteLabel = document.createElement("span");
  quoteLabel.className = "eyebrow clause-card__label";
  quoteLabel.textContent = "Verbatim Clause";
  card.appendChild(quoteLabel);

  const quoteBlock = document.createElement("div");
  quoteBlock.className = "clause-card__quote-block";
  const quoteMark = document.createElement("span");
  quoteMark.className = "clause-card__quote-mark";
  quoteMark.setAttribute("aria-hidden", "true");
  quoteMark.textContent = "“";
  quoteBlock.appendChild(quoteMark);
  const quote = document.createElement("p");
  quote.className = "clause-card__quote";
  quote.textContent = clause.clause_text;
  quoteBlock.appendChild(quote);
  card.appendChild(quoteBlock);

  if (clause.suggested_action) {
    const actionBlock = document.createElement("div");
    actionBlock.className = "clause-card__action-block";

    const actionIcon = document.createElement("span");
    actionIcon.className = "clause-card__action-icon";
    actionIcon.innerHTML = ICON_LIGHTBULB;
    actionBlock.appendChild(actionIcon);

    const actionBody = document.createElement("div");
    const actionLabel = document.createElement("span");
    actionLabel.className = "eyebrow";
    actionLabel.textContent = "Suggested Action";
    actionBody.appendChild(actionLabel);
    const actionText = document.createElement("p");
    actionText.className = "clause-card__action-text";
    actionText.textContent = clause.suggested_action;
    actionBody.appendChild(actionText);
    actionBlock.appendChild(actionBody);

    card.appendChild(actionBlock);
  }

  return card;
}

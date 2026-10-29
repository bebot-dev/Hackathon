const inputView = document.getElementById("input-view");
const resultsView = document.getElementById("results-view");
const tcInput = document.getElementById("tc-input");
const scanBtn = document.getElementById("scan-btn");
const resetBtn = document.getElementById("reset-btn");
const verdictEl = document.getElementById("verdict");
const clauseGroupsEl = document.getElementById("clause-groups");

const SEVERITY_ORDER = ["critical", "caution", "standard"];
const SEVERITY_LABEL = {
  critical: "Critical",
  caution: "Caution",
  standard: "Standard",
};

scanBtn.addEventListener("click", onScan);
resetBtn.addEventListener("click", onReset);

async function onScan() {
  const text = tcInput.value.trim();
  if (!text) return;

  scanBtn.disabled = true;
  scanBtn.textContent = "Scanning…";

  try {
    const { clauses, truncated } = await scanTerms(text);
    const verdict = computeVerdict(clauses);
    renderResults({ verdict, clauses, truncated });
    inputView.classList.add("view--hidden");
    resultsView.classList.remove("view--hidden");
  } catch (err) {
    console.error(err);
    alert("Something went wrong scanning this text. Please try again.");
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = "Scan";
  }
}

function onReset() {
  tcInput.value = "";
  resultsView.classList.add("view--hidden");
  inputView.classList.remove("view--hidden");
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

/** SPEC.md CAP-3 verdict logic. */
function computeVerdict(clauses) {
  const criticalCount = clauses.filter((c) => c.severity === "critical").length;
  const cautionCount = clauses.filter((c) => c.severity === "caution").length;

  if (criticalCount >= 2) return VERDICT.RECONSIDER;
  if (criticalCount === 1 || cautionCount >= 2) return VERDICT.CAUTION;
  return VERDICT.PROCEED;
}

function renderResults({ verdict, clauses, truncated }) {
  verdictEl.textContent = verdict;
  verdictEl.className = `verdict verdict--${verdictClass(verdict)}`;

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
    section.className = "clause-group";

    const title = document.createElement("div");
    title.className = "clause-group__title";
    title.textContent = SEVERITY_LABEL[severity];
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

  const quote = document.createElement("p");
  quote.className = "clause-card__quote";
  quote.textContent = `"${clause.clause_text}"`;
  card.appendChild(quote);

  const explanation = document.createElement("p");
  explanation.className = "clause-card__explanation";
  explanation.textContent = clause.consequence;
  card.appendChild(explanation);

  if (clause.suggested_action) {
    const action = document.createElement("p");
    action.className = "clause-card__action";
    action.textContent = `Suggested action: ${clause.suggested_action}`;
    card.appendChild(action);
  }

  return card;
}

function verdictClass(verdict) {
  if (verdict === VERDICT.RECONSIDER) return "reconsider";
  if (verdict === VERDICT.CAUTION) return "caution";
  return "proceed";
}

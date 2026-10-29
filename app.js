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
    const result = await scanTerms(text);
    renderResults(result);
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
 * Calls the backend endpoint that runs the single LLM call responsible for
 * extraction, severity classification, plain-English explanation, and
 * suggested actions (see brainstorm-intent.md: Core User Flow / Scope
 * Boundaries). The exact request/response schema is an open decision for
 * bmad-spec / bmad-build to pin down — /api/scan.js currently returns
 * placeholder data so the UI can be built and demoed end-to-end first.
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

function renderResults({ verdict, clauses }) {
  verdictEl.textContent = verdict;

  clauseGroupsEl.innerHTML = "";

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

  const quote = document.createElement("p");
  quote.className = "clause-card__quote";
  quote.textContent = `"${clause.quote}"`;
  card.appendChild(quote);

  const explanation = document.createElement("p");
  explanation.className = "clause-card__explanation";
  explanation.textContent = clause.explanation;
  card.appendChild(explanation);

  if (clause.action) {
    const action = document.createElement("p");
    action.className = "clause-card__action";
    action.textContent = `Suggested action: ${clause.action}`;
    card.appendChild(action);
  }

  return card;
}

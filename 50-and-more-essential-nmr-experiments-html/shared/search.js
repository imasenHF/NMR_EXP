if (!window.NMR_SEARCH_LOADED) {
window.NMR_SEARCH_LOADED = true;

const input = document.querySelector("#search-input");
const status = document.querySelector("#search-status");
const results = document.querySelector("#search-results");
const records = window.NMR_SEARCH_INDEX || [];

function normalize(value) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function excerpt(text, query) {
  const normalizedText = normalize(text);
  const position = normalizedText.indexOf(query);
  const start = Math.max(0, position - 54);
  const end = Math.min(text.length, Math.max(position, 0) + query.length + 92);
  return `${start ? "\u2026" : ""}${text.slice(start, end)}${end < text.length ? "\u2026" : ""}`;
}

function render(matches, query) {
  results.replaceChildren();
  if (!query) {
    status.textContent = "";
    return;
  }
  status.textContent = matches.length ? `\u627e\u5230 ${matches.length} \u4e2a\u9875\u9762\u7ed3\u679c` : "\u672a\u627e\u5230\u5339\u914d\u5185\u5bb9";
  matches.slice(0, 40).forEach((record) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    const title = document.createElement("strong");
    const location = document.createElement("span");
    const summary = document.createElement("p");
    link.href = record.href;
    title.textContent = `${record.experiment} \u00b7 ${record.title}`;
    location.textContent = `\u539f\u4e66 ${record.bookPage} \u00b7 PDF ${record.pdfPage}`;
    summary.textContent = excerpt(record.text, query);
    link.append(title, location, summary);
    item.append(link);
    results.append(item);
  });
}

input.addEventListener("input", () => {
  const query = normalize(input.value);
  if (query.length < 2) {
    render([], "");
    status.textContent = query ? "\u7ee7\u7eed\u8f93\u5165\u4ee5\u5f00\u59cb\u641c\u7d22" : "";
    return;
  }
  const terms = query.split(" ").filter(Boolean);
  const matches = records.filter((record) => {
    const haystack = normalize(`${record.experiment} ${record.title} ${record.text}`);
    return terms.every((term) => haystack.includes(term));
  });
  render(matches, query);
});

const root = document.documentElement;
const displayButton = document.querySelector("#toggle-display-settings");
const displayPanel = document.querySelector("#display-settings");
const zoomOutButton = document.querySelector("#zoom-out");
const zoomInButton = document.querySelector("#zoom-in");
const zoomAutoButton = document.querySelector("#zoom-auto");
const zoomValue = document.querySelector("#zoom-value");
const themeButtons = [...document.querySelectorAll("button[data-theme]")];
const scaleStorageKey = "nmr-interface-scale";
const themeStorageKey = "nmr-interface-theme";
let scaleMode = "auto";
let appliedScale = 1;

function storedValue(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function saveValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The display setting still applies for the current page.
  }
}

function automaticScale() {
  if (window.innerWidth <= 1040) return 1;
  return Math.min(1.2, Math.max(0.95, window.innerWidth / 1800));
}

function applyScale(scale, mode = scaleMode) {
  appliedScale = Math.min(1.4, Math.max(0.8, scale));
  root.style.setProperty("--library-w", `${Math.round(1280 * appliedScale)}px`);
  root.style.setProperty("--library-title", `${(32 * appliedScale).toFixed(1)}px`);
  root.style.setProperty("--library-card-title", `${(21 * appliedScale).toFixed(1)}px`);
  root.style.setProperty("--library-body", `${(14 * appliedScale).toFixed(1)}px`);
  if (zoomValue) zoomValue.textContent = mode === "auto" ? `\u81ea\u52a8 ${Math.round(appliedScale * 100)}%` : `${Math.round(appliedScale * 100)}%`;
  if (zoomAutoButton) zoomAutoButton.setAttribute("aria-pressed", String(mode === "auto"));
}

function setScaleMode(value) {
  if (value === "auto") {
    scaleMode = "auto";
    applyScale(automaticScale(), scaleMode);
    saveValue(scaleStorageKey, scaleMode);
    return;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return;
  scaleMode = String(Math.min(1.4, Math.max(0.8, numeric)));
  applyScale(Number(scaleMode), scaleMode);
  saveValue(scaleStorageKey, scaleMode);
}

function adjustScale(delta) {
  setScaleMode((Math.round((appliedScale + delta) * 10) / 10).toFixed(1));
}

function applyTheme(theme) {
  const selected = ["sage", "mist", "sand", "mauve", "gray"].includes(theme) ? theme : "sage";
  root.dataset.theme = selected;
  themeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.theme === selected)));
  saveValue(themeStorageKey, selected);
}

setScaleMode(storedValue(scaleStorageKey, "auto"));
applyTheme(storedValue(themeStorageKey, "sage"));

displayButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  const willOpen = displayPanel.hidden;
  displayPanel.hidden = !willOpen;
  displayButton.setAttribute("aria-expanded", String(willOpen));
});
displayPanel?.addEventListener("click", (event) => event.stopPropagation());
zoomOutButton?.addEventListener("click", () => adjustScale(-0.1));
zoomInButton?.addEventListener("click", () => adjustScale(0.1));
zoomAutoButton?.addEventListener("click", () => setScaleMode("auto"));
themeButtons.forEach((button) => button.addEventListener("click", () => applyTheme(button.dataset.theme)));

document.addEventListener("click", () => {
  if (!displayPanel || displayPanel.hidden) return;
  displayPanel.hidden = true;
  displayButton?.setAttribute("aria-expanded", "false");
});

let scaleResizeTimer = 0;
window.addEventListener("resize", () => {
  if (scaleMode !== "auto") return;
  window.clearTimeout(scaleResizeTimer);
  scaleResizeTimer = window.setTimeout(() => applyScale(automaticScale(), "auto"), 100);
}, { passive: true });
}

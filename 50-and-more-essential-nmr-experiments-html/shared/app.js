if (!window.NMR_APP_LOADED) {
window.NMR_APP_LOADED = true;

const body = document.body;
const experiment = window.NMR_EXPERIMENT;
const scanButton = document.querySelector("#toggle-original");
const navButton = document.querySelector("#toggle-nav");
const toolbar = document.querySelector(".toolbar");
const sidebar = document.querySelector(".sidebar");
const sidebarActionButton = document.querySelector("button[data-nav-action='toggle']");
const root = document.documentElement;
const displayButton = document.querySelector("#toggle-display-settings");
const displayPanel = document.querySelector("#display-settings");
const zoomOutButton = document.querySelector("#zoom-out");
const zoomInButton = document.querySelector("#zoom-in");
const zoomAutoButton = document.querySelector("#zoom-auto");
const zoomValue = document.querySelector("#zoom-value");
const themeButtons = [...document.querySelectorAll("button[data-theme]")];
const viewButtons = [...document.querySelectorAll("button[data-view]")];
const languageButtons = viewButtons.filter((button) => button.dataset.view !== "original");
const referenceScans = [...document.querySelectorAll(".reference-scan")];

function cloneMappedFigure(figure) {
  const mapped = figure.cloneNode(true);
  mapped.classList.add("mapped-figure");
  mapped.querySelectorAll("img").forEach((image) => {
    image.alt = `\u4e2d\u6587\u680f\u5bf9\u5e94\u56fe\u50cf\uff1a${image.alt || "\u539f\u4e66\u56fe\u50cf"}`;
    image.loading = "lazy";
  });
  const caption = document.createElement("figcaption");
  caption.textContent = mapped.querySelector("img") ? "\u4e2d\u6587\u680f\u5bf9\u5e94\u56fe\u50cf" : "\u4e2d\u6587\u680f\u5bf9\u5e94\u65b9\u7a0b";
  mapped.append(caption);
  return mapped;
}

function mapFigures(page, pageId) {
  const englishPane = page.querySelector(".content-en");
  const chinesePane = page.querySelector(".content-zh");
  const englishFigures = [...englishPane.querySelectorAll("figure")];
  const chineseFigureIds = new Set([...chinesePane.querySelectorAll("figure[data-figure-id]")]
    .map((figure) => figure.dataset.figureId));
  const placements = experiment.figurePlacements[pageId] ?? englishFigures.map((_, source) => ({ source, atEnd: true }));

  for (const { source, before, after, atEnd } of placements) {
    const figure = englishFigures[source];
    if (!figure) continue;
    if (figure.dataset.figureId && chineseFigureIds.has(figure.dataset.figureId)) continue;
    const mapped = cloneMappedFigure(figure);
    const anchors = [...chinesePane.querySelectorAll("h3, p")];
    if (before) {
      const anchor = anchors.find((node) => node.textContent.trim().startsWith(before));
      if (anchor) {
        anchor.before(mapped);
        continue;
      }
    }
    if (after) {
      const anchor = anchors.find((node) => node.textContent.trim().startsWith(after));
      if (anchor) {
        anchor.after(mapped);
        continue;
      }
    }
    if (atEnd || (!before && !after)) chinesePane.append(mapped);
  }
}

function populateExperiment() {
  if (!experiment) return;
  document.querySelectorAll(".page-block").forEach((page) => {
    const pageId = page.id;
    const englishPane = page.querySelector(".content-en");
    const chinesePane = page.querySelector(".content-zh");
    englishPane.innerHTML = experiment.english[pageId] || "<p>English transcription pending.</p>";
    chinesePane.innerHTML = experiment.chinese[pageId] || "<p>\u4e2d\u6587\u7ffb\u8bd1\u5f85\u8865\u3002</p>";
    mapFigures(page, pageId);
  });

  const assetPrefix = body.dataset.assetPrefix || "assets";
  document.querySelectorAll("figure.worksheet img").forEach((image) => {
    image.src = `${assetPrefix}/worksheets/observations-grid.svg`;
    image.alt = "Blank NMR observation grid";
  });
}

function alignLocationHash() {
  if (!window.location.hash) return;
  let targetId;
  try {
    targetId = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    targetId = window.location.hash.slice(1);
  }
  const target = document.getElementById(targetId);
  if (!target) return;

  const align = () => target.scrollIntoView({ block: "start", behavior: "instant" });
  requestAnimationFrame(() => requestAnimationFrame(align));
  window.addEventListener("load", align, { once: true });
  document.fonts?.ready.then(align).catch(() => {});

  // Page fragments and lazy figures are inserted after the browser's native
  // hash jump.  Keep the target aligned briefly while those elements settle.
  if ("ResizeObserver" in window) {
    const paper = document.querySelector(".paper");
    if (paper) {
      const observer = new ResizeObserver(align);
      observer.observe(paper);
      window.setTimeout(() => observer.disconnect(), 1500);
    }
  }
}

const scanObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const image = entry.target;
        if (!image.src && image.dataset.src) image.src = image.dataset.src;
        scanObserver.unobserve(image);
      });
    }, { rootMargin: "900px 0px" })
  : null;

function armReferenceScans() {
  referenceScans.forEach((image) => {
    if (image.src || !image.dataset.src) return;
    if (scanObserver) scanObserver.observe(image);
    else image.src = image.dataset.src;
  });
}

function setOriginalMode(enabled) {
  body.classList.toggle("show-original", enabled);
  scanButton.setAttribute("aria-pressed", String(enabled));
  scanButton.setAttribute("aria-label", enabled ? "\u8fd4\u56de\u91cd\u5efa\u7a3f" : "\u539f\u9875\u5bf9\u7167");
  scanButton.title = enabled ? "\u539f\u9875\u5bf9\u7167 \u00b7 \u5feb\u6377\u952e 3 / O \u5faa\u73af" : "\u539f\u9875\u5bf9\u7167 \u00b7 \u5feb\u6377\u952e 3 / O \u5faa\u73af";
  languageButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(!enabled && button.dataset.view === body.dataset.language));
  });
  if (enabled) armReferenceScans();
}

function setLanguage(mode) {
  const selected = ["en", "bilingual"].includes(mode) ? mode : "en";
  body.classList.remove("show-original");
  scanButton.setAttribute("aria-pressed", "false");
  scanButton.setAttribute("aria-label", "\u539f\u9875\u5bf9\u7167");
  scanButton.title = "\u539f\u9875\u5bf9\u7167 \u00b7 \u5feb\u6377\u952e 3 / O \u5faa\u73af";
  body.dataset.language = selected;
  languageButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.view === selected)));
  localStorage.setItem("nmr-reading-mode", selected);
}

function activateView(view) {
  if (view === "original") {
    setOriginalMode(!body.classList.contains("show-original"));
    return;
  }
  setLanguage(view);
}

function cycleView() {
  if (body.classList.contains("show-original")) {
    setLanguage("en");
    return;
  }
  if (body.dataset.language === "en") {
    setLanguage("bilingual");
    return;
  }
  setOriginalMode(true);
}

populateExperiment();
alignLocationHash();
window.addEventListener("hashchange", alignLocationHash);

const sidebarStateKey = "nmr-sidebar-navigation";

function readSidebarState() {
  try {
    return JSON.parse(sessionStorage.getItem(sidebarStateKey) || "{}");
  } catch {
    return {};
  }
}

function persistSidebarState() {
  if (!sidebar) return;
  const openChapters = [...sidebar.querySelectorAll("details.chapter-group[open]")]
    .map((group) => group.dataset.chapter)
    .filter(Boolean);
  try {
    sessionStorage.setItem(sidebarStateKey, JSON.stringify({
      scrollTop: sidebar.scrollTop,
      openChapters,
    }));
  } catch {
    // Some browser policies disable storage for local files; navigation still works.
  }
}

function restoreSidebarState() {
  if (!sidebar) return;
  const state = readSidebarState();
  const openChapters = new Set(Array.isArray(state.openChapters) ? state.openChapters : []);
  sidebar.querySelectorAll("details.chapter-group").forEach((group) => {
    if (openChapters.has(group.dataset.chapter) || group.classList.contains("active-chapter")) group.open = true;
    group.addEventListener("toggle", () => {
      persistSidebarState();
      updateNavToggleButton();
    });
  });

  requestAnimationFrame(() => {
    updateNavToggleButton();
    if (Number.isFinite(state.scrollTop)) {
      sidebar.scrollTop = state.scrollTop;
      return;
    }
    const activeLink = sidebar.querySelector("a.active");
    if (activeLink) sidebar.scrollTop = Math.max(0, activeLink.offsetTop - sidebar.clientHeight / 2);
  });

  let scrollTimer = 0;
  sidebar.addEventListener("scroll", () => {
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(persistSidebarState, 80);
  }, { passive: true });
}

restoreSidebarState();

function updateNavToggleButton() {
  if (!sidebar || !sidebarActionButton) return;
  const groups = [...sidebar.querySelectorAll("details.chapter-group")];
  const allOpen = groups.length > 0 && groups.every((group) => group.open);
  const label = allOpen ? "\u6536\u62e2\u6240\u6709\u7ae0\u8282" : "\u5c55\u5f00\u6240\u6709\u7ae0\u8282";
  sidebarActionButton.dataset.state = allOpen ? "collapse" : "expand";
  sidebarActionButton.setAttribute("aria-label", label);
  sidebarActionButton.title = label;
}

sidebarActionButton?.addEventListener("click", () => {
  const groups = [...sidebar.querySelectorAll("details.chapter-group")];
  const shouldOpen = !groups.every((group) => group.open);
  groups.forEach((group) => {
    group.open = shouldOpen;
  });
  persistSidebarState();
  updateNavToggleButton();
});

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
  root.style.setProperty("--sidebar-w", `${Math.round(340 * appliedScale)}px`);
  root.style.setProperty("--page-w", `${Math.round(1180 * appliedScale)}px`);
  root.style.setProperty("--reader-font", `${(15 * appliedScale).toFixed(1)}px`);
  root.style.setProperty("--reader-heading", `${(20 * appliedScale).toFixed(1)}px`);
  root.style.setProperty("--reader-title", `${(34 * appliedScale).toFixed(1)}px`);
  root.style.setProperty("--sidebar-font", `${(13 * appliedScale).toFixed(1)}px`);
  root.style.setProperty("--sidebar-small", `${(11 * appliedScale).toFixed(1)}px`);
  root.style.setProperty("--paper-pad", `${Math.round(44 * appliedScale)}px`);
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

toolbar.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-view]");
  if (!button || !toolbar.contains(button)) return;
  event.preventDefault();
  activateView(button.dataset.view);
});

navButton.addEventListener("click", () => {
  const open = body.classList.toggle("nav-open");
  navButton.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".sidebar a").forEach((link) => link.addEventListener("click", () => {
  persistSidebarState();
  body.classList.remove("nav-open");
  navButton.setAttribute("aria-expanded", "false");
}));

document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === "1") setLanguage("en");
  if (event.key === "2") setLanguage("bilingual");
  if (event.key === "3") setOriginalMode(true);
  if (event.key.toLowerCase() === "o") cycleView();
});

setLanguage(localStorage.getItem("nmr-reading-mode") || "en");
}

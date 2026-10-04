(() => {
  "use strict";

  const data = window.READER_DOCUMENT;
  if (!data) return;

  const root = document.documentElement;
  const body = document.body;
  const meta = data.meta || {};
  const byId = (id) => document.getElementById(id);
  const setText = (id, value) => { if (value != null && byId(id)) byId(id).textContent = value; };

  document.title = meta.titleZh ? `${meta.title} | ${meta.titleZh}` : (meta.title || document.title);
  setText("reader-eyebrow", meta.eyebrow || "TECHNICAL READER");
  setText("reader-title", meta.title || "HTML 阅读器");
  setText("reader-subtitle", meta.subtitle || "");
  setText("reader-section-label", meta.eyebrow || "READING EDITION");
  setText("reader-heading", meta.titleZh ? `${meta.title} · ${meta.titleZh}` : meta.title);
  setText("reader-description", meta.description || "");

  const navigation = byId("reader-navigation");
  const createLink = (item) => {
    const link = document.createElement("a");
    link.href = item.href || `#${item.id}`;
    link.className = item.id === meta.id ? "active" : "";
    link.innerHTML = `<span>${item.number || "·"}</span><strong>${item.title || ""}</strong>`;
    if (item.titleZh) link.setAttribute("title", item.titleZh);
    return link;
  };
  (data.navigation || []).forEach((item) => {
    if (!Array.isArray(item.items)) { navigation.append(createLink(item)); return; }
    const group = document.createElement("details");
    group.className = "chapter-group";
    group.dataset.chapter = item.id || item.number || "group";
    const summary = document.createElement("summary");
    summary.innerHTML = `<span>${item.number || "·"}</span><strong>${item.title || ""}</strong><b aria-hidden="true">+</b>`;
    if (item.titleZh) summary.title = item.titleZh;
    const links = document.createElement("div");
    links.className = "chapter-links";
    item.items.forEach((entry) => links.append(createLink(entry)));
    group.append(summary, links);
    navigation.append(group);
  });

  const paper = byId("reader-paper");
  (data.pages || []).forEach((page) => {
    const block = document.createElement("section");
    block.className = "page-block";
    block.id = page.id;
    block.innerHTML = `<div class="page-marker">${page.bookPage != null ? `印刷页 ${page.bookPage}` : ""}${page.pdfPage != null ? ` · PDF ${page.pdfPage}` : ""}</div><div class="content-pane">${page.html || ""}</div>`;
    paper.append(block);
  });

  function alignHash() {
    if (!location.hash) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "instant" }));
  }
  window.addEventListener("hashchange", alignHash);
  window.addEventListener("load", alignHash, { once: true });

  const sidebar = document.querySelector(".sidebar");
  const navButton = byId("toggle-nav");
  const navToggle = document.querySelector("button[data-nav-action='toggle']");
  const navKey = "reader-sidebar-navigation";
  const closeMobileNav = () => { body.classList.remove("nav-open"); navButton?.setAttribute("aria-expanded", "false"); };
  navButton?.addEventListener("click", () => {
    const open = body.classList.toggle("nav-open");
    navButton.setAttribute("aria-expanded", String(open));
  });
  const groups = [...navigation.querySelectorAll("details.chapter-group")];
  const updateNavToggle = () => {
    const allOpen = groups.length > 0 && groups.every((group) => group.open);
    navToggle?.setAttribute("aria-label", allOpen ? "收起所有章节" : "展开所有章节");
    navToggle?.setAttribute("title", allOpen ? "收起所有章节" : "展开所有章节");
  };
  navToggle?.addEventListener("click", () => {
    const shouldOpen = !groups.every((group) => group.open);
    groups.forEach((group) => { group.open = shouldOpen; });
    updateNavToggle();
  });
  try {
    const savedGroups = new Set(JSON.parse(sessionStorage.getItem(`${navKey}-groups`) || "[]"));
    groups.forEach((group) => {
      if (savedGroups.has(group.dataset.chapter) || group.querySelector("a.active")) group.open = true;
      group.addEventListener("toggle", () => {
        try { sessionStorage.setItem(`${navKey}-groups`, JSON.stringify(groups.filter((entry) => entry.open).map((entry) => entry.dataset.chapter))); } catch {}
        updateNavToggle();
      });
    });
  } catch {}
  updateNavToggle();
  sidebar?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMobileNav));
  try { sidebar.scrollTop = Number(sessionStorage.getItem(navKey) || 0); } catch {}
  sidebar?.addEventListener("scroll", () => { try { sessionStorage.setItem(navKey, String(sidebar.scrollTop)); } catch {} }, { passive: true });

  const displayButton = byId("toggle-display-settings");
  const displayPanel = byId("display-settings");
  const zoomValue = byId("zoom-value");
  const zoomAuto = byId("zoom-auto");
  const scaleKey = "reader-interface-scale";
  const themeKey = "reader-interface-theme";
  let scaleMode = "auto";
  let appliedScale = 1;
  const stored = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const automaticScale = () => window.innerWidth <= 1040 ? 1 : Math.min(1.2, Math.max(.95, window.innerWidth / 1800));
  function applyScale(scale, mode = scaleMode) {
    appliedScale = Math.min(1.4, Math.max(.8, scale));
    root.style.setProperty("--sidebar-w", `${Math.round(300 * appliedScale)}px`);
    root.style.setProperty("--page-w", `${Math.round(980 * appliedScale)}px`);
    root.style.setProperty("--reader-font", `${(15 * appliedScale).toFixed(1)}px`);
    root.style.setProperty("--reader-title", `${(31 * appliedScale).toFixed(1)}px`);
    root.style.setProperty("--paper-pad", `${Math.round(42 * appliedScale)}px`);
    if (zoomValue) zoomValue.textContent = mode === "auto" ? `自动 ${Math.round(appliedScale * 100)}%` : `${Math.round(appliedScale * 100)}%`;
    zoomAuto?.setAttribute("aria-pressed", String(mode === "auto"));
  }
  function setScale(value) {
    if (value === "auto") { scaleMode = "auto"; applyScale(automaticScale()); save(scaleKey, scaleMode); return; }
    const numeric = Number(value); if (!Number.isFinite(numeric)) return;
    scaleMode = String(Math.min(1.4, Math.max(.8, numeric))); applyScale(numeric, scaleMode); save(scaleKey, scaleMode);
  }
  const adjustScale = (delta) => setScale((Math.round((appliedScale + delta) * 10) / 10).toFixed(1));
  function applyTheme(theme) {
    const selected = ["sage", "mist", "sand", "mauve", "gray"].includes(theme) ? theme : "sage";
    root.dataset.theme = selected;
    document.querySelectorAll("button[data-theme]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.theme === selected)));
    save(themeKey, selected);
  }
  displayButton?.addEventListener("click", (event) => { event.stopPropagation(); const open = displayPanel.hidden; displayPanel.hidden = !open; displayButton.setAttribute("aria-expanded", String(open)); });
  displayPanel?.addEventListener("click", (event) => event.stopPropagation());
  document.addEventListener("click", () => { if (displayPanel && !displayPanel.hidden) { displayPanel.hidden = true; displayButton?.setAttribute("aria-expanded", "false"); } });
  byId("zoom-out")?.addEventListener("click", () => adjustScale(-.1));
  byId("zoom-in")?.addEventListener("click", () => adjustScale(.1));
  zoomAuto?.addEventListener("click", () => setScale("auto"));
  document.querySelectorAll("button[data-theme]").forEach((button) => button.addEventListener("click", () => applyTheme(button.dataset.theme)));
  setScale(stored(scaleKey, "auto"));
  applyTheme(stored(themeKey, "sage"));
  let resizeTimer = 0;
  window.addEventListener("resize", () => { if (scaleMode === "auto") { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => applyScale(automaticScale(), "auto"), 100); } }, { passive: true });
})();

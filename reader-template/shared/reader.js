(() => {
  "use strict";
  const data = window.READER_DOCUMENT;
  if (!data) return;
  const body = document.body;
  const root = document.documentElement;
  const meta = data.meta || {};
  const $ = (selector) => document.querySelector(selector);
  const setText = (selector, value) => { const node = $(selector); if (node && value != null) node.textContent = value; };

  document.title = meta.titleZh ? `${meta.title} | ${meta.titleZh}` : (meta.title || document.title);
  setText("#reader-title", meta.title || "HTML 阅读器");
  setText("#reader-subtitle", meta.subtitle || "");
  setText("#reader-label", meta.label || (meta.number ? `Chapter ${meta.number}` : "Reading edition"));
  setText("#item-title", meta.titleZh ? `${meta.title} · ${meta.titleZh}` : meta.title);
  setText("#reader-range", meta.range || meta.chapter || "");

  const tree = $("#reader-navigation");
  const navKey = "reader-sidebar-navigation";
  const createLink = (item) => {
    const link = document.createElement("a");
    link.href = item.href || `#${item.id}`;
    link.className = item.id === meta.id ? "active" : "";
    if (item.id === meta.id) link.setAttribute("aria-current", "page");
    link.innerHTML = `<span>${item.number || "·"}</span><span>${item.title || ""}</span>`;
    if (item.titleZh) link.title = item.titleZh;
    return link;
  };
  (data.navigation || []).forEach((chapter) => {
    if (!Array.isArray(chapter.items)) { tree.append(createLink(chapter)); return; }
    const group = document.createElement("details");
    group.className = "chapter-group";
    group.dataset.chapter = chapter.id || chapter.number || "chapter";
    if (chapter.items.some((item) => item.id === meta.id)) group.classList.add("active-chapter");
    const summary = document.createElement("summary");
    summary.innerHTML = `<span>${chapter.number ? `第 ${chapter.number} 章` : "章节"}</span><small>${chapter.title || ""}</small>`;
    if (chapter.titleZh) summary.title = chapter.titleZh;
    const list = document.createElement("ol");
    chapter.items.forEach((item) => { const li = document.createElement("li"); li.append(createLink(item)); list.append(li); });
    group.append(summary, list);
    tree.append(group);
  });

  const paper = $("#reader-paper");
  (data.pages || []).forEach((page) => {
    const block = document.createElement("section");
    block.className = "page-block";
    block.id = page.id;
    block.dataset.pdf = page.pdfPage ?? "";
    block.dataset.book = page.bookPage ?? "";
    block.innerHTML = `<span class="page-marker">${page.bookPage != null ? `原书第 ${page.bookPage} 页` : ""}${page.pdfPage != null ? ` · PDF 第 ${page.pdfPage} 页` : ""}</span><div class="content-pane">${page.html || ""}</div>`;
    paper.append(block);
  });

  function alignLocationHash() {
    if (!location.hash) return;
    let id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch {}
    const target = document.getElementById(id);
    if (!target) return;
    requestAnimationFrame(() => requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "instant" })));
  }
  window.addEventListener("hashchange", alignLocationHash);
  window.addEventListener("load", alignLocationHash, { once: true });

  const sidebar = $(".sidebar");
  const navButton = $("#toggle-nav");
  const navAction = $("button[data-nav-action='toggle']");
  const groups = [...document.querySelectorAll("details.chapter-group")];
  const updateNavAction = () => {
    const allOpen = groups.length > 0 && groups.every((group) => group.open);
    navAction?.setAttribute("data-state", allOpen ? "collapse" : "expand");
    navAction?.setAttribute("aria-label", allOpen ? "收起所有章节" : "展开所有章节");
    navAction?.setAttribute("title", allOpen ? "收起所有章节" : "展开所有章节");
  };
  navAction?.addEventListener("click", () => {
    const open = !groups.every((group) => group.open);
    groups.forEach((group) => { group.open = open; });
    updateNavAction();
  });
  try {
    const saved = JSON.parse(sessionStorage.getItem(`${navKey}-groups`) || "[]");
    groups.forEach((group) => {
      if (saved.includes(group.dataset.chapter) || group.classList.contains("active-chapter")) group.open = true;
      group.addEventListener("toggle", () => {
        try { sessionStorage.setItem(`${navKey}-groups`, JSON.stringify(groups.filter((entry) => entry.open).map((entry) => entry.dataset.chapter))); } catch {}
        updateNavAction();
      });
    });
  } catch {}
  updateNavAction();
  navButton?.addEventListener("click", () => { const open = body.classList.toggle("nav-open"); navButton.setAttribute("aria-expanded", String(open)); });
  sidebar?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => { body.classList.remove("nav-open"); navButton?.setAttribute("aria-expanded", "false"); }));
  try { sidebar.scrollTop = Number(sessionStorage.getItem(navKey) || 0); } catch {}
  sidebar?.addEventListener("scroll", () => { try { sessionStorage.setItem(navKey, String(sidebar.scrollTop)); } catch {} }, { passive: true });

  const displayButton = $("#toggle-display-settings");
  const displayPanel = $("#display-settings");
  const zoomValue = $("#zoom-value");
  const autoButton = $("#zoom-auto");
  const scaleKey = "nmr-interface-scale";
  const themeKey = "nmr-interface-theme";
  let scaleMode = "auto";
  let appliedScale = 1;
  const stored = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const automaticScale = () => window.innerWidth <= 1040 ? 1 : Math.min(1.2, Math.max(.95, window.innerWidth / 1800));
  function applyScale(scale, mode = scaleMode) {
    appliedScale = Math.min(1.4, Math.max(.8, scale));
    root.style.setProperty("--sidebar-w", `${Math.round(340 * appliedScale)}px`);
    root.style.setProperty("--page-w", `${Math.round(1180 * appliedScale)}px`);
    root.style.setProperty("--reader-font", `${(15 * appliedScale).toFixed(1)}px`);
    root.style.setProperty("--reader-heading", `${(20 * appliedScale).toFixed(1)}px`);
    root.style.setProperty("--reader-title", `${(34 * appliedScale).toFixed(1)}px`);
    root.style.setProperty("--sidebar-font", `${(13 * appliedScale).toFixed(1)}px`);
    root.style.setProperty("--sidebar-small", `${(11 * appliedScale).toFixed(1)}px`);
    root.style.setProperty("--paper-pad", `${Math.round(44 * appliedScale)}px`);
    if (zoomValue) zoomValue.textContent = mode === "auto" ? `自动 ${Math.round(appliedScale * 100)}%` : `${Math.round(appliedScale * 100)}%`;
    autoButton?.setAttribute("aria-pressed", String(mode === "auto"));
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
  $("#zoom-out")?.addEventListener("click", () => adjustScale(-.1));
  $("#zoom-in")?.addEventListener("click", () => adjustScale(.1));
  autoButton?.addEventListener("click", () => setScale("auto"));
  document.querySelectorAll("button[data-theme]").forEach((button) => button.addEventListener("click", () => applyTheme(button.dataset.theme)));
  setScale(stored(scaleKey, "auto"));
  applyTheme(stored(themeKey, "sage"));
  let resizeTimer = 0;
  window.addEventListener("resize", () => { if (scaleMode === "auto") { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => applyScale(automaticScale(), "auto"), 100); } }, { passive: true });
})();

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
  // The translated figure caption is already a separate aligned paragraph.
  // Avoid inserting a redundant placeholder caption under only one image.
  return mapped;
}

function mapFigures(page, pageId) {
  const englishPane = page.querySelector(".content-en");
  const chinesePane = page.querySelector(".content-zh");
  const englishFigures = [...englishPane.children].filter((node) => node.tagName === "FIGURE");
  const chineseBlocks = [...chinesePane.children].filter((node) => node.matches("p, h3"));
  const oldPlacements = experiment.figurePlacements[pageId] || [];

  for (const [source, figure] of englishFigures.entries()) {
    const mapped = cloneMappedFigure(figure);
    // Original English figures sit between indexed text blocks. Insert their
    // Chinese counterparts at the SAME boundary; the next block is commonly
    // the translated caption, but on cover/opening pages it may be a heading.
    // This remains valid when caption wording changes after technical editing.
    let next = figure.nextElementSibling;
    while (next && !next.matches("p, h3")) next = next.nextElementSibling;
    const matched = next && chineseBlocks[Number(next.dataset.alignIndex)];
    if (matched) {
      matched.before(mapped);
      continue;
    }

    // Old textual anchors are a fallback for exceptional non-parallel pages.
    const { before, after } = oldPlacements.find((entry) => entry.source === source) || {};
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
    // No corresponding text follows a figure on this page.
    chinesePane.append(mapped);
  }
}

// Normalize OCR-exported parameter lists into compact borderless tables.
const parameterNames = new Set(["PULPROG", "NS", "DS", "PL0", "P11", "SPNAM1", "SP1", "RG", "D9", "D11", "D14", "TD0", "P1/PL1", "P6/PL10", "P11/SP1", "P17", "VDLIST", "SPOFFS1", "P12", "SP2", "SPNAM2", "SPOFFS2", "GPNAM1", "GPZ1", "GPZ2", "P16", "D8", "SI", "LB", "SW", "D1", "TD", "SI (F1)", "SI (F2)", "WDW (F2)", "EM", "LB (F2)", "PH_mod (F2)", "PH_mod (F1)", "GPNAME\u00d7", "GPNAMEX", "GPZ6", "GPZ7", "GPZ8", "P19", "P30"]);
const nonParameterHeadings = new Set(["OVERVIEW", "ACTIVITIES", "SUMMARY", "REFERENCE", "ACQUISITION", "INTRODUCTION", "NOESY", "COSY", "COLOC", "HETCOR", "1H", "13C", "15N", "Z", "X", "A", "B*", "C*", "D*", "E", "F", "G*", "H*", "I", "J", "K*", "L*", "M"]);

function looksLikeParameter(heading) {
  const text = heading.textContent.trim();
  if (parameterNames.has(text) || nonParameterHeadings.has(text)) return parameterNames.has(text);
  if (/[\u3400-\u9fff]/.test(text)) {
    if (/[\u3002\uff01\uff1f\uff1a\uff0c]|^(\u7b2c|\u9644\u5f55|\u7ae0\u8282|\u603b\u7ed3|\u6982\u8ff0|\u5b9e\u9a8c|\u6d3b\u52a8|\u4f7f\u7528|\u9009\u62e9\u6027|\u573a\u5730|\u68af\u5ea6|\u8109\u51b2|\u6821\u51c6|\u8def\u7531|\u5904\u7406|\u8c31|\u65b9\u6cd5|\u6837\u54c1|\u4eea\u5668)/.test(text)) return false;
    const next = heading.nextElementSibling;
    return Boolean(next?.tagName === "P" && next.textContent.trim().length <= 140);
  }
  if (!/^[A-Z0-9][A-Z0-9_./,:+\u00d7\u2212()\[\] -]*$/.test(text) || text.length > 24) return false;
  if (/^(?:CHAPTER|PART|APPENDIX|FIELD|SPECTROMETER|TUNING|PROBE|PULSE|LEVEL|USING|ORDERED|DIFFUSION|SELECTIVE|MULTIPLE|HOMONUCLEAR|HETERONUCLEAR|POLARIZATION|INTRODUCTION|EXPERIMENTS?)(?:\b|\u2014)/.test(text)) return false;
  const next = heading.nextElementSibling;
  if (next?.tagName === "P") {
    const value = next.textContent.trim();
    if (value.length > 180 && !/^(?:Use|From|Set|Check|Normal|The values|Power level)/.test(value)) return false;
  }
  return true;
}

// A few PDF tables are exported in reading order rather than row order.  For
// example, the source page for the T1-IR experiment arrives as
// `FnMODE`, `QF`, `TD (F2)`, `16K`, ... with the value cells represented as
// headings.  Keep the source fragments untouched, but normalize both the
// normal key/paragraph form and this alternating key/value form at runtime.
const parameterValueHeadings = new Set([
  "QF", "QSIM", "QSEQ", "EM", "GM", "QSINE", "SINE.50", "SINE.100",
  "1H", "13C", "15N", "16K", "32K", "64K", "128K", "256K", "4K", "2K",
]);

function parameterText(node) {
  return node?.textContent.trim().replace(/[\uff1a:]$/, "") || "";
}

function isParameterKeyText(value) {
  const text = value.trim().replace(/[\uff1a:]$/, "");
  if (!text || parameterValueHeadings.has(text) || nonParameterHeadings.has(text)) return false;
  if (parameterNames.has(text)) return true;
  // Bruker acquisition/processing parameter families.  This intentionally
  // excludes ordinary all-caps experiment names (DQF-COSY, NOESY, etc.).
  return /^(?:PULPROG|FnMODE|(?:P|D|G|PL|SP|GPZ|P\d+\/PL|P\d+\/SP|GPNAM|SPNAM|SPOFFS|CPDPRG|PCPD|CNST|NUC|O\dP?|TD|SI|SW|SF|SWH|AQ|LB|WDW|PHC|PH_mod|BC_mod|SR|FCOR|MC|SSB|RG|NS|DS|DIGMOD|HDDUTY|ZGOPTNS|FILENAME|DISK|USER|GSHIM|VDLIST|TE\d+|SHIMGROUP|ND_\d+|CPD)(?:[A-Z0-9_./,()\[\] -]*)?)$/i.test(text);
}

function isParameterNode(node) {
  if (!node || !["H3", "P"].includes(node.tagName)) return false;
  const text = parameterText(node);
  if (node.tagName === "P" && text.length > 32) return false;
  return isParameterKeyText(text);
}

function isNumberedInstruction(node) {
  return /^\s*\d+\.\s/.test(node?.textContent || "");
}

function isValueHeading(node) {
  if (!node || !["H3", "P"].includes(node.tagName)) return false;
  const text = parameterText(node);
  if (!text || isNumberedInstruction(node)) return false;
  if (parameterValueHeadings.has(text)) return true;
  if (/^(?:[-+]?\d|\.\d|\d+\s*(?:k|K|Hz|ms|us|\u03bcs|s|dB|ppm|%|\u00b0|MHz|MHz|mM|M)\b)/.test(text)) return true;
  return node.tagName === "H3" && !isParameterKeyText(text) && /^[A-Z0-9][A-Z0-9 .(),/%+\-]*$/.test(text) && text.length <= 28;
}

function formatParameterTables(pane) {
  // First convert heading-shaped value cells to paragraphs. This makes the
  // row parser deterministic for both FnMODE -> QF and TD (F2) -> 16K
  // reading-order exports.
  [...pane.children].forEach((node) => {
    if (!isParameterNode(node)) return;
    const next = node.nextElementSibling;
    if (!isValueHeading(next)) return;
    const value = document.createElement("p");
    value.innerHTML = next.innerHTML;
    next.replaceWith(value);
  });
  let cursor = pane.firstElementChild;
  while (cursor) {
    // A final value cell is occasionally emitted immediately before its key
    // cell (SP1 followed by \u201c75 dB\u201d, for example).  Re-associate that short
    // numeric/unit paragraph with the following parameter key.
    if (cursor.tagName === "P" && cursor.previousElementSibling?.classList.contains("parameter-table") && isValueHeading(cursor) && isParameterNode(cursor.nextElementSibling)) {
      const keyNode = cursor.nextElementSibling;
      const table = document.createElement("div");
      table.className = "parameter-table";
      cursor.before(table);
      const key = document.createElement("div");
      key.className = "parameter-key";
      key.textContent = parameterText(keyNode);
      const value = document.createElement("div");
      value.className = "parameter-value";
      value.innerHTML = cursor.innerHTML;
      table.append(key, value);
      cursor.remove();
      keyNode.remove();
      cursor = table.nextElementSibling;
      continue;
    }
    if (!isParameterNode(cursor)) { cursor = cursor.nextElementSibling; continue; }

    const table = document.createElement("div");
    table.className = "parameter-table";
    table.dataset.alignIndex = cursor.dataset.alignIndex || "";
    cursor.before(table);

    // Consume one contiguous parameter run.  A row may be key + paragraph,
    // key + value-heading, or a key with no value (when the PDF omitted it).
    while (cursor && isParameterNode(cursor)) {
      const keyText = parameterText(cursor);
      const next = cursor.nextElementSibling;
      let valueNode = null;
      if (next && next.tagName === "P" && !isNumberedInstruction(next)) {
        valueNode = next;
      } else if (isValueHeading(next)) {
        valueNode = next;
      }

      const key = document.createElement("div");
      key.className = "parameter-key";
      key.textContent = keyText;
      const value = document.createElement("div");
      value.className = "parameter-value";
      if (valueNode) value.innerHTML = valueNode.innerHTML;
      table.append(key, value);

      cursor.remove();
      if (valueNode) valueNode.remove();
      cursor = table.nextElementSibling;
    }

    // Some tables export their last value immediately before the key. Fold
    // that reversed pair into the current table instead of leaving an empty
    // parameter heading below it.
    if (cursor?.tagName === "P" && !isNumberedInstruction(cursor) && isParameterNode(cursor.nextElementSibling)) {
      const keyNode = cursor.nextElementSibling;
      const key = document.createElement("div");
      key.className = "parameter-key";
      key.textContent = parameterText(keyNode);
      const value = document.createElement("div");
      value.className = "parameter-value";
      value.innerHTML = cursor.innerHTML;
      table.append(key, value);
      cursor.remove();
      keyNode.remove();
      cursor = table.nextElementSibling;
    }
    // Keep a short explanatory paragraph attached to the table when it
    // follows a parameter run, but never swallow the next numbered step.
    if (cursor?.tagName === "P" && !isNumberedInstruction(cursor) && cursor.textContent.trim().length <= 180
      && !/^(?:All other|\u6240\u6709\u5176\u4ed6|\u5176\u4ed6\u53c2\u6570|Note:|\u6ce8\u610f[:\uff1a]|\u6ce8[:\uff1a]|Acquire|\u91c7\u96c6\u8c31\u56fe)/i.test(cursor.textContent.trim())) {
      const note = document.createElement("div");
      note.className = "parameter-note";
      note.innerHTML = cursor.innerHTML;
      table.append(note);
      cursor.remove();
      cursor = table.nextElementSibling;
    }
  }
}

function formatInlineParameterLists(pane) {
  // Some appendix pulse-program lists are extracted as one semicolon-delimited
  // paragraph (for example \u201c;pl1: ... ;pl9: ... ;sp1: ...\u201d).  Turn those
  // lists into the same two-column table used by ordinary parameter blocks.
  [...pane.querySelectorAll("p")].forEach((paragraph) => {
    const text = paragraph.textContent;
    const matches = [...text.matchAll(/(?:^|;\s*)([A-Za-z][A-Za-z0-9_]*(?:\[\%\])?)\s*:\s*/g)]
      .filter((match) => isParameterKeyText(match[1]));
    if (matches.length < 3) return;

    const table = document.createElement("div");
    table.className = "parameter-table";
    table.dataset.alignIndex = paragraph.dataset.alignIndex || "";
    matches.forEach((match, index) => {
      const start = match.index + match[0].length;
      const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
      const valueText = text.slice(start, end).replace(/;\s*$/, "").trim();
      const key = document.createElement("div");
      key.className = "parameter-key";
      key.textContent = match[1].toUpperCase();
      const value = document.createElement("div");
      value.className = "parameter-value";
      value.textContent = valueText;
      table.append(key, value);
    });
    paragraph.before(table);
    paragraph.remove();
  });
}

function formatStepBreaks(pane) {
  // Both languages need the same step boundaries. Work on text nodes so
  // inline <code>, <sup> and links survive unchanged; reject citations and
  // decimal numbers instead of applying a Latin-only innerHTML expression.
  pane.querySelectorAll("p").forEach((paragraph) => {
    if (paragraph.classList.contains("figure-caption")) return;
    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (node.parentElement?.closest("code, a, sub, sup")) return;
      const source = node.textContent;
      const positions = [];
      for (const match of source.matchAll(/(?:\d{1,2}|[a-h])\.(?=\s|[\u3400-\u9fff\u201cA-Z])/gi)) {
        const before = source.slice(0, match.index);
        if (!before || !/[\s\u3002\uff01\uff1f\uff1b;.!?]/.test(before.at(-1))) continue;
        if (/(?:step|steps|figure|chapter|part|section|no|fig|\u6b65\u9aa4|\u7b2c|\u56fe)\s*$/i.test(before)) continue;
        if (/\d+\.\s*$/.test(before)) continue;
        positions.push(match.index);
      }
      if (!positions.length) return;
      const fragment = document.createDocumentFragment();
      let start = 0;
      positions.forEach((position) => {
        fragment.append(document.createTextNode(source.slice(start, position).replace(/\s+$/, "")));
        fragment.append(document.createElement("br"));
        start = position;
      });
      fragment.append(document.createTextNode(source.slice(start)));
      node.replaceWith(fragment);
    });
  });
}

function formatCodePage(pane, pageId) {
  if (pageId !== "source-21") return;
  pane.querySelectorAll("h3").forEach((heading) => {
    if (/^(GETCURDATA|II|LOPO|LOCK|QUIT)$/.test(heading.textContent.trim())) { heading.classList.add("code-command"); heading.innerHTML = `<code>${heading.textContent.trim()}</code>`; }
  });
  pane.querySelectorAll("p").forEach((paragraph) => {
    if (/^\s*(\/\*|char solvent)|FETCHPAR|STOREPAR|RSH\(/.test(paragraph.textContent)) paragraph.classList.add("code-line");
  });
}

function formatKnownFormulas(pane, pageId) {
  if (pageId !== "source-113") return;
  pane.querySelectorAll("p").forEach((paragraph) => {
    const text = paragraph.textContent.trim();
    if (/^A\s*5\s*A0/.test(text)) paragraph.innerHTML = "A = A<sub>0</sub>N C I(\u03b8) sin \u03b8";
    if (/^As=Ar\s*5/.test(text)) paragraph.innerHTML = "A<sub>s</sub>/A<sub>r</sub> = N<sub>s</sub>C<sub>s</sub>/(N<sub>r</sub>C<sub>r</sub>)";
  });
  if (pageId === "source-15") {
    const caption = pane.querySelector(".figure-caption");
    if (caption) caption.textContent = "Figure 1.2 \u00b9H lineshape test of a 0.1% CHCl\u2083/acetone-d\u2086 sample recorded on a Bruker AV-III 800 MHz spectrometer equipped with a TXI probe at 298 K. The nonspinning linewidth at \u00bd-height, 0.55% and 0.11% height is measured using humpcal as 0.58, 5.6, and 11.8 Hz. The manual measurement of the linewidth and approximately 0.55% height is also shown. The cursor information displays \u2018Value = 0.56 rel\u2019; this is the datapoint height relative to the peak height (cy), set to 100 cm. When measuring lineshape by hand, use a close height or interpolate between adjacent points. Low-frequency (<10 Hz) noise from floor vibration is visible at the base of the peak.";
  }
}

function formatKnownTranscriptions(pane, pageId) {
  // Restore a handful of high-impact OCR substitutions that otherwise make
  // parameter instructions or equations read incorrectly in every language
  // view.  These are source-level text repairs, not translation changes.
  if (pageId === "source-49") pane.innerHTML = pane.innerHTML.replace(/xyz\s+5\s+your initials/g, "xyz = your initials");
  if (pageId === "source-52") pane.innerHTML = pane.innerHTML.replace(/13C\s+5\s+F2/g, "13C = F2");
  if (pageId === "source-72") {
    pane.innerHTML = pane.innerHTML
      .replace(/GPZ2[^A-Za-z0-9]+AQ/g, "GPZ2 \u00d7 AQ")
      .replace(/GPZ1[^A-Za-z0-9]+D27/g, "GPZ1 \u00d7 D27")
      .replace(/\)\s+5\s+\(0\.2\)[^A-Za-z0-9]+/g, ") = (0.2) \u00d7 ");
  }
  if (pageId === "source-128") {
    pane.innerHTML = pane.innerHTML
      .replace(/1\.93\s+1029\s+m2\/s/g, "1.93 \u00d7 10<sup>\u22129</sup> m<sup>2</sup>/s")
      .replace(/2\.3\s+1029\s+m2\/s/g, "2.3 \u00d7 10<sup>\u22129</sup> m<sup>2</sup>/s");
  }
}

function formatContinuations(pane, pageId) {
  const firstParagraph = pane.querySelector("p");
  if (pageId === "source-15" && firstParagraph) firstParagraph.classList.add("continuation");
  if (firstParagraph && /^(?:and|or|but|which|where|while|back|current|then|this|these|those)\b/i.test(firstParagraph.textContent.trim())) {
    firstParagraph.classList.add("continuation");
  }
  if (pageId === "source-14") {
    const paragraphs = [...pane.querySelectorAll("p")];
    paragraphs.filter((paragraph) => /^\s*(back 500|c\.\s*XY)/i.test(paragraph.textContent)).forEach((paragraph) => paragraph.classList.add("continuation"));
  }
  if (pageId === "source-22") {
    const first = pane.querySelector("p");
    if (first && /^\s*current experiment/i.test(first.textContent)) first.classList.add("continuation");
  }
}

function markAlignmentBlocks(pane) {
  [...pane.children].filter((node) => node.matches("p, h3")).forEach((node, index) => {
    node.dataset.alignIndex = String(index);
  });
}

function alignBilingualPages() {
  document.querySelectorAll(".page-block").forEach((page) => {
    const left = page.querySelector(".content-en");
    const right = page.querySelector(".content-zh");
    const all = [...left.children, ...right.children];
    all.forEach((node) => {
      if (node.dataset.alignmentMargin !== undefined) {
        node.style.marginTop = "";
        delete node.dataset.alignmentMargin;
      }
    });
    page.querySelectorAll(".parameter-table").forEach((table) => { table.style.gridTemplateRows = ""; });
    if (body.dataset.language !== "bilingual" || body.classList.contains("show-original") || window.innerWidth <= 640) return;

    // A translated page with differently ordered heading/value cells cannot
    // safely be synchronized by source-block index. Leave it in natural flow
    // until its underlying transcription is corrected.
    const source = experiment.english[page.id] || "";
    const translation = experiment.chinese[page.id] || "";
    const tags = (markup) => [...markup.matchAll(/<(h3|p)(?:\s[^>]*)?>/gi)].map((match) => match[1].toLowerCase()).join(",");
    if (tags(source) !== tags(translation)) return;

    // A parameter list is one outer block but contains many independently
    // wrapping rows. Match complete lists by parameter names, then give each
    // corresponding row the same track height in both language columns.
    const tables = (pane) => [...pane.querySelectorAll(":scope > .parameter-table")];
    const enTables = tables(left);
    const zhTables = tables(right);
    for (const enTable of enTables) {
      const enKeys = [...enTable.querySelectorAll(":scope > .parameter-key")].map((node) => node.textContent.trim());
      const partner = zhTables.find((table) => {
        const keys = [...table.querySelectorAll(":scope > .parameter-key")].map((node) => node.textContent.trim());
        return keys.length === enKeys.length && keys.length > 1 && keys.every((key, i) => key === enKeys[i]);
      });
      if (!partner) continue;
      const complete = (table) => [...table.children].every((node, i) => node.classList.contains(i % 2 ? "parameter-value" : "parameter-key"));
      if (!complete(enTable) || !complete(partner)) continue;
      const rows = enKeys.map((_, i) => Math.ceil(Math.max(
        enTable.children[i * 2].getBoundingClientRect().height,
        enTable.children[i * 2 + 1].getBoundingClientRect().height,
        partner.children[i * 2].getBoundingClientRect().height,
        partner.children[i * 2 + 1].getBoundingClientRect().height,
      )));
      const tracks = rows.map((height) => `${height}px`).join(" ");
      enTable.style.gridTemplateRows = tracks;
      partner.style.gridTemplateRows = tracks;
      zhTables.splice(zhTables.indexOf(partner), 1);
    }

    const indexed = (pane) => new Map([...pane.children]
      .filter((node) => node.dataset.alignIndex !== undefined && node.dataset.alignIndex !== "")
      .map((node) => [Number(node.dataset.alignIndex), node]));
    const en = indexed(left);
    const zh = indexed(right);
    const pairs = [...en.keys()].filter((key) => zh.has(key)).sort((a, b) => a - b)
      .map((key) => [en.get(key), zh.get(key)])
      .filter(([enNode, zhNode]) => enNode.tagName === zhNode.tagName
        && enNode.classList.contains("parameter-table") === zhNode.classList.contains("parameter-table"));
    const sourceFigures = [...left.children].filter((node) => node.tagName === "FIGURE");
    const translatedFigures = [...right.children].filter((node) => node.matches("figure.mapped-figure"));
    sourceFigures.forEach((figure, i) => {
      const partner = translatedFigures[i];
      if (partner && figure.querySelector("img")?.src === partner.querySelector("img")?.src) {
        pairs.push([figure, partner]);
      }
    });
    pairs.sort(([a], [b]) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    // CSS vertical margin collapse can absorb a small correction, so make a
    // second pass once the first margin adjustments have settled in layout.
    for (let pass = 0; pass < 3; pass += 1) {
      let changed = false;
      for (const [enNode, zhNode] of pairs) {
        const difference = enNode.getBoundingClientRect().top - zhNode.getBoundingClientRect().top;
        if (Math.abs(difference) < 2) continue;
        const earlier = difference > 0 ? zhNode : enNode;
        const base = Number.parseFloat(getComputedStyle(earlier).marginTop) || 0;
        earlier.style.marginTop = `${base + Math.abs(difference)}px`;
        earlier.dataset.alignmentMargin = "1";
        changed = true;
      }
      if (!changed) break;
    }
  });
}

let alignmentFrame = 0;
function scheduleBilingualAlignment() {
  if (alignmentFrame) cancelAnimationFrame(alignmentFrame);
  alignmentFrame = requestAnimationFrame(() => {
    alignmentFrame = 0;
    alignBilingualPages();
  });
}

function populateExperiment() {
  if (!experiment) return;
  document.querySelectorAll(".page-block").forEach((page) => {
    const pageId = page.id;
    const englishPane = page.querySelector(".content-en");
    const chinesePane = page.querySelector(".content-zh");
    englishPane.innerHTML = experiment.english[pageId] || "<p>English transcription pending.</p>";
    chinesePane.innerHTML = experiment.chinese[pageId] || "<p>\u4e2d\u6587\u7ffb\u8bd1\u5f85\u8865\u3002</p>";
    markAlignmentBlocks(englishPane);
    markAlignmentBlocks(chinesePane);
    mapFigures(page, pageId);
    formatInlineParameterLists(englishPane);
    formatInlineParameterLists(chinesePane);
    formatParameterTables(englishPane);
    formatParameterTables(chinesePane);
    formatStepBreaks(englishPane);
    formatStepBreaks(chinesePane);
    formatCodePage(englishPane, pageId);
    formatCodePage(chinesePane, pageId);
    formatKnownTranscriptions(englishPane, pageId);
    formatKnownTranscriptions(chinesePane, pageId);
    formatKnownFormulas(englishPane, pageId);
    formatKnownFormulas(chinesePane, pageId);
    formatContinuations(englishPane, pageId);
    formatContinuations(chinesePane, pageId);
  });

  // Add stable anchors to the small set of semantic section headings used by
  // the sidebar. Parameter names and table-like headings remain unindexed.
  (experiment.navigationSections || []).forEach((section) => {
    const page = document.getElementById(section.pageId);
    if (!page) return;
    const panes = [page.querySelector(".content-en"), page.querySelector(".content-zh")].filter(Boolean);
    panes.forEach((pane) => {
      const heading = [...pane.querySelectorAll("h3")].find((node) => node.textContent.trim() === section.title || node.textContent.trim() === section.titleZh);
      if (heading) heading.id = section.id;
    });
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
  scheduleBilingualAlignment();
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
  scheduleBilingualAlignment();
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

const sectionLinks = [...document.querySelectorAll(".sidebar-section-link[data-section-id]")];
const sectionTargets = sectionLinks
  .map((link) => document.getElementById(link.dataset.sectionId))
  .filter(Boolean);
const sectionObserver = "IntersectionObserver" in window && sectionTargets.length
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach((link) => {
          const active = link.dataset.sectionId === entry.target.id;
          link.classList.toggle("active", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-16% 0px -68% 0px", threshold: 0 })
  : null;
sectionTargets.forEach((target) => sectionObserver?.observe(target));

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
  scheduleBilingualAlignment();
  if (scaleMode !== "auto") return;
  window.clearTimeout(scaleResizeTimer);
  scaleResizeTimer = window.setTimeout(() => applyScale(automaticScale(), "auto"), 100);
}, { passive: true });

document.fonts?.ready.then(scheduleBilingualAlignment).catch(() => {});
document.addEventListener("load", (event) => {
  if (event.target instanceof HTMLImageElement && event.target.closest(".bilingual-grid")) scheduleBilingualAlignment();
}, true);

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

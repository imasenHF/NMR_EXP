#!/usr/bin/env python3
"""Generate the human-readable NMR glossary from the reusable JSON source."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "work" / "nmr-terminology.json"
OUTPUT = ROOT / "work" / "nmr-terminology.md"


def cell(values: list[str] | str | None) -> str:
    if not values:
        return "—"
    if isinstance(values, str):
        values = [values]
    return "；".join(values).replace("|", "\\|")


def main() -> None:
    glossary = json.loads(SOURCE.read_text(encoding="utf-8"))
    terms = glossary["terms"]
    lines = [
        f"# {glossary['title']}",
        "",
        f"> 状态：{glossary['status']}",
        "",
        "本文件由 `work/nmr-terminology.json` 自动生成。请只编辑 JSON 源文件，然后重新运行 `python work/build-terminology.py`，避免双重维护。",
        "",
        "## 使用约定",
        "",
    ]
    for key, value in glossary.get("conventions", {}).items():
        lines.append(f"- `{key}`：{value}")
    lines.extend([
        "",
        f"## 术语（{len(terms)} 条）",
        "",
        "| English | 规范中文 | 可接受译名 | 禁用/错误译法 | 说明 |",
        "|---|---|---|---|---|",
    ])
    for term in terms:
        lines.append(
            "| "
            + " | ".join(
                [
                    cell(term["source"]),
                    cell(term["target"]),
                    cell(term.get("acceptedTargets")),
                    cell(term.get("variants")),
                    cell(term.get("note")),
                ]
            )
            + " |"
        )
    OUTPUT.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"terms": len(terms), "output": str(OUTPUT.relative_to(ROOT))}, ensure_ascii=False))


if __name__ == "__main__":
    main()


# NMR Textbook HTML Suite

这是一个可离线阅读的 NMR 教材 HTML 资料库，包含三套按章节和实验组织的双语页面。根目录入口提供跨教材全文检索；每套教材也可以单独启动。

## 内容

| ID | 教材 | 页面规模 | 独立入口 |
|---|---|---:|---|
| `nmr-200` | *200 and More NMR Experiments: A Practical Course* | 227 个实验/章节页、838 个原书页 | `200-and-more-nmr-experiments-html/index.html` |
| `nmr-50-essential` | *50 and More Essential NMR Experiments: A Detailed Guide* | 68 个实验/章节页、318 个原书页 | `50-and-more-essential-nmr-experiments-html/index.html` |
| `nmr-practical` | *Practical NMR Spectroscopy Laboratory Guide* | 12 个章节页、128 个原书页 | `practical-nmr-spectroscopy-laboratory-guide-html/index.html` |

统一检索索引目前包含 1256 条页级记录。每个内容页同时保留英文稿、中文稿、图像资源和原书页对照入口；详细项目映射见 `PROJECT-MANIFEST.json`。

## 运行

在本目录双击 `START_READING.cmd`，或运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8765
```

然后访问 `http://127.0.0.1:8765/`。推荐使用本地服务器，以保证搜索、锚点跳转和原页图片加载稳定。三套教材目录内也各自提供 `START_READING.cmd` 和 `serve.ps1`。

## 目录结构

- `index.html`：三套教材的统一入口、目录和跨书搜索。
- `data/`：统一目录、统一搜索索引和各套教材的页级数据。
- `200-and-more-nmr-experiments-html/`：200 and More NMR Experiments。
- `50-and-more-essential-nmr-experiments-html/`：50 and More Essential NMR Experiments。
- `practical-nmr-spectroscopy-laboratory-guide-html/`：Practical NMR Spectroscopy Laboratory Guide。
- `assets/`：原书页、谱图、脉冲序列、方程和封面等本地资源。
- `shared/`：统一入口样式；每套教材目录内另有对应的阅读器脚本和样式。

本次分发内容为静态阅读文件，不依赖外部服务、运行时数据库或构建缓存。旧版加密 JavaScript 已被可读的数据脚本替换，页面数据和搜索索引可以直接检查。

## 图片与使用范围

栅格图统一使用 WebP，并保持原有裁剪边界与宽高比；SVG 矢量图保留原格式。源 PDF、扫描原档、构建工程和审校工作资料不包含在本分发目录中。

本资料库按已取得的原书扫描、文本翻译和网络发布授权整理，仅用于授权范围内的阅读与学术交流。转载、再分发或商业使用应遵守相应授权条件。

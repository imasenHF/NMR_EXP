# 200 and More NMR Experiments 本地阅读版

本仓库是 *200 and More NMR Experiments* 的静态本地阅读版本，按章节和实验组织内容，便于在离线环境中检索、浏览并对照原书页面。

## 快速启动

在 Windows 中下载或克隆完整仓库后，双击 `START_READING.cmd`。启动脚本会调用系统自带的 PowerShell，在本机启动静态服务器并自动打开：

```text
http://127.0.0.1:8765/index.html
```

阅读期间请保留命令窗口；关闭窗口或按 `Ctrl+C` 即可停止服务。

也可以在项目目录中手动运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

若默认端口被占用，可指定其他端口：

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8876
```

## 阅读功能

- 按章节展开的实验目录与全文检索。
- 英文、英汉对照和原页对照三种阅读模式。
- 可点击跳转的 Index and Glossary 索引。
- 多套低饱和度主题、页面缩放与目录展开状态持久化。
- 原页 WebP 按需加载，兼顾清晰度与本地浏览性能。

## 项目结构

```text
index.html          检索与章节入口
experiments/        227 个独立内容页面
data/               页面内容数据与全文搜索索引
assets/             原页 WebP、谱图、脉冲序列、方程和封面
shared/             全站样式与交互脚本
START_READING.cmd   Windows 快速启动入口
serve.ps1           本地静态服务器
```

页面依赖上述目录之间的相对路径，请保留完整目录结构，不要只复制或发送某一个 HTML 文件。最终阅读交付包不应包含源 PDF、构建脚本、转录工程和工作缓存。

## 开发与审校

完整开发仓库中的 `source/`、`tools/` 和 `work/` 用于重建、核查与生成阅读文件。核磁专业术语以 `work/nmr-terminology.json` 为唯一可编辑来源，其中包含规范译名、可接受译名和禁用的机器翻译变体；运行 `python work/build-terminology.py` 可同步生成便于人工审阅的 `work/nmr-terminology.md`。词表用于提出审校候选，不能代替逐页对照原书，也不得据此对正文执行无语境的全局替换。

制作最终阅读交付包时，应排除 `source/`、`tools/`、`work/`、源 PDF、模型、浏览器配置和历史压缩包，仅保留上方“项目结构”中列出的阅读运行文件。

## 浏览器要求

推荐使用当前版本的 Microsoft Edge、Google Chrome 或 Firefox。直接打开 `index.html` 通常也能阅读，但通过本地服务器访问可获得更稳定的检索、锚点跳转和原页加载体验。

## 使用范围

本文档仅供小范围、非公开的学术交流与学习参考；未经许可，不得复制、转载、转发、公开传播或用于商业用途。

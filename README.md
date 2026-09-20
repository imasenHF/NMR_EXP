# 200 and More NMR Experiments 本地阅读版

这是仅用于检索和阅读的静态交付包，不包含源 PDF、转录工程、翻译模型或构建缓存。

## 启动

Windows 下双击 `START_READING.cmd`。脚本只使用系统自带的 PowerShell，在本机 `127.0.0.1:8765` 启动静态服务器并打开浏览器。

阅读期间请保留命令窗口；关闭窗口或按 `Ctrl+C` 即可停止服务器。若 8765 端口已占用，可在 PowerShell 中运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8876
```

也可以直接打开 `index.html`；但推荐使用本地服务器，以获得最稳定的搜索、锚点跳转和原页加载体验。

## 目录

- `index.html`：检索首页。
- `experiments/`：227 个独立内容页。
- `data/`：逐页内容数据与搜索索引。
- `assets/`：原页 WebP、谱图、脉冲序列、方程和封面。
- `shared/`：主题、布局和交互脚本。

请保持上述目录的相对位置，不要只复制单个 HTML 文件。

## 使用范围

本文档仅供小范围、非公开的学术交流与学习参考；未经许可，不得复制、转载、转发、公开传播或用于商业用途。


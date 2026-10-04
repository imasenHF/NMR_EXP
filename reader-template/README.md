# 单语种 HTML 阅读器模板

这是一个可复制到其他教材、实验手册或技术资料项目中的静态阅读器模板。模板只处理阅读界面，不包含现有三套 NMR 文档的内容、扫描页或检索索引。

## 已包含功能

- 单语种章节阅读
- 主题切换：sage、mist、sand、mauve、gray
- 自动缩放、放大、缩小和当前比例显示
- 左侧章节目录、章节折叠、全部展开/收起
- 移动端目录抽屉
- URL 锚点定位和页内滚动
- 脚注上标与返回正文链接
- 响应式图表、公式和参数块
- 本地静态服务器启动脚本

模板不包含中英对照、原书扫描页模式、双语语言切换和原文映射逻辑。

## 快速使用

1. 复制整个 `reader-template` 目录到新项目。
2. 修改 `data/example-item.js` 中的书名、章节目录和页面 HTML。
3. 将图片、谱图、脉冲序列等资源放入 `assets/`，并在页面 HTML 中使用相对路径。
4. 运行 `START_READING.cmd`，或执行：

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8765
   ```

5. 打开 `http://127.0.0.1:8765/`。

## 数据接口

`data/example-item.js` 提供一个 `window.READER_DOCUMENT` 对象：

```js
window.READER_DOCUMENT = {
  meta: {
    id: "chapter-1",
    number: "1",
    title: "The NMR Spectrometer",
    titleZh: "NMR 波谱仪",
    subtitle: "单语种阅读器示例"
  },
  navigation: [
    { id: "chapter-1", number: "1", title: "The NMR Spectrometer", href: "index.html" }
  ],
  pages: [
    { id: "page-1", bookPage: "1", pdfPage: 1, html: "<h2>页面标题</h2><p>正文内容。</p>" }
  ]
};
```

页面 HTML 可以直接写入 `figure`、表格、参数块和脚注。脚注采用稳定的页面级 ID：

```html
<p>正文说明<sup><a href="#fn-3-1" id="fnref-3-1">1</a></sup>。</p>
<section class="footnotes" aria-label="脚注">
  <ol>
    <li id="fn-3-1">脚注内容。<a href="#fnref-3-1" aria-label="返回正文">↩</a></li>
  </ol>
</section>
```

## 接入多页文档

每个章节或实验可以生成一个独立目录，例如 `items/chapter-1.html`。这些页面都保留同一套 HTML 骨架，只替换数据脚本：

```html
<script src="../data/chapter-1.js"></script>
<script src="../shared/reader.js"></script>
```

如果页面放在不同层级，按页面位置调整 `shared/`、`data/` 和 `assets/` 的相对路径。脚注、图像和页内锚点均应使用当前页面可解析的相对路径。

## 文件说明

```text
reader-template/
├── index.html                 阅读器骨架示例
├── data/example-item.js       示例数据，替换为实际内容
├── shared/reader.css          统一阅读器样式
├── shared/reader.js           目录、主题、缩放和锚点逻辑
├── START_READING.cmd          Windows 启动入口
└── serve.ps1                  本地静态服务器
```

模板使用浏览器原生 JavaScript 和 CSS，不依赖构建工具、框架或外部 CDN。正式发布前仍应逐页检查图片路径、脚注跳转、目录链接、窄屏布局和缩放后的标题换行。

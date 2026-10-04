window.READER_DOCUMENT = Object.freeze({
  meta: {
    id: "chapter-1",
    number: "1",
    title: "The NMR Spectrometer",
    titleZh: "NMR 波谱仪",
    subtitle: "单语种、可缩放、可离线阅读",
    eyebrow: "TECHNICAL READER",
    description: "用于技术资料、实验手册和课程讲义的单语种阅读界面。"
  },
  navigation: [
    {
      id: "chapter-1-group",
      number: "1",
      title: "The NMR Spectrometer",
      titleZh: "NMR 波谱仪",
      items: [{ id: "chapter-1", number: "1", title: "Chapter overview", href: "index.html" }]
    },
    {
      id: "chapter-2-group",
      number: "2",
      title: "Pulse Sequences",
      titleZh: "脉冲序列",
      items: [{ id: "chapter-2", number: "2", title: "Chapter overview", href: "items/chapter-2.html" }]
    },
    {
      id: "appendix-a-group",
      number: "A",
      title: "Appendix",
      titleZh: "附录",
      items: [{ id: "appendix-a", number: "A", title: "Appendix overview", href: "items/appendix-a.html" }]
    }
  ],
  pages: [
    {
      id: "page-1",
      bookPage: "1",
      pdfPage: 1,
      html: `
        <h2>页面标题</h2>
        <p>这里放置经过审校的单语种正文。标题、段落、图表、公式和参数块均可直接写入页面 HTML。</p>
        <h3>实验参数</h3>
        <dl class="parameter-list">
          <dt>频率</dt><dd>600 MHz</dd>
          <dt>脉冲宽度</dt><dd>90° 脉冲，约 10 µs</dd>
          <dt>采集时间</dt><dd>3.6 s</dd>
        </dl>
        <p>正文脚注示例<sup><a href="#fn-page-1-1" id="fnref-page-1-1">1</a></sup>。</p>
        <section class="footnotes" aria-label="脚注">
          <h3>脚注</h3>
          <ol>
            <li id="fn-page-1-1">脚注内容写在这里。<a href="#fnref-page-1-1" aria-label="返回正文">↩</a></li>
          </ol>
        </section>
      `
    }
  ]
});

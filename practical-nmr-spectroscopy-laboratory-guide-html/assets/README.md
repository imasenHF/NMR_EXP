# 图像资产分类

本项目的 PDF 插图均从源 PDF 的嵌入图像对象直接提取，正文仍使用稳定的
`assets/figures/page-xxx-fig-y.ext` 路径。为避免重新导入或修复脚本产生断链，
目前不把文件物理移动到分类子目录；分类信息集中记录在
[`figure-categories.json`](figure-categories.json) 中。

分类清单中的每张图片包含：

- `file`：相对于 `assets/figures/` 的文件名；
- `sourcePage`：教材源 PDF 页码；
- `category`：主类别；
- `tags`：更细的内容标签；
- `descriptionZh`：便于维护和检索的中文说明。

主类别包括：

| 类别 | 含义 |
| --- | --- |
| `chemical-structure` | 化学结构式 |
| `line-shape-and-processing-plots` | 线形、窗口函数、脉冲处理等曲线 |
| `pulse-sequences` | 脉冲序列图 |
| `spectra-and-spectrum-screens` | 一维/二维/DOSY 等谱图及谱图屏幕 |
| `instrument-interface-screens` | 参数、拟合、shim 或通道配置界面 |
| `experimental-apparatus` | 样品管和实验装置示意图 |
| `calibration-plots` | 温度等校准图 |

后续若要真正按目录拆分文件，需要同时更新导入脚本、资产修复脚本和所有
HTML 引用；在此之前应以该 JSON 清单作为唯一分类来源。

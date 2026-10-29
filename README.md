# AIQA 研究站 / AIQA Probe

AI 质量工程的开源项目与研究笔记。无前端框架、无运行时依赖，构建为可直接托管的静态页面。

- 网站：[aiqaprobe.com](https://aiqaprobe.com/)
- 笔记：[aiqaprobe.com/notes/](https://aiqaprobe.com/notes/)
- 仓库：[STEVE-DENG/aiqaprobe](https://github.com/STEVE-DENG/aiqaprobe)

## 本地开发

需要 Node.js 24。执行 `npm run dev`，访问 `http://localhost:4173`。

启动时构建；修改 `src/` 或 `content/` 后自动重新构建，刷新浏览器查看。修改 `scripts/` 后重启开发命令。

```bash
npm run build
npm run preview
```

构建结果位于 `dist/`。不要直接通过文件协议或其他静态服务打开 `src/`，它包含构建时替换的公共组件与内容标记。

## 内容结构

- `src/index.html`：首页，两个真实开源项目、研究方向与反馈入口。
- `src/styles.css`：首页、索引、文章和移动端的公共样式。
- `src/script.js`：笔记搜索、分类、排序、可分享查询参数和复制链接。
- `content/research.json`：12 篇有来源的论文摘记、官方研究及基础阅读。
- `content/archive.json`：保留的 6 篇实践短记。
- `scripts/site.mjs`：公共组件、笔记索引与文章模板。
- `scripts/build.mjs`：生成首页、18 个独立笔记页、RSS 与站点地图。
- `src/assets/brand.png`：内置 imagegen 生成的 Q 节点与验证勾品牌图标。

笔记分类为 `evaluation`、`automation`、`knowledge`、`testing`。新增笔记时填写唯一的英文 `slug`、标题、来源日期、类型、摘要、标签、分节与原始来源。日期可以精确到月，不虚构具体日期。构建会检查 slug 重复、分类、日期格式与来源协议。

原文要点与实践推演应分开，注明预印本、基础阅读与适用边界。来源更新和 RSS 收录日期在 `scripts/site.mjs` 的 `reviewed` 中维护；来源日期保留在各篇内容中。本站没有自动抓取或后台定时更新。

完整索引和正文在构建时生成，禁用 JavaScript 仍可阅读；搜索、分类和排序由浏览器增强。资料建议、项目问题和勘误通过 GitHub Issues 收集，本站不采集访客表单或个人资料。

## 发布

推送 `main` 后，`.github/workflows/pages.yml` 构建并部署到 GitHub Pages。域名 `aiqaprobe.com` 继续使用百度云 DNS；不需要购买服务器或重新配置域名。

DNS 导入文件、旧预览截图、本地托管配置与构建结果不纳入版本控制。公开网页不包含个人介绍、邮箱或其他私人资料。

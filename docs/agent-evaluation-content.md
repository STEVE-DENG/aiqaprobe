# Agent 评测图文笔记维护记录

更新时间：2026-10-31（上海）

## 内容

新增四篇评测学习笔记，数据保存在 `content/methods.json`。编写/整理日期与原始研究日期分别标注；来源逐节关联。通用方法使用虚构的文件整理任务贯穿，不展示虚构实测成绩。

阅读顺序：任务与验收 → 评分标准 → 重复运行与版本比较 → 近期验收器和 Harness 研究。

新增文章支持教学配图、可横向滚动的比较表、段落来源链接和下一篇阅读入口。首页及评测分类提供同一条阅读路线。旧笔记的资料核对日期与 RSS 收录日期保留；新内容使用独立的核对和收录日期。

## 图片

生成方式：内置 GPT image / imagegen，非 CLI。两张图均为教学示意，不是软件截图或实测结果。

- 主图：`src/assets/notes/agent-evaluation-cycle.png`，1536 × 1024。
- 验收错误图：`src/assets/notes/agent-verifier-mistakes.png`，1536 × 1024。

图片已保存到项目，不依赖生成目录。正文提供替代文本、解释和原图链接，图中信息也由正文独立讲清。

## 最终生图提示词

### agent-eval-cycle

Use case: scientific-educational. Create a polished Chinese educational editorial illustration for AIQA Probe, explaining how to evaluate an AI agent with one concrete example: organize a report file. Wide landscape 1536x1024 composition, off-white #f5f8f7, dark teal #123237 text, muted mint #dceee7, pine green #146d60 accents. Flat hand-crafted technical illustration with light paper texture, clear outlined folder/file/robot/tool shapes, friendly adult learning style, generous spacing, no glowing sci-fi imagery, no personal details. Three equally sized horizontal panels with large exact Chinese headings: '任务', '执行', '验收'. Left: a task card and destination folder, with exact large caption '整理报告，保存到指定目录'. Middle: small nonhuman robot using a tool, three visible connected action cards and a trace scroll, caption '调用工具，留下记录'. Right: an actual file inside a folder and a checklist, caption '检查文件与内容'. Under the three panels, one curved return arrow from a failed check back to the task area, labeled '把失败留作下次的用例'. A tiny speech bubble from the robot says '完成了'; it must be visually separate from the checked file, conveying that a claim is not evidence. Only these specified Chinese texts, rendered accurately and very legibly. No brand logo, no invented metrics, no other text. Illustration conceptual only, no website UI mockup.

### agent-verifier-mistakes

Use case: scientific-educational. Chinese educational illustration for an AI evaluation learning article: a verifier can make two different mistakes. Wide landscape 1536x1024, ivory-white #f5f8f7 background, dark teal #123237, muted mint and pine green, restrained coral red only for incorrect judgements. Two balanced side-by-side panels, mature clean editorial illustration with paper texture, simple document/folder/checklist objects, no people or personal information. Large heading left exactly '误放行', subtitle exactly '文件没保存，却判通过'; show an empty destination folder next to robot speech bubble '完成了' and an obviously wrongly green approved stamp, with a coral outline calling attention to the empty folder. Large heading right exactly '误拒绝', subtitle exactly '做法不同，却完成了任务'; show two documents with different layouts containing the same abstract rows, both correctly inside destination folders; a rigid checker wrongly rejects the alternate layout with a coral X while a neutral checklist confirms that required content exists. Bottom across both panels exact large sentence '验收器也要用对例和反例检查'. The visual should make clear green stamp on left and red cross on right are verifier mistakes, use a coral warning frame around each mistaken verdict. Only the exact specified Chinese text; no invented stats, percentages, equations, source claims, or extra labels. Keep text large and crisp with abundant whitespace. It is a conceptual teaching drawing, not an app screenshot.

## 来源范围

基础资料：Anthropic Agent 评测指南、LangSmith 评测概念、τ-bench、MT-Bench、Anthropic 基础设施噪声文章。

近期研究：VerifierBench（2026-10-19）、AgentProofBench（2026-10-25）、Harness-Bench v2（2026-10-15；首发 2026-05-27）。均注明预印本和未复现范围，不将近期提案称为行业标准。

按用户要求未运行测试；只执行发布所需的静态构建与部署。


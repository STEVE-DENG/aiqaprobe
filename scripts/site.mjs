export const origin = "https://aiqaprobe.com";
export const reviewed = "2026-10-30";
export const evaluationPath = [
  { slug: "agent-evaluation-playbook", title: "从一个任务开始", text: "写清要求，再检查交付结果。" },
  { slug: "agent-grading-explained", title: "把评分标准讲清", text: "规则、模型和人工怎样分工。" },
  { slug: "agent-evaluation-reliability", title: "比较版本与稳定性", text: "跑一次和每次都跑通的差别。" },
  { slug: "agent-evaluation-frontiers-2026-10", title: "读懂近期研究", text: "验收器、规则复用与执行系统。" }
];
export function evaluationReadingPath() {
  return `<nav class="evaluation-reading" aria-label="Agent 评测推荐阅读顺序"><div class="evaluation-reading-heading"><h3>Agent 评测，从这里读起</h3><span>从通用方法，到近期研究</span></div><ol>${evaluationPath.map((entry, i) => `<li><a href="/notes/${entry.slug}/"><span class="reading-step" aria-hidden="true">${i + 1}</span><span><strong>${entry.title}</strong><small>${entry.text}</small></span></a></li>`).join("")}</ol></nav>`;
}
export const topics = [
  { id: "evaluation", name: "AI 评测", en: "Evaluation", icon: "chart", text: "任务设计、评分器与可信的评测结果。" },
  { id: "automation", name: "客户端自动化", en: "Automation", icon: "cursor", text: "GUI 理解、设备操作与长任务验收。" },
  { id: "knowledge", name: "AI 知识库", en: "Knowledge", icon: "layers", text: "检索、知识图谱与有依据的回答。" },
  { id: "testing", name: "AI 测试", en: "Testing", icon: "check", text: "测试生成、边界探索与失败回归。" }
];
export const escape = (value = "") => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const displayDate = (value) => value.replaceAll("-", ".");
export const noteURL = (note) => `/notes/${note.slug}/`;
export const topicFor = (note) => topics.find((topic) => topic.id === note.topic);
export const icon = (name) => {
  const paths = {
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    external: '<path d="M7 17 17 7M7 7h10v10"/>',
    chart: '<path d="M4 19h16M7 15v-4m5 4V5m5 10v-7"/>',
    cursor: '<path d="m5 3 14 9-7 1-3 7-4-17Z"/>',
    layers: '<path d="m3 7 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 17l9 5 9-5"/>',
    check: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8 12 3 3 5-6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    github: '<path d="M9 19c-4 1-4-2-6-2m12 5v-4a3.5 3.5 0 0 0-1-2.5c3.3-.4 6.8-1.6 6.8-7a5.4 5.4 0 0 0-1.4-3.7A5 5 0 0 0 19.3 1S18 .6 15 2.4a13 13 0 0 0-7 0C5 .6 3.7 1 3.7 1a5 5 0 0 0-.1 3.8 5.4 5.4 0 0 0-1.4 3.7c0 5.4 3.5 6.6 6.8 7A3.5 3.5 0 0 0 8 18v4" transform="translate(1 0) scale(.92)"/>'
  };
  return `<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
};
export function header(active = "home") {
  return `<a class="skip-link" href="#main">跳到正文</a><header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="AIQA 研究站首页"><img src="/assets/brand.png" width="38" height="38" alt=""/><span>AIQA <b>Probe</b><small>研究站</small></span></a><nav aria-label="主导航"><a href="/#projects"${active === "home" ? ' aria-current="page"' : ""}>开源项目</a><a href="/notes/"${active === "notes" ? ' aria-current="page"' : ""}>研究笔记</a><a href="/#feedback">反馈</a></nav><a class="github-link" href="https://github.com/STEVE-DENG/aiqaprobe" target="_blank" rel="noopener noreferrer" aria-label="GitHub 网站仓库（新窗口）">${icon("github")}<span>GitHub</span></a></div></header>`;
}
export function footer() {
  return `<footer class="site-footer wrap"><a class="footer-brand" href="/">AIQA Probe<span>让研究成为积累。</span></a><div><a href="/notes/">研究笔记</a><a href="https://github.com/STEVE-DENG/aiqaprobe/issues" target="_blank" rel="noopener noreferrer">意见与勘误</a><span>© <span id="year">2026</span> AIQA 研究站</span></div></footer>`;
}
export function page({ title, description, path, content, article = false }) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="theme-color" content="#f5f8f7"/><title>${escape(title)} | AIQA 研究站</title><meta name="description" content="${escape(description)}"/><link rel="canonical" href="${origin}${path}"/><meta property="og:type" content="${article ? "article" : "website"}"/><meta property="og:title" content="${escape(title)} | AIQA 研究站"/><meta property="og:description" content="${escape(description)}"/><meta property="og:url" content="${origin}${path}"/><meta property="og:image" content="${origin}/assets/brand.png"/><meta name="twitter:card" content="summary"/><link rel="icon" href="/assets/favicon-32.png" type="image/png" sizes="32x32"/><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"/><link rel="manifest" href="/site.webmanifest"/><link rel="alternate" type="application/rss+xml" title="AIQA 研究笔记" href="/feed.xml"/><link rel="stylesheet" href="/styles.css?v=20261031-3"/></head><body>${header("notes")}<main id="main">${content}</main>${footer()}<script type="module" src="/script.js?v=20261030"></script></body></html>`;
}
export function noteCard(note) {
  const topic = topicFor(note);
  const searchText = [note.title, note.summary, ...note.tags, ...note.sections.flatMap(s => [s.heading, ...(s.paragraphs || []), ...(s.paragraphsAfter || []), ...(s.list || []), ...(s.table?.columns || []), ...(s.table?.rows.flat() || [])])].join(" ").toLowerCase();
  return `<article class="note-card" data-topic="${note.topic}" data-date="${note.date}" data-search="${escape(searchText)}"><div class="note-meta"><span class="topic-tag ${topic.id}">${escape(topic.name)}</span><span>${escape(note.kind)}</span><time datetime="${note.date}" title="${escape(note.dateLabel || (note.sources.length ? "来源日期" : "记录日期"))}">${note.dateLabel ? `${escape(note.dateLabel.replace("日期", ""))} ` : ""}${displayDate(note.date)}</time></div><h3><a href="${noteURL(note)}">${escape(note.title)}</a></h3><p>${escape(note.summary)}</p><div class="note-card-bottom"><span>${escape(note.venue || "研究记录")}</span><a href="${noteURL(note)}" aria-label="阅读：${escape(note.title)}">${icon("arrow")}</a></div></article>`;
}
export function notesIndex(notes) {
  const sections = topics.map(topic => {
    const entries = notes.filter(note => note.topic === topic.id);
    return `<section class="topic-section" id="${topic.id}" data-topic-section="${topic.id}"><div class="topic-section-heading"><div class="topic-glyph ${topic.id}">${icon(topic.icon)}</div><div><h2>${topic.name}</h2><p>${topic.text}</p></div><span>${entries.length} 篇</span></div>${topic.id === "evaluation" ? evaluationReadingPath() : ""}<div class="notes-grid">${entries.map(noteCard).join("")}</div></section>`;
  }).join("");
  return page({ title: "研究笔记", description: "AI 评测、客户端自动化、AI 知识库与 AI 测试的论文阅读和实践笔记。附原始来源、阅读要点与适用边界。", path: "/notes/", content: `<section class="notes-hero wrap"><a class="back-link" href="/">首页 / 研究笔记</a><div class="notes-intro"><div><p class="eyebrow">持续研究，认真记录</p><h1>想法有出处，<br/>实践有记录。</h1><p>追踪 AI-QA 的新方法，把论文里的启发，整理成可继续研究的线索。</p></div><div class="collection-stamp"><strong>${notes.length}<span>篇笔记</span></strong><p>4 个研究方向</p><small>原文与编写日期分别标注</small></div></div></section><div class="notebook-layout wrap"><aside class="notebook-sidebar"><p>研究方向</p><nav aria-label="笔记分类"><a href="/notes/" data-topic-filter="all" aria-current="true">全部笔记<span>${notes.length}</span></a>${topics.map(t => `<a href="#${t.id}" data-topic-filter="${t.id}">${icon(t.icon)}${t.name}<span>${notes.filter(n => n.topic === t.id).length}</span></a>`).join("")}</nav><div class="sidebar-note"><strong>阅读说明</strong><p>论文摘记与实践推演分开展示。预印本不等于定论，发布日期与收录日期分别记录。</p><a href="/feed.xml">订阅 RSS ${icon("external")}</a></div></aside><div class="notebook-content"><form class="search-bar" role="search"><label for="note-search">${icon("search")}<span class="sr-only">搜索笔记标题、标签或正文</span></label><input id="note-search" name="q" type="search" placeholder="搜索论文、技术关键词或笔记…" autocomplete="off"/><button type="submit">搜索</button></form><div class="results-bar"><p id="note-count" role="status" aria-live="polite">共 ${notes.length} 篇笔记</p><label class="sort-label" hidden>排序 <select id="note-sort"><option value="newest">条目日期由新到旧</option><option value="oldest">条目日期由旧到新</option></select></label></div>${sections}<div class="empty-state" id="empty-state" hidden>${icon("search")}<h2>还没有匹配的笔记</h2><p>试试 RAG、评测、GUI，或清除筛选重新浏览。</p><button class="button button-primary" id="reset-search" type="button">查看全部笔记</button></div><div class="notebook-end"><span>有值得读的论文，或发现了笔记错误？</span><a href="https://github.com/STEVE-DENG/aiqaprobe/issues/new?title=%5B%E8%B5%84%E6%96%99%E5%BB%BA%E8%AE%AE%5D" target="_blank" rel="noopener noreferrer">推荐资料 / 提出勘误 ${icon("external")}</a></div></div></div>` });
}
export function notePage(note, notes) {
  const topic = topicFor(note);
  const related = notes.filter(n => n.topic === note.topic && n.slug !== note.slug).slice(0, 2);
  const seriesIndex = evaluationPath.findIndex(entry => entry.slug === note.slug);
  const nextEntry = seriesIndex >= 0 ? evaluationPath[seriesIndex + 1] : undefined;
  const nextArticle = nextEntry ? `<a class="article-next" href="/notes/${nextEntry.slug}/"><span>按顺序继续读</span><strong>${nextEntry.title} ${icon("arrow")}</strong></a>` : "";
  const sections = note.sections.map((s,i) => {
    const figure = s.figure ? `<figure class="article-figure"><a href="${escape(s.figure.src)}" target="_blank" rel="noopener noreferrer" aria-label="查看教学图原图（新窗口）"><img src="${escape(s.figure.src)}" width="${s.figure.width}" height="${s.figure.height}" alt="${escape(s.figure.alt)}" loading="lazy" decoding="async"/></a><figcaption>${escape(s.figure.caption)} <a href="${escape(s.figure.src)}" target="_blank" rel="noopener noreferrer">查看大图</a></figcaption></figure>` : "";
    const table = s.table ? `<div class="article-table-scroll" role="region" tabindex="0" aria-label="${escape(s.table.caption)}"><table><caption>${escape(s.table.caption)}</caption><thead><tr>${s.table.columns.map(c => `<th scope="col">${escape(c)}</th>`).join("")}</tr></thead><tbody>${s.table.rows.map(row => `<tr>${row.map((c,j) => j === 0 ? `<th scope="row">${escape(c)}</th>` : `<td>${escape(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : "";
    const refs = (s.references || []).map(index => note.sources[index]).filter(Boolean);
    return `<section id="section-${i}"><h2>${escape(s.heading)}</h2>${(s.paragraphs || []).map(p => `<p>${escape(p)}</p>`).join("")}${s.list ? `<ul>${s.list.map(item => `<li>${escape(item)}</li>`).join("")}</ul>` : ""}${figure}${table}${(s.paragraphsAfter || []).map(p => `<p>${escape(p)}</p>`).join("")}${refs.length ? `<p class="section-references">参考：${refs.map(s => `<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)}</a>`).join("；")}</p>` : ""}</section>`;
  }).join("");
  const sourceBlock = note.sources.length ? `<section id="sources" class="sources"><h2>原始来源</h2>${note.sources.map(s => `<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer"><span>${escape(s.title)}<small>${escape(new URL(s.url).hostname)}</small></span>${icon("external")}</a>`).join("")}<p>来源核对：${displayDate(note.checkedAt || reviewed)}。${note.editorialNote ? "方法说明与教学示例不代表实测结果，原始研究日期见上方来源。" : "本文是公开资料阅读摘记，实践推演未视为已复现结论。"}</p></section>` : '<div class="reading-note">实践短记：这是研究方法记录，不代表已完成的实验或模型能力结论。</div>';
  const correction = new URLSearchParams({title:`[笔记勘误] ${note.title}`,body:`笔记：${origin}${noteURL(note)}\n\n问题与建议：\n`});
  return page({ title: note.title, description: note.summary, path: noteURL(note), article: true, content: `<div class="article-shell wrap"><nav class="breadcrumbs" aria-label="面包屑"><a href="/">首页</a><span>/</span><a href="/notes/">研究笔记</a><span>/</span><a href="/notes/?topic=${topic.id}">${topic.name}</a></nav><header class="article-header"><div class="note-meta"><span class="topic-tag ${topic.id}">${topic.name}</span><span>${escape(note.kind)}</span></div><h1>${escape(note.title)}</h1><p class="article-deck">${escape(note.summary)}</p><div class="article-byline"><span>${escape(note.dateLabel || (note.sources.length ? "来源日期" : "记录日期"))} <time datetime="${note.date}">${displayDate(note.date)}</time></span><span>约 ${Math.max(1, Math.ceil(JSON.stringify(note.sections).length / 450))} 分钟阅读</span><button type="button" data-copy-link>复制链接 ${icon("external")}</button></div>${note.venue ? `<p class="venue">${escape(note.venue)}</p>` : ""}</header><div class="article-layout"><article class="article-body">${note.editorialNote ? `<p class="reading-note">${escape(note.editorialNote)}</p>` : ""}${sections}${nextArticle}${sourceBlock}<div class="article-tags">${note.tags.map(t => `<span>${escape(t)}</span>`).join("")}</div><a class="article-correction" href="https://github.com/STEVE-DENG/aiqaprobe/issues/new?${escape(correction)}" target="_blank" rel="noopener noreferrer">发现遗漏或错误？提出勘误 ${icon("external")}</a></article><aside class="article-toc"><p>本文目录</p><nav aria-label="文章目录">${note.sections.map((s,i) => `<a href="#section-${i}">${escape(s.heading)}</a>`).join("")}${note.sources.length ? '<a href="#sources">原始来源</a>' : ""}</nav><a class="back-to-notes" href="/notes/?topic=${topic.id}">浏览${topic.name}笔记</a></aside></div><section class="related-notes"><div class="section-heading"><h2>沿着这个方向继续读</h2><a href="/notes/">全部笔记 ${icon("arrow")}</a></div><div class="related-grid">${related.map(noteCard).join("")}</div></section></div><p class="toast" role="status" aria-live="polite" id="toast"></p>` });
}

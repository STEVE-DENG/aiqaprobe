import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { origin, reviewed, topics, evaluationReadingPath, escape, displayDate, icon, header, footer, noteURL, noteCard, notesIndex, notePage } from "./site.mjs";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export async function buildSite() {
  const output = path.join(root, "dist");
  const notes = (await Promise.all(["methods", "research", "archive"].map(async name => JSON.parse(await readFile(path.join(root, `content/${name}.json`), "utf8"))))).flat().sort((a, b) => b.date.localeCompare(a.date));
  const slugs = new Set();
  for (const note of notes) {
    if (!/^[a-z0-9-]+$/.test(note.slug) || slugs.has(note.slug) || !topics.some(t => t.id === note.topic)) throw new Error(`Invalid note identity: ${note.slug}`);
    if (!/^\d{4}-\d{2}(-\d{2})?$/.test(note.date)) throw new Error(`Invalid date: ${note.slug}`);
    for (const source of note.sources) if (!source.url.startsWith("https://")) throw new Error(`Invalid source: ${note.slug}`);
    slugs.add(note.slug);
  }
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(path.join(root, "src"), output, { recursive: true });
  const topicTiles = topics.map(t => `<a class="topic-tile ${t.id}" href="/notes/?topic=${t.id}"><span class="topic-glyph">${icon(t.icon)}</span><span><small>${t.en}</small><h3>${t.name}</h3><p>${t.text}</p></span><span class="tile-count">${notes.filter(n => n.topic === t.id).length} 篇 ${icon("arrow")}</span></a>`).join("");
  const featured = ["agent-evaluation-playbook", "agent-grading-explained", "agent-evaluation-frontiers-2026-10"].map(slug => notes.find(n => n.slug === slug));
  let home = await readFile(path.join(root, "src/index.html"), "utf8");
  home = home.replace("<!--HEADER-->", header()).replace("<!--FOOTER-->", footer()).replace("<!--TOPICS-->", topicTiles).replace("<!--EVAL_PATH-->", evaluationReadingPath()).replace("<!--LATEST-->", featured.map(noteCard).join("")).replaceAll("{{NOTE_COUNT}}", String(notes.length)).replaceAll("{{REVIEWED}}", displayDate(reviewed));
  await writeFile(path.join(output, "index.html"), home);
  await mkdir(path.join(output, "notes"), { recursive: true });
  await writeFile(path.join(output, "notes/index.html"), notesIndex(notes));
  for (const note of notes) {
    const dir = path.join(output, "notes", note.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), notePage(note, notes));
  }
  const latestAddition = notes.map(note => note.addedAt || reviewed).sort().at(-1);
  const urls = ["/", "/notes/", ...notes.map(noteURL)];
  await writeFile(path.join(output, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${origin}${url}</loc><lastmod>${notes.find(note => noteURL(note) === url)?.addedAt || (url === "/" || url === "/notes/" ? latestAddition : reviewed)}</lastmod></url>`).join("")}</urlset>`);
  const rssDate = date => new Date(`${date}T00:00:00+08:00`).toUTCString();
  await writeFile(path.join(output, "feed.xml"), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>AIQA 研究站 · 研究笔记</title><link>${origin}/notes/</link><description>AI 评测、客户端自动化、知识库与测试研究笔记。条目日期为本站收录日期；原始资料日期见正文。</description><language>zh-CN</language><lastBuildDate>${rssDate(latestAddition)}</lastBuildDate>${notes.map(note => `<item><title>${escape(note.title)}</title><link>${origin}${noteURL(note)}</link><guid>${origin}${noteURL(note)}</guid><pubDate>${rssDate(note.addedAt || reviewed)}</pubDate><description>${escape(note.summary)} ${escape(note.dateLabel || "来源日期")}：${note.date}。</description></item>`).join("")}</channel></rss>`);
  console.log(`Built dist/: ${notes.length} notes, ${topics.length} topics.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildSite();

const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());

const search = document.querySelector("#note-search");
if (search) {
  const filters = [...document.querySelectorAll("[data-topic-filter]")];
  const sections = [...document.querySelectorAll("[data-topic-section]")];
  const cards = [...document.querySelectorAll(".notebook-content .note-card")];
  const count = document.querySelector("#note-count");
  const empty = document.querySelector("#empty-state");
  const sort = document.querySelector("#note-sort");
  const validTopics = new Set(filters.map(link => link.dataset.topicFilter));
  let topic = "all";

  document.querySelector(".sort-label").hidden = false;

  function restoreFromURL() {
    const params = new URLSearchParams(location.search);
    topic = validTopics.has(params.get("topic")) ? params.get("topic") : "all";
    search.value = params.get("q") || "";
    sort.value = params.get("sort") === "oldest" ? "oldest" : "newest";
    render(false);
  }

  function render(updateURL = true, push = false) {
    const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    cards.forEach(card => {
      const match = (topic === "all" || card.dataset.topic === topic) && terms.every(term => card.dataset.search.includes(term));
      card.hidden = !match;
      if (match) visible += 1;
    });
    sections.forEach(section => {
      const entries = [...section.querySelectorAll(".note-card")];
      section.hidden = !entries.some(card => !card.hidden);
      entries.sort((a,b) => sort.value === "oldest" ? a.dataset.date.localeCompare(b.dataset.date) : b.dataset.date.localeCompare(a.dataset.date));
      entries.forEach(card => section.querySelector(".notes-grid").append(card));
      section.querySelector(".topic-section-heading > span").textContent = `${entries.filter(c => !c.hidden).length} 篇`;
    });
    filters.forEach(link => {
      if (link.dataset.topicFilter === topic) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    count.textContent = `显示 ${visible} / ${cards.length} 篇笔记`;
    empty.hidden = visible > 0;
    if (updateURL) {
      const url = new URL(location.href);
      url.search = "";
      url.hash = "";
      if (topic !== "all") url.searchParams.set("topic", topic);
      if (search.value.trim()) url.searchParams.set("q", search.value.trim());
      if (sort.value !== "newest") url.searchParams.set("sort", sort.value);
      if (url.href !== location.href) history[push ? "pushState" : "replaceState"](null, "", url);
    }
  }
  filters.forEach(link => link.addEventListener("click", event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    topic = link.dataset.topicFilter;
    render(true, true);
  }));
  search.addEventListener("input", () => render());
  document.querySelector(".search-bar").addEventListener("submit", event => { event.preventDefault(); render(); });
  sort.addEventListener("change", () => render());
  document.querySelector("#reset-search").addEventListener("click", () => {
    topic = "all";
    search.value = "";
    sort.value = "newest";
    render(true, true);
    search.focus();
  });
  window.addEventListener("popstate", restoreFromURL);
  restoreFromURL();
}

const copy = document.querySelector("[data-copy-link]");
if (copy) {
  let toastTimer;
  copy.addEventListener("click", async () => {
    const toast = document.querySelector("#toast");
    try {
      await navigator.clipboard.writeText(new URL(location.pathname, location.origin).href);
      toast.textContent = "笔记链接已复制";
    } catch {
      toast.textContent = "复制未完成，请从浏览器地址栏复制链接";
    }
    toast.setAttribute("data-visible", "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.removeAttribute("data-visible"), 3000);
  });
}

// Keep links from the previous single-page site useful after the redesign.
if (location.pathname === "/") {
  const legacyAnchors = { "#project": "#projects", "#probe": "#projects", "#contact": "#feedback" };
  const target = legacyAnchors[location.hash];
  if (target) {
    history.replaceState(null, "", target);
    document.querySelector(target)?.scrollIntoView();
  }
}

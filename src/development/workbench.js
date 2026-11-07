const $ = id => document.getElementById(id);
const names = { 'ai-proxy': 'AI Proxy', 'app-test-agent': 'App Test Agent', 'ai-judge-agent': 'PureEval' };
const states = { queued: '等待处理', claimed: '已接收', screening: '安全审查', planning: '整理方案', developing: '开发中', reviewing: '代码审查', publishing: '合并交付', completed: '已完成', failed: '执行失败', stopped: '已停止', rejected: '未采纳' };
const groups = [
  { id: 'active', title: '正在推进', states: ['planning', 'developing'], empty: '下一项改进，从这里开始', text: '通过审查的建议，会进入计划与开发。', glyph: '⌁' },
  { id: 'review', title: '审查与交付', states: ['reviewing', 'publishing'], empty: '让每一次改动，有据可查', text: '独立代码审查通过后，才会进入合并。', glyph: '◇' },
  { id: 'completed', title: '完成归档', states: ['completed'], empty: '把进步留在版本里', text: '任务完成后，可查看 PR 与版本标签。', glyph: '✓' },
  { id: 'failed', title: '未完成的任务', states: ['failed', 'stopped'], empty: '没有未完成的公开任务', text: '失败与停止单独记录，不计入完成。', glyph: '⏸' }
];
const activeStates = new Set(['planning', 'developing', 'reviewing', 'publishing']);
let api = '', tasks = [], totals = null, widget, enabled = false, refreshing = false, loaded = false;
let stateFilter = 'all', visibleLimit = 18, focusedId = null, focusRequest, online = false;
let paused = true;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined && text !== null) element.textContent = String(text);
  if (className) element.className = className;
  return element;
};
const validId = id => typeof id === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id);
const countFor = selected => tasks.filter(task => selected.includes(task.state)).length;
const kindFor = task => groups.find(group => group.states.includes(task.state))?.id || 'active';
const validDate = value => Number.isFinite(new Date(value).getTime());
const dateText = value => validDate(value) ? new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '时间待同步';
function link(text, url) {
  const element = node('a', text);
  element.href = url; element.target = '_blank'; element.rel = 'noopener noreferrer';
  return element;
}
function deliveryLinks(task) {
  const links = node('p');
  const expected = `https://github.com/STEVE-DENG/${task.project}/pull/`;
  if (typeof task.pr_url === 'string' && task.pr_url.startsWith(expected) && /^\d+$/.test(task.pr_url.slice(expected.length))) links.append(link('查看 PR ↗', task.pr_url));
  if (typeof task.version === 'string' && /^v\d+\.\d+\.\d+$/.test(task.version)) links.append(link(task.version, `https://github.com/STEVE-DENG/${task.project}/tree/${task.version}`));
  return links;
}
function connection(text, live = false) {
  online = live;
  $('service-status').textContent = text;
  $('connection-dot').classList.toggle('online', live);
  updateMotion();
}
function updateMotion() {
  $('radar').classList.toggle('is-live', online && !reducedMotion.matches);
  $('radar').classList.toggle('is-paused', paused);
  const stopped = paused || reducedMotion.matches || !online;
  $('pause-radar').setAttribute('aria-pressed', String(stopped));
  $('pause-radar').textContent = stopped ? '动效已暂停' : '暂停动效';
}
function totalFor(selected) {
  if (totals) return totals.filter(item => selected.includes(item.state)).reduce((sum, item) => sum + item.count, 0);
  return countFor(selected);
}
function renderOverview() {
  for (const group of groups) $('stat-' + group.id).textContent = loaded ? totalFor(group.states) : '—';
  // The active stat element uses its own name to match the visual category.
  $('radar-count').textContent = loaded ? totalFor([...activeStates]) : '—';
  $('radar-caption').textContent = loaded ? '进行中' : '等待连接';
  $('radar').setAttribute('aria-label', loaded ? `公开任务雷达：${totalFor([...activeStates])} 项进行中，点位来自最近公开记录` : '任务概览，尚未连接');
  $('radar-message').textContent = loaded ? totalFor([...activeStates]) ? '每个点位是一项真实任务。点击即可聚焦查看。' : '当前没有正在执行的公开任务。新的进展会出现在这里。' : '执行服务尚未连接时，这里不展示模拟任务。';
  $('radar-points').replaceChildren();
  const points = tasks.filter(task => activeStates.has(task.state) || task.state === 'completed').slice(0, 18);
  points.forEach((task, i) => {
    const angle = (i * 137.5 - 90) * Math.PI / 180;
    const radius = task.state === 'completed' ? 43 : kindFor(task) === 'review' ? 29 : 35;
    const point = node('button', null, 'radar-point');
    point.type = 'button'; point.dataset.kind = kindFor(task);
    point.style.left = `${50 + radius * Math.cos(angle)}%`;
    point.style.top = `${50 + radius * Math.sin(angle)}%`;
    point.setAttribute('aria-label', `${names[task.project]}：${task.title}，${states[task.state]}`);
    point.setAttribute('aria-pressed', String(task.id === focusedId));
    point.title = task.title;
    point.addEventListener('click', () => focusTask(task.id, true));
    $('radar-points').append(point);
  });
  $('scope-note').textContent = loaded ? totals ? '概览为全部公开任务 · 列表最近 100 项' : '概览与列表均按最近公开记录统计' : '仅展示通过准入审查的公开任务';
}
function taskCard(task) {
  const card = node('article', null, 'task-card');
  card.dataset.kind = kindFor(task);
  card.classList.toggle('is-focused', task.id === focusedId);
  const meta = node('div', null, 'task-meta');
  const focus = node('button', task.id === focusedId ? '已聚焦' : '⌖ 聚焦');
  focus.type = 'button'; focus.setAttribute('aria-label', `聚焦任务：${task.title}`);
  focus.addEventListener('click', () => focusTask(task.id, true));
  meta.append(node('span', names[task.project]), focus);
  const bottom = node('div', null, 'task-bottom');
  const time = node('time', dateText(task.updated_at));
  if (validDate(task.updated_at)) time.dateTime = task.updated_at;
  bottom.append(node('span', states[task.state], 'task-state'));
  if (task.version) bottom.append(node('span', task.version, 'version-badge'));
  bottom.append(time);
  card.append(meta, node('h4', task.title), node('p', task.summary || '任务进展正在同步。'), bottom);
  return card;
}
function renderTasks() {
  const project = $('filter-project').value;
  const query = $('task-search').value.trim().toLowerCase();
  const visible = tasks.filter(task => (project === 'all' || project === task.project) && (stateFilter === 'all' || (stateFilter === 'active' ? activeStates.has(task.state) : stateFilter === 'failed' ? ['failed', 'stopped'].includes(task.state) : task.state === stateFilter)) && [task.title, task.summary, names[task.project], task.version || '', states[task.state]].join(' ').toLowerCase().includes(query));
  const selectedGroups = groups.filter(group => stateFilter === 'all' ? group.id !== 'failed' || visible.some(task => group.states.includes(task.state)) : stateFilter === 'active' ? ['active', 'review'].includes(group.id) : group.id === stateFilter);
  $('task-list').replaceChildren();
  $('task-list').dataset.columns = String(Math.max(1, selectedGroups.filter(group => group.id !== 'failed').length));
  for (const group of selectedGroups) {
    const column = node('section', null, 'task-column'); column.dataset.group = group.id;
    const entries = visible.filter(task => group.states.includes(task.state));
    const heading = node('div', null, 'column-heading');
    heading.append(node('h3', group.title), node('span', loaded ? entries.length : '—'));
    column.append(heading);
    const subset = entries.slice(0, visibleLimit);
    if (subset.length) subset.forEach(task => column.append(taskCard(task)));
    else {
      const empty = node('div', null, 'task-empty');
      const filtered = query || project !== 'all';
      empty.append(node('span', group.glyph, 'empty-symbol'), node('strong', filtered ? '没有匹配的任务' : group.empty), node('p', filtered ? '换个关键词，或切换到其他项目。' : group.text));
      column.append(empty);
    }
    $('task-list').append(column);
  }
  $('load-more').hidden = !selectedGroups.some(group => visible.filter(task => group.states.includes(task.state)).length > visibleLimit);
  document.querySelectorAll('[data-state]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.state === stateFilter)));
  document.querySelectorAll('[data-project]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.project === project)));
}
function renderActivity() {
  $('recent-activity').replaceChildren();
  const recent = [...tasks].sort((a,b) => (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0)).slice(0, 8);
  if (!recent.length) $('recent-activity').append(node('li', '有公开进展后，更新会出现在这里。', 'activity-empty'));
  for (const task of recent) {
    const item = node('li'); const time = node('time', dateText(task.updated_at));
    if (validDate(task.updated_at)) time.dateTime = task.updated_at;
    const button = node('button', task.title); button.type = 'button';
    button.addEventListener('click', () => focusTask(task.id, false));
    item.append(time, button, node('span', `${names[task.project]} · ${states[task.state]}`));
    $('recent-activity').append(item);
  }
}
function resetFocus() {
  focusRequest?.abort(); focusedId = null;
  try { localStorage.removeItem('aiqa-focused-task'); } catch {}
  $('clear-focus').hidden = true;
  $('focus-content').replaceChildren(node('span', '⌖', 'focus-glyph'), node('h3', '你关心哪一次改进？'), node('p', '点击任务卡片上的「聚焦」，在这里查看处理过程与交付链接。'));
  renderTasks(); renderOverview();
}
async function focusTask(id, scroll) {
  const task = tasks.find(task => task.id === id); if (!task) return;
  focusRequest?.abort(); focusRequest = new AbortController();
  const signal = AbortSignal.any([focusRequest.signal, AbortSignal.timeout(12000)]);
  focusedId = id; try { localStorage.setItem('aiqa-focused-task', id); } catch {}
  $('clear-focus').hidden = false;
  const timeline = node('ol', null, 'focus-timeline');
  const status = node('p', '正在读取处理过程…');
  $('focus-content').replaceChildren(node('span', `${names[task.project]} · #${id.slice(0,8)}`, 'engine-label'), node('h3', task.title), node('p', task.summary), timeline, status, deliveryLinks(task));
  renderTasks(); renderOverview();
  if (scroll) $('focus-title').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
  try {
    const response = await fetch(`${api}/tasks/${id}`, { signal });
    if (!response.ok) throw Error();
    const data = await response.json(); if (focusedId !== id) return;
    for (const event of (Array.isArray(data.events) ? data.events : []).slice(-20)) {
      if (!states[event.state]) continue;
      const item = node('li', states[event.state]); item.append(node('time', dateText(event.created_at))); timeline.append(item);
    }
    status.textContent = '独立代码审查后交付；版本和部署状态分别记录。';
  } catch {
    if (focusedId === id && !focusRequest.signal.aborted) status.textContent = '处理过程暂时无法同步，可以先查看已有记录。';
  }
}
async function track(id) {
  if (!api || !validId(id)) return;
  $('tracked-task').hidden = false;
  try {
    const response = await fetch(`${api}/tasks/${id}`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw Error();
    const data = await response.json();
    $('tracked-task').textContent = `你的建议 #${id.slice(0,8)}：${states[data.task.state] || '处理中'}。${data.task.summary || '等待安全审查。'}`;
  } catch { $('tracked-task').textContent = '暂时无法查询这条建议，请稍后刷新。'; }
}
async function refresh() {
  if (!api || refreshing) return;
  refreshing = true; $('refresh-tasks').disabled = true;
  try {
    const response = await fetch(`${api}/tasks`, { signal: AbortSignal.timeout(12000), cache: 'no-store' });
    if (!response.ok) throw Error();
    const data = await response.json(); if (!Array.isArray(data.tasks)) throw Error();
    tasks = data.tasks.slice(0,100).filter(task => validId(task.id) && Object.hasOwn(names, task.project) && Object.hasOwn(states, task.state) && typeof task.title === 'string').map(task => ({ ...task, title: task.title.slice(0,80), summary: String(task.summary || '').slice(0,240) }));
    totals = Array.isArray(data.totals) ? data.totals.filter(row => Object.hasOwn(states, row.state) && Number.isSafeInteger(row.count) && row.count >= 0) : null;
    loaded = true;
    const age = Date.now() - Date.parse(data.heartbeat);
    connection(data.paused ? '执行器已暂停' : Number.isFinite(age) && age >= 0 && age < 180000 ? '执行器在线，自动处理建议' : '执行器离线，建议将排队等待', !data.paused && Number.isFinite(age) && age >= 0 && age < 180000);
    $('tasks-status').textContent = `最近同步 ${dateText(new Date().toISOString())}（北京时间）`;
    renderOverview(); renderTasks(); renderActivity();
    if (focusedId && !tasks.some(task => task.id === focusedId)) resetFocus();
    if (focusedId) focusTask(focusedId, false);
    if (!focusedId) {
      let remembered; try { remembered = localStorage.getItem('aiqa-focused-task'); } catch {}
      if (tasks.some(task => task.id === remembered)) focusTask(remembered, false);
    }
    await track(new URLSearchParams(location.search).get('task'));
  } catch {
    connection('暂时无法连接工作台');
    $('tasks-status').textContent = loaded ? '以下为上次同步的记录，当前进度可能已变化。' : '连接恢复后，公开进度会显示在这里。';
    renderOverview(); renderTasks(); renderActivity();
  } finally { refreshing = false; $('refresh-tasks').disabled = !api; }
}
function fallbackURL() {
  const project = $('project').value;
  const params = new URLSearchParams();
  if ($('suggestion-name').value.trim()) params.set('title', $('suggestion-name').value.trim());
  // Do not transmit private description data through query parameters.
  $('github-fallback').href = `https://github.com/STEVE-DENG/${project}/issues/new${params.size ? '?' + params : ''}`;
}
$('project').addEventListener('change', fallbackURL);
$('suggestion-name').addEventListener('input', fallbackURL);
$('suggestion-detail').addEventListener('input', () => { $('detail-length').textContent = `${$('suggestion-detail').value.length} / 2000`; });
$('filter-project').addEventListener('change', () => { visibleLimit = 18; renderTasks(); });
$('task-search').addEventListener('input', () => { visibleLimit = 18; renderTasks(); });
document.querySelectorAll('[data-state]').forEach(button => button.addEventListener('click', () => { stateFilter = button.dataset.state; visibleLimit = 18; renderTasks(); }));
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => { $('filter-project').value = $('filter-project').value === button.dataset.project ? 'all' : button.dataset.project; visibleLimit = 18; renderTasks(); $('workbench').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' }); }));
$('load-more').addEventListener('click', () => { visibleLimit += 18; renderTasks(); });
$('clear-focus').addEventListener('click', resetFocus);
$('pause-radar').addEventListener('click', () => { paused = !paused; updateMotion(); });
reducedMotion.addEventListener('change', updateMotion);
$('refresh-tasks').addEventListener('click', refresh);
$('suggestion-form').addEventListener('submit', async event => {
  event.preventDefault(); if (!enabled) return;
  const token = window.turnstile?.getResponse(widget);
  if (!token) { $('submit-status').textContent = '请先完成人机验证。'; return; }
  $('submit-suggestion').disabled = true; $('submit-status').textContent = '正在提交建议…';
  try {
    const data = Object.fromEntries(new FormData(event.target));
    const response = await fetch(`${api}/suggestions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...data, token }), signal: AbortSignal.timeout(20000) });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || '提交失败，请稍后再试。');
    if (!validId(result.id)) throw Error('未收到有效任务编号，请稍后查询。');
    $('submit-status').textContent = `建议已收到，编号 #${result.id.slice(0,8)}。安全审查通过后会展示进度。`;
    history.replaceState(null, '', `?task=${result.id}#suggestions`);
    event.target.reset(); $('detail-length').textContent = '0 / 2000'; fallbackURL();
    await refresh();
  } catch (error) { $('submit-status').textContent = error.name === 'TimeoutError' ? '连接超时，请稍后再试。' : String(error.message).slice(0,200); }
  finally { window.turnstile?.reset(widget); $('submit-suggestion').disabled = false; }
});
renderTasks(); renderActivity(); updateMotion();
try {
  const response = await fetch('/development/config.json', { signal: AbortSignal.timeout(10000), cache: 'no-store' });
  if (!response.ok) throw Error();
  const config = await response.json();
  if (!config.apiBase) {
    connection('执行服务尚未接入');
    $('tasks-status').textContent = '当前可通过 GitHub 反馈；接入后显示真实开发进度。';
    $('submit-status').textContent = '站内建议入口暂未启用，可通过下方 GitHub 链接反馈。';
    $('refresh-tasks').disabled = true;
  } else {
    const url = new URL(config.apiBase);
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw Error();
    api = url.origin; paused = reducedMotion.matches;
    await refresh();
    const response = await fetch(`${api}/config`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw Error();
    const config = await response.json();
    if (config.accepting && config.siteKey) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.onload = () => { widget = window.turnstile.render('#challenge', { sitekey: config.siteKey, action: 'suggestion', theme: 'dark' }); enabled = true; $('submit-suggestion').disabled = false; $('submit-status').textContent = '安全审查通过后，建议将进入自动开发。'; };
      script.onerror = () => { $('submit-status').textContent = '人机验证加载失败，请通过 GitHub 反馈。'; };
      document.head.append(script);
    } else $('submit-status').textContent = '建议入口暂未启用，请通过 GitHub 反馈。';
    setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  }
} catch {
  connection('工作台连接失败'); $('tasks-status').textContent = '连接恢复后即可同步进度。'; $('submit-status').textContent = '暂时无法连接建议服务，请通过 GitHub 反馈。';
}

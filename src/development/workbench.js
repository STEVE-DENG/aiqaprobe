const $=id=>document.getElementById(id);
const names={'ai-proxy':'AI Proxy','app-test-agent':'App Test Agent','ai-judge-agent':'PureEval'};
const states={queued:'待处理',claimed:'已接收',screening:'安全审查',planning:'规划中',developing:'开发中',reviewing:'代码审查',publishing:'合并交付中',completed:'已完成',failed:'未完成',stopped:'已停止',rejected:'未采纳'};
let api='', tasks=[], widget, enabled=false, refreshing=false;
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
const safeLink=(url,pattern)=>{try{const u=new URL(url);return u.protocol==='https:'&&pattern.test(u.href)?u.href:null;}catch{return null;}};
function render(){
 const project=$('filter-project').value,state=$('filter-state').value;
 const visible=tasks.filter(t=>(project==='all'||t.project===project)&&(state==='all'||(state==='active'?!['completed','failed','rejected','stopped'].includes(t.state):t.state===state)));
 $('task-list').replaceChildren();
 if(!visible.length){$('task-list').append(node('p','暂无符合条件的记录。安全审查通过后，任务会在这里展示。','task-empty'));return;}
 for(const t of visible){const card=node('article',null,'task-card'),meta=node('div',null,'task-meta');meta.append(node('span',names[t.project]||'开源项目'),node('span',states[t.state]||'处理中','task-state'));if(t.version)meta.append(node('span',t.version));card.append(meta,node('h3',t.title),node('p',t.summary||'正在处理这项建议。'));
 const time=node('time');const date=new Date(t.updated_at);if(!Number.isNaN(date.getTime())){time.dateTime=t.updated_at;time.textContent=`更新于 ${date.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}`;card.append(time);}
 const detail=node('details'),summary=node('summary','查看处理记录');detail.append(summary);detail.addEventListener('toggle',async()=>{if(!detail.open||detail.dataset.loaded)return;const p=node('p','正在读取…');detail.append(p);try{const r=await fetch(`${api}/tasks/${encodeURIComponent(t.id)}`,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();const d=await r.json();p.textContent=(d.events||[]).map(e=>states[e.state]||e.state).join(' → ');detail.dataset.loaded='true';}catch{p.textContent='暂时无法读取处理记录。';}},{once:true});card.append(detail);
 const links=node('p');const pr=safeLink(t.pr_url,/^https:\/\/github\.com\/STEVE-DENG\/(ai-proxy|app-test-agent|ai-judge-agent)\/pull\/\d+$/);if(pr){const a=node('a','查看改动 ↗');a.href=pr;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}card.append(links);$('task-list').append(card);}
}
async function track(id){
 if(!api||!id||!/^[a-f0-9-]{36}$/.test(id))return;
 try{const r=await fetch(`${api}/tasks/${id}`,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();const d=await r.json();$('tracked-task').textContent=`你的建议 ${id.slice(0,8)}：${states[d.task.state]||'处理中'}。${d.task.summary||'等待安全审查。'}`;}catch{$('tracked-task').textContent='暂时无法查询这条建议，请稍后刷新。';}
}
async function refresh(){
 if(!api||refreshing)return;refreshing=true;$('refresh-tasks').disabled=true;
 try{const r=await fetch(`${api}/tasks`,{signal:AbortSignal.timeout(12000),cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();if(!Array.isArray(d.tasks))throw Error();tasks=d.tasks.slice(0,100);render();await track(new URLSearchParams(location.search).get('task'));const age=Date.now()-Date.parse(d.heartbeat);$('service-status').textContent=d.paused?'执行器已暂停':Number.isFinite(age)&&age<180000?'执行器在线，自动处理建议':'执行器离线，建议将排队等待';$('tasks-status').textContent=`最近同步：${new Date().toLocaleTimeString('zh-CN')}`;}
 catch{$('tasks-status').textContent='暂时无法同步，已显示的记录可能不是最新的。';$('service-status').textContent='工作台暂时无法连接';}finally{refreshing=false;$('refresh-tasks').disabled=false;}
}
$('project').addEventListener('change',()=>{$('github-fallback').href=`https://github.com/STEVE-DENG/${$('project').value}/issues/new`;});
$('filter-project').addEventListener('change',render);$('filter-state').addEventListener('change',render);$('refresh-tasks').addEventListener('click',refresh);
$('suggestion-form').addEventListener('submit',async event=>{
 event.preventDefault();if(!enabled)return;const token=window.turnstile?.getResponse(widget);if(!token){$('submit-status').textContent='请先完成人机验证。';return;}
 $('submit-suggestion').disabled=true;$('submit-status').textContent='正在提交…';
 try{const data=Object.fromEntries(new FormData(event.target));const r=await fetch(`${api}/suggestions`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...data,token}),signal:AbortSignal.timeout(20000)});const d=await r.json();if(!r.ok)throw Error(d.error||'提交失败');$('submit-status').textContent=`建议已收到，编号 ${String(d.id).slice(0,8)}。审查通过后展示进度。`;history.replaceState(null,'',`?task=${encodeURIComponent(d.id)}`);event.target.reset();$('project').dispatchEvent(new Event('change'));await refresh();}
 catch(error){$('submit-status').textContent=error.message==='The operation was aborted due to timeout'?'连接超时，请稍后再试。':error.message;}finally{window.turnstile?.reset(widget);$('submit-suggestion').disabled=false;}
});
try{
 const config=await fetch('/development/config.json').then(r=>r.json());
 if(!config.apiBase){$('service-status').textContent='工作台尚未接入执行服务';$('tasks-status').textContent='暂未启用站内提交，可先通过 GitHub 留下反馈。';render();}
 else{const url=new URL(config.apiBase);if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash)throw Error('配置无效');api=url.origin;await refresh();const r=await fetch(`${api}/config`,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('连接失败');const c=await r.json();if(c.accepting&&c.siteKey){const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.onload=()=>{widget=window.turnstile.render('#challenge',{sitekey:c.siteKey,action:'suggestion'});enabled=true;$('submit-suggestion').disabled=false;};script.onerror=()=>{$('submit-status').textContent='人机验证加载失败，请使用 GitHub 反馈。';};document.head.append(script);}setInterval(()=>{if(!document.hidden)refresh();},60000);}
}catch{$('service-status').textContent='工作台连接失败';$('tasks-status').textContent='可通过 GitHub 反馈，稍后再试。';}

const projects = new Set(['ai-proxy', 'app-test-agent', 'ai-judge-agent']);
const terminal = new Set(['completed', 'failed', 'rejected', 'stopped']);
const transitions = {claimed:['screening','failed'],screening:['planning','rejected','failed'],planning:['developing','rejected','failed'],developing:['reviewing','failed'],reviewing:['developing','publishing','failed'],publishing:['completed','failed']};
const json = (data, status=200) => new Response(JSON.stringify(data), {status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
async function digest(s) {return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(n=>n.toString(16).padStart(2,'0')).join('');}
async function body(req) {
 if(!req.headers.get('content-type')?.startsWith('application/json')) throw new Error('invalid request');
 const reader=req.body?.getReader(); if(!reader) throw new Error('invalid request');
 let length=0, parts=[]; for(;;){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>12000){await reader.cancel();throw new Error('request too large');}parts.push(value);}
 const bytes=new Uint8Array(length);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
async function take(env,key,max){return (await env.DB.prepare('INSERT INTO limits(key,count) VALUES(?,1) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count').bind(key,max).first())!==null;}
async function route(req, env) {
 const url=new URL(req.url), path=url.pathname, now=new Date().toISOString();
 if(req.method==='GET' && path==='/config') return json({siteKey:env.TURNSTILE_SITE_KEY||'',accepting:!!(env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY)});
 if(req.method==='GET' && path==='/tasks') {
  const control=await env.DB.prepare('SELECT paused,heartbeat FROM control WHERE id=1').first();
  const {results}=await env.DB.prepare("SELECT id,project,title,state,summary,created_at,updated_at,version,pr_url,commit_sha FROM tasks WHERE is_public=1 AND state NOT IN ('queued','claimed','screening','rejected') ORDER BY updated_at DESC LIMIT 100").all();
  const totals=await env.DB.prepare("SELECT state,COUNT(*) AS count FROM tasks WHERE is_public=1 AND state NOT IN ('queued','claimed','screening','rejected') GROUP BY state").all();
  return json({tasks:results,totals:totals.results,heartbeat:control.heartbeat,paused:!!control.paused});
 }
 if(req.method==='GET' && /^\/tasks\/[a-f0-9-]{36}$/.test(path)) {
  const id=path.split('/')[2];
  const task=await env.DB.prepare('SELECT id,project,state,summary,updated_at,version,pr_url FROM tasks WHERE id=?').bind(id).first();
  if(!task)return json({error:'任务不存在'},404);
  const {results}=await env.DB.prepare('SELECT state,created_at FROM events WHERE task_id=? ORDER BY id').bind(id).all();
  return json({task,events:results});
 }
 if(req.method==='POST' && path==='/suggestions') {
  if(req.headers.get('origin')!==env.SITE_ORIGIN) return json({error:'来源不允许'},403);
  if(!env.TURNSTILE_SECRET || !env.TURNSTILE_SITE_KEY) return json({error:'建议入口尚未启用'},503);
  const ip=req.headers.get('CF-Connecting-IP');if(!ip)return json({error:'请求无法确认'},403);
  const day=now.slice(0,10), key=await digest(`${env.RATE_SALT}:${day}:${ip}`);
  if(!env.RATE_SALT || !await take(env,`request:${day}:${key}`,15))return json({error:'请求过于频繁'},429);
  const b=await body(req);
  if(!projects.has(b.project)||typeof b.title!=='string'||typeof b.detail!=='string'||b.title.trim().length<4||b.title.length>80||b.detail.trim().length<15||b.detail.length>2000||typeof b.token!=='string'||b.token.length>2048) return json({error:'请填写项目、4–80 字标题和 15–2000 字说明'},400);
  if(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:^|\D)1[3-9]\d{9}(?:$|\D)/i.test(b.title+' '+b.detail))return json({error:'请移除邮箱、手机号等私人信息'},400);
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(b.title+b.detail))return json({error:'包含无效字符'},400);
  const verified=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET,response:b.token,remoteip:ip}),signal:AbortSignal.timeout(10000)}).then(r=>r.json());
  if(!verified.success||verified.hostname!==new URL(env.SITE_ORIGIN).hostname||verified.action!=='suggestion')return json({error:'请重新完成人机验证'},403);
  if(!await take(env,`submit:${day}:${key}`,3)||!await take(env,`global:${day}`,Math.min(100,Number(env.DAILY_LIMIT)||20))) return json({error:'今日建议额度已用完'},429);
  const fingerprint=await digest(`${b.project}\n${b.title.trim()}\n${b.detail.trim()}`);
  if(!await take(env,`duplicate:${day}:${fingerprint}`,1))return json({error:'这条建议已经提交'},409);
  const id=crypto.randomUUID();
  await env.DB.batch([env.DB.prepare('INSERT INTO tasks(id,project,title,detail,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(id,b.project,b.title.trim(),b.detail.trim(),now,now),env.DB.prepare('INSERT INTO events(task_id,state,created_at) VALUES(?,?,?)').bind(id,'queued',now)]);
  return json({id,message:'建议已收到，安全审查通过后会展示进度。'},201);
 }
 if(path.startsWith('/runner/')) {
  if(!env.RUNNER_TOKEN || !req.headers.get('authorization') || await digest(req.headers.get('authorization'))!==await digest(`Bearer ${env.RUNNER_TOKEN}`))return json({error:'unauthorized'},401);
  if(req.method!=='POST')return json({error:'method not allowed'},405);
  const b=await body(req);
  if(path==='/runner/control') {if(typeof b.paused!=='boolean')return json({error:'invalid'},400);await env.DB.prepare('UPDATE control SET paused=? WHERE id=1').bind(Number(b.paused)).run();return json({ok:true});}
  if(path==='/runner/heartbeat') {
   await env.DB.prepare('UPDATE control SET heartbeat=? WHERE id=1').bind(now).run();
   const control=await env.DB.prepare('SELECT paused FROM control WHERE id=1').first();
   if(b.id){const task=await env.DB.prepare('SELECT id FROM tasks WHERE id=? AND lease=? AND lease_until>?').bind(String(b.id),String(b.lease),Date.now()).first();if(!task||control.paused)return json({error:'execution stopped'},409);}
   return json({ok:true});
  }
  if(path==='/runner/claim') {
   await env.DB.prepare('UPDATE control SET heartbeat=? WHERE id=1').bind(now).run();
   await env.DB.prepare("UPDATE tasks SET state='failed',summary='执行租约已过期，成果保留，未自动重跑',updated_at=? WHERE lease_until < ? AND state NOT IN ('completed','failed','rejected','stopped')").bind(now,Date.now()).run();
   const control=await env.DB.prepare('SELECT paused FROM control WHERE id=1').first();if(control.paused)return json({task:null});
   const lease=crypto.randomUUID();
   const task=await env.DB.prepare("UPDATE tasks SET state='claimed',lease=?,lease_until=?,updated_at=? WHERE id=(SELECT id FROM tasks WHERE state='queued' ORDER BY created_at LIMIT 1) AND NOT EXISTS(SELECT 1 FROM tasks WHERE state IN ('claimed','screening','planning','developing','reviewing','publishing')) RETURNING *").bind(lease,Date.now()+3600000,now).first();
   await env.DB.prepare('DELETE FROM limits WHERE key NOT LIKE ?').bind(`%${now.slice(0,10)}%`).run();
   return json({task});
  }
  if(path==='/runner/update') {
   const task=await env.DB.prepare('SELECT * FROM tasks WHERE id=? AND lease=? AND lease_until>?').bind(String(b.id),String(b.lease),Date.now()).first();
   if(!task||terminal.has(task.state)||!(transitions[task.state]||[]).includes(b.state))return json({error:'invalid transition or lease'},409);
   const summary=String(b.summary||'').slice(0,240);
   const pr=b.pr_url||null;
   if(pr&&!/^https:\/\/github\.com\/STEVE-DENG\/(ai-proxy|app-test-agent|ai-judge-agent)\/pull\/\d+$/.test(pr))return json({error:'invalid PR'},400);
   const version=b.version||null, sha=b.commit_sha||null;
   if((version&&!/^v\d+\.\d+\.\d+$/.test(version))||(sha&&!/^[a-f0-9]{40}$/.test(sha)))return json({error:'invalid version'},400);
   if(b.state==='completed'&&(!version||!pr||!sha))return json({error:'incomplete delivery'},400);
   const updated=await env.DB.prepare("UPDATE tasks SET state=?,is_public=CASE WHEN ?='planning' THEN 1 ELSE is_public END,summary=?,updated_at=?,version=COALESCE(?,version),pr_url=COALESCE(?,pr_url),commit_sha=COALESCE(?,commit_sha) WHERE id=? AND state=? AND lease=? RETURNING id").bind(b.state,b.state,summary,now,version,pr,sha,task.id,task.state,b.lease).first();
   if(!updated)return json({error:'conflict'},409);
   await env.DB.prepare('INSERT INTO events(task_id,state,created_at) VALUES(?,?,?)').bind(task.id,b.state,now).run();return json({ok:true});
  }
 }
 return json({error:'not found'},404);
}
export default {async fetch(req,env){
 const allowed=req.headers.get('origin')===env.SITE_ORIGIN;
 let response;
 try {response=req.method==='OPTIONS'?new Response(null,{status:204}):await route(req,env);}catch{response=json({error:'请求处理失败，请稍后重试'},400);}
 if(allowed){response.headers.set('access-control-allow-origin',env.SITE_ORIGIN);response.headers.set('vary','Origin');response.headers.set('access-control-allow-methods','GET, POST, OPTIONS');response.headers.set('access-control-allow-headers','Content-Type');}
 return response;
}};

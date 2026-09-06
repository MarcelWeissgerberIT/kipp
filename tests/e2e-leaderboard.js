const {serve,launch,checker}=require('./helpers');
const PORT=8765;
let rows=[], nextId=1, posts=[];
for(let i=0;i<10;i++) rows.push({id:nextId++,board:'endless-12',name:'BOT',score:5000+i*100,lines:40});
// Fake PostgREST endpoint on the same origin; '/online' serves index.html with the leaderboard configured, '/' without.
const api=(u,req,res,html)=>{
  if(u.pathname==='/rest/v1/highscores'){
    if(req.headers.apikey!=='testkey'){ res.writeHead(401); res.end('{}'); return true; }
    const board=(u.searchParams.get('board')||'').replace('eq.','');
    if(req.method==='POST'){ let b=''; req.on('data',d=>b+=d); req.on('end',()=>{ const o=JSON.parse(b); const row={id:nextId++,...o}; rows.push(row); posts.push(row); res.writeHead(201,{'Content-Type':'application/json'}); res.end(JSON.stringify([row])); }); return true; }
    let list=rows.filter(r=>r.board===board);
    const gt=u.searchParams.get('score'); if(gt&&gt.startsWith('gt.')) list=list.filter(r=>r.score>+gt.slice(3));
    list.sort((a,b)=>b.score-a.score||a.id-b.id);
    if(req.method==='HEAD'){ res.writeHead(206,{'Content-Range':`0-0/${list.length}`}); res.end(); return true; }
    const lim=+(u.searchParams.get('limit')||1000);
    res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(list.slice(0,lim).map(({id,name,score,lines})=>({id,name,score,lines})))); return true;
  }
  if(u.pathname==='/'||u.pathname==='/online'){
    const online=u.pathname==='/online';
    const page=html.replace(/const ONLINE=\{[^\n]*\};/,online?`const ONLINE={url:'http://127.0.0.1:${PORT}',key:'testkey',table:'highscores'};`:"const ONLINE={url:'',key:'',table:'highscores'};");
    if(page===html) throw new Error('config marker not found');
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}); res.end(page); return true;
  }
  return false;
};
const {ok,fails}=checker();
(async()=>{
  const server=await serve(PORT,api);
  const browser=await launch();
  const page=await browser.newPage({viewport:{width:1100,height:900}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{ if(m.type()==='error'&&!/fonts|googleapis|ERR_/.test(m.text())) errors.push(m.text()); });
  // --- offline variant: no tabs
  await page.goto(`http://127.0.0.1:${PORT}/`); await page.waitForTimeout(300);
  await page.click('#startBtn'); await page.waitForTimeout(200);
  ok(await page.evaluate(()=>alive===true),'game starts');
  await page.keyboard.press('p'); await page.waitForTimeout(100);
  ok(await page.evaluate(()=>paused===true&&document.getElementById('pov').classList.contains('show')),'P pauses and shows pause overlay');
  const y1=await page.evaluate(()=>cur&&cur.y); await page.waitForTimeout(1200); const y2=await page.evaluate(()=>cur&&cur.y);
  ok(y1===y2,'piece does not fall while paused');
  const q1=await page.evaluate(()=>quakeT); await page.waitForTimeout(400); const q2=await page.evaluate(()=>quakeT);
  ok(q1===q2,'quake timer frozen while paused');
  await page.keyboard.press('ArrowLeft'); ok(await page.evaluate(()=>cur&&cur.x)!==null,'input ignored check ran');
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  ok(await page.evaluate(()=>paused===false&&!document.getElementById('pov').classList.contains('show')),'Escape resumes');
  await page.click('#pauseBtn'); await page.waitForTimeout(100);
  ok(await page.evaluate(()=>paused===true),'header button pauses');
  ok(await page.evaluate(()=>document.getElementById('quitBtn').textContent==='Main menu'&&document.getElementById('resumeBtn').textContent==='Resume'),'pause buttons labelled (en)');
  await page.click('#quitBtn'); await page.waitForTimeout(200);
  ok(await page.evaluate(()=>!alive&&!paused&&ov.classList.contains('show')&&!document.getElementById('settings').hidden&&document.getElementById('endpanel').hidden&&document.getElementById('startBtn').textContent==='Play'),'quit returns to main menu');
  await page.click('#startBtn'); await page.waitForTimeout(200);
  ok(await page.evaluate(()=>alive===true),'restart from menu works');
  await page.evaluate(()=>{ score=777; lines=3; gameOver(); });
  await page.waitForFunction(()=>!document.getElementById('endpanel').hidden,{timeout:8000});
  ok(await page.evaluate(()=>document.getElementById('hsTabs').hidden),'no world tabs without config');
  ok(await page.evaluate(()=>!document.getElementById('initials').hidden),'initials shown for first local score');
  // --- online variant
  await page.goto(`http://127.0.0.1:${PORT}/online`); await page.waitForTimeout(300);
  await page.click('#startBtn'); await page.waitForTimeout(200);
  await page.evaluate(()=>{ score=1234; lines=5; gameOver(); });
  await page.waitForFunction(()=>!document.getElementById('endpanel').hidden,{timeout:8000});
  ok(await page.evaluate(()=>!document.getElementById('hsTabs').hidden),'world tabs visible with config');
  ok(await page.evaluate(()=>document.querySelector('#hsTabs [data-s="local"]').textContent==='This device'&&document.querySelector('#hsTabs [data-s="world"]').textContent==='World'),'tab labels (en)');
  await page.click('#saveBtn'); await page.waitForTimeout(400);
  ok(posts.length===1&&posts[0].board==='endless-12'&&posts[0].name==='AAA'&&posts[0].score===1234&&posts[0].lines===5,'score submitted online: '+JSON.stringify(posts[0]));
  await page.click('#hsTabs [data-s="world"]'); await page.waitForTimeout(400);
  const worldHtml=await page.evaluate(()=>document.getElementById('hsList').innerHTML);
  ok((worldHtml.match(/<li/g)||[]).length===11&&/BOT/.test(worldHtml),'world list shows top 10');
  ok(/Your rank: 11 worldwide/.test(worldHtml),'rank line shown when not in top 10');
  await page.click('#langBtn'); await page.waitForTimeout(100);
  ok(await page.evaluate(()=>document.querySelector('#hsTabs [data-s="world"]').textContent==='Welt'&&document.getElementById('quitBtn').textContent==='Hauptmenü'),'labels switch to German');
  await page.click('#hsTabs [data-s="local"]'); await page.waitForTimeout(100);
  ok(await page.evaluate(()=>document.querySelector('#hsList li.me')!==null&&document.querySelectorAll('#hsList li').length===1),'local list shows own entry marked');
  // second run with a top score -> marked in world list
  await page.click('#startBtn'); await page.waitForTimeout(200);
  await page.evaluate(()=>{ score=9999; lines=50; gameOver(); });
  await page.waitForFunction(()=>!document.getElementById('endpanel').hidden&&document.getElementById('saveBtn').textContent==='OK',{timeout:8000});
  await page.click('#saveBtn'); await page.waitForTimeout(400);
  await page.click('#hsTabs [data-s="world"]'); await page.waitForTimeout(400);
  const w2=await page.evaluate(()=>{ const li=document.querySelector('#hsList li'); return li.className+'|'+li.textContent; });
  ok(/^me\|1AAA9999/.test(w2),'new top score marked as own in world list: '+w2);
  ok(errors.length===0,'no page errors'+(errors.length?': '+errors.join(' | '):''));
  
  await browser.close(); server.close(); if(fails.length) process.exit(1);
})().catch(e=>{ console.error(e); process.exit(1); });

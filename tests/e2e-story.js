const {serve,launch,checker}=require('./helpers');
const PORT=8766;
const {ok,fails}=checker();
(async()=>{
  const server=await serve(PORT);
  const browser=await launch();
  const page=await browser.newPage({viewport:{width:1100,height:900}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const U=`http://127.0.0.1:${PORT}/`;
  await page.goto(U); await page.waitForTimeout(200);
  ok(await page.evaluate(()=>mode==='endless'&&storyCh===0&&storyLv===0),'fresh start: endless, chapter 1 level 1');
  // play story level 1 and win it
  await page.click('#modes [data-m="story"]'); await page.waitForTimeout(100);
  await page.click('#startBtn'); await page.waitForTimeout(200);
  ok(await page.evaluate(()=>alive&&story!==null),'story level started');
  await page.evaluate(()=>{ score=500; win(); });
  await page.waitForFunction(()=>!document.getElementById('endpanel').hidden,{timeout:8000});
  ok(await page.evaluate(()=>storyLv===1&&document.getElementById('startBtn').textContent==='Next level'),'win advances to level 2');
  await page.reload(); await page.waitForTimeout(200);
  ok(await page.evaluate(()=>mode==='story'&&storyCh===0&&storyLv===1),'after reload: still story mode at level 2');
  ok(await page.evaluate(()=>document.querySelector('#levels [data-lv="1"]').getAttribute('aria-checked')==='true'&&document.querySelector('#modes [data-m="story"]').getAttribute('aria-checked')==='true'),'menu shows level 2 selected in story');
  // unlock chapter 2 via stars, pick chapter 2 level 3, reload
  await page.evaluate(()=>{ const all={}; for(let l=0;l<10;l++) all['0-'+l]=3; for(let l=0;l<3;l++) all['1-'+l]=2; localStorage.setItem('kipp-story',JSON.stringify(all)); });
  await page.reload(); await page.waitForTimeout(200);
  await page.click('#chapters [data-ch="1"]'); await page.waitForTimeout(100);
  ok(await page.evaluate(()=>storyCh===1&&storyLv===3),'chapter 2 auto-selects first open level (4)');
  await page.click('#levels [data-lv="2"]'); await page.waitForTimeout(100);
  await page.reload(); await page.waitForTimeout(200);
  ok(await page.evaluate(()=>mode==='story'&&storyCh===1&&storyLv===2),'after reload: chapter 2 level 3 restored');
  // stale/invalid position falls back safely
  await page.evaluate(()=>{ localStorage.removeItem('kipp-story'); localStorage.setItem('kipp-pos',JSON.stringify({mode:'story',storyCh:2,storyLv:7,chIdx:99})); });
  await page.reload(); await page.waitForTimeout(200);
  ok(await page.evaluate(()=>mode==='story'&&storyCh===0&&storyLv===0&&chIdx===0),'locked chapter in saved position falls back to chapter 1 level 1');
  await page.evaluate(()=>localStorage.setItem('kipp-pos','{broken'));
  await page.reload(); await page.waitForTimeout(200);
  ok(await page.evaluate(()=>mode==='endless'),'corrupt saved position ignored');
  // challenge selection persists too
  await page.click('#modes [data-m="challenge"]'); await page.click('#chlist [data-c="2"]'); await page.reload(); await page.waitForTimeout(200);
  ok(await page.evaluate(()=>mode==='challenge'&&chIdx===2),'challenge selection restored');
  ok(errors.length===0,'no page errors'+(errors.length?': '+errors.join(' | '):''));
  await browser.close(); server.close(); if(fails.length) process.exit(1);
})().catch(e=>{ console.error(e); process.exit(1); });

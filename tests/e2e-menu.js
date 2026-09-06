const {serve,launch,checker}=require('./helpers');
const PORT=8773;
const {ok,fails}=checker();
(async()=>{
  const server=await serve(PORT);
  const browser=await launch();
  const page=await browser.newPage({viewport:{width:1100,height:900}}); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const U=`http://127.0.0.1:${PORT}/`;
  await page.goto(U); await page.waitForTimeout(300);
  // power-up toggle
  ok(await page.evaluate(()=>pups===true&&document.getElementById('pupsBtn').getAttribute('aria-checked')==='true'&&!document.getElementById('pupToggle').hidden),'power-ups default on with visible switch');
  await page.click('#pupsBtn'); await page.reload(); await page.waitForTimeout(300);
  ok(await page.evaluate(()=>pups===false&&document.getElementById('pupsBtn').getAttribute('aria-checked')==='false'),'switch persists off across reload');
  await page.click('#startBtn'); await page.waitForTimeout(150);
  ok(await page.evaluate(()=>{ let n=0; for(let i=0;i<400;i++){ if(makePiece().f.flat().some(v=>v&PUP_MASK)) n++; } return n===0; }),'no power-up pieces are generated when off');
  await page.evaluate(()=>{ pause(); quitToMenu(); }); await page.click('#modes [data-m="daily"]'); await page.waitForTimeout(100);
  ok(await page.evaluate(()=>document.getElementById('pupToggle').hidden),'switch hidden for the daily board');
  await page.click('#startBtn'); await page.waitForTimeout(150);
  ok(await page.evaluate(()=>{ let n=0; for(let i=0;i<400;i++){ if(makePiece().f.flat().some(v=>v&PUP_MASK)) n++; } return n>20; }),'daily board keeps power-ups even when the switch is off');
  await page.evaluate(()=>{ pause(); quitToMenu(); }); await page.click('#modes [data-m="endless"]'); await page.click('#pupsBtn');
  // legend
  await page.click('#legendBtn'); await page.waitForTimeout(200);
  const leg=await page.evaluate(()=>({open:lov.classList.contains('show'),rows:document.querySelectorAll('#legendList .row').length,heads:document.querySelectorAll('#legendList h3').length,title:document.getElementById('lovTitle').textContent,hasIce:document.getElementById('legendList').textContent.includes('Ice'),hasThief:document.getElementById('legendList').textContent.includes('Time thief')}));
  ok(leg.open&&leg.rows===4+2+11&&leg.heads===3&&leg.title==='Legend'&&leg.hasIce&&leg.hasThief,`legend opens with 17 rows in 3 sections (${leg.rows})`);
  await page.keyboard.press('Space'); ok(await page.evaluate(()=>!alive),'Space inside the legend does not start a game');
  await page.keyboard.press('Escape'); ok(await page.evaluate(()=>!lov.classList.contains('show')),'Escape closes the legend');
  await page.click('#langBtn'); await page.click('#legendBtn'); await page.waitForTimeout(100);
  ok(await page.evaluate(()=>document.getElementById('lovTitle').textContent==='Legende'&&document.getElementById('legendList').textContent.includes('Zeitdieb')),'legend is translated');
  await page.click('#lovClose'); await page.click('#langBtn');
  // legend from pause
  await page.click('#startBtn'); await page.waitForTimeout(150); await page.keyboard.press('p'); await page.click('#pLegendBtn'); await page.waitForTimeout(100);
  ok(await page.evaluate(()=>lov.classList.contains('show')&&paused),'legend opens from the pause screen');
  await page.keyboard.press('Escape'); ok(await page.evaluate(()=>!lov.classList.contains('show')&&paused),'closing it returns to pause');
  await page.keyboard.press('Escape'); ok(await page.evaluate(()=>!paused&&alive),'second Escape resumes');
  // background loop
  ok(await page.evaluate(()=>bgRunning===true),'background animates while playing');
  await page.keyboard.press('p'); await page.waitForTimeout(150); ok(await page.evaluate(()=>bgRunning===false),'background stops in pause');
  await page.keyboard.press('p'); await page.waitForTimeout(150); ok(await page.evaluate(()=>bgRunning===true),'background restarts on resume');
  await page.evaluate(()=>{ pause(); quitToMenu(); }); await page.waitForTimeout(150); ok(await page.evaluate(()=>bgRunning===false),'background stops in the menu');
  // ice chapter
  await page.click('#modes [data-m="story"]'); await page.waitForTimeout(100);
  ok(await page.evaluate(()=>STORY_CH.length===4&&document.querySelectorAll('#chapters button').length===4&&document.querySelector('#chapters [data-ch="3"]').disabled),'story has a fourth (ice) chapter, locked at first');
  await page.evaluate(()=>{ const all={}; for(let c=0;c<3;c++)for(let l=0;l<10;l++) all[c+'-'+l]=3; localStorage.setItem('kipp-story',JSON.stringify(all)); renderModes(); });
  await page.click('#chapters [data-ch="3"]'); await page.click('#startBtn'); await page.waitForTimeout(150);
  ok(await page.evaluate(()=>story&&story.theme==='ice'&&themeKey==='ice'&&N===10&&story.id==='story-3-0'),'ice chapter unlocks after metal and plays on ice');
  await page.evaluate(()=>{ pause(); quitToMenu(); });
  // resume run
  await page.click('#modes [data-m="endless"]'); await page.click('#themes [data-t="stone"]'); await page.click('#startBtn'); await page.waitForTimeout(150);
  await page.evaluate(()=>{ for(let x=0;x<6;x++){ grid[N-1][x]=1+x; ids[N-1][x]=pieceId++; } score=777; lines=3; charges=2; runSave(); });
  await page.reload(); await page.waitForTimeout(300);
  ok(await page.evaluate(()=>!document.getElementById('resumeRunBtn').hidden&&!alive),'menu offers to continue the saved run');
  await page.click('#resumeRunBtn'); await page.waitForTimeout(200);
  ok(await page.evaluate(()=>alive&&score===777&&lines===3&&charges===2&&grid[N-1][5]===6&&themeKey==='stone'&&mode==='endless'&&!!cur),'run restored with board, score, material and a falling piece');
  await page.evaluate(()=>{ pause(); quitToMenu(); }); await page.waitForTimeout(100);
  ok(await page.evaluate(()=>document.getElementById('resumeRunBtn').hidden&&!localStorage.getItem('kipp-run')),'quitting to the menu discards the save');
  await page.click('#startBtn'); await page.waitForTimeout(150); await page.evaluate(()=>{ score=5; gameOver(); }); await page.waitForFunction(()=>!document.getElementById('endpanel').hidden,{timeout:8000});
  ok(await page.evaluate(()=>!localStorage.getItem('kipp-run')),'game over discards the save');
  await page.click('#menuBtn'); await page.click('#modes [data-m="story"]'); await page.click('#startBtn'); await page.waitForTimeout(150);
  await page.evaluate(()=>runSave()); ok(await page.evaluate(()=>!localStorage.getItem('kipp-run')),'story runs are not saved');
  // PWA
  const man=await page.evaluate(async()=>{ const r=await fetch('manifest.webmanifest'); const m=await r.json(); return {name:m.short_name,icons:m.icons.length,link:!!document.querySelector('link[rel=manifest]')}; });
  ok(man.name==='Kipp'&&man.icons===3&&man.link,'manifest served and linked');
  ok(await page.evaluate(async()=>(await fetch('sw.js')).ok&&(await fetch('icon-192.png')).ok&&(await fetch('icon-512.png')).ok),'service worker and icons are served');
  // landscape phone layout
  const land=await browser.newPage({viewport:{width:844,height:390}}); await land.goto(U); await land.waitForTimeout(300);
  const L=await land.evaluate(()=>{ const b=cv.getBoundingClientRect(), d=document.querySelector('.dpad').getBoundingClientRect(); return {board:Math.round(b.width),dpadRight:d.left>b.right,scrollH:document.documentElement.scrollHeight}; });
  ok(L.board>=240&&L.dpadRight&&L.scrollH<=440,`landscape phone: board ${L.board}px with the D-pad beside it, page height ${L.scrollH}`);
  ok(errors.length===0,'no page errors'+(errors.length?': '+errors.join(' | '):''));
  await browser.close(); server.close(); if(fails.length) process.exit(1);
})().catch(e=>{ console.error(e); process.exit(1); });

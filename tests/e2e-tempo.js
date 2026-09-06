const {serve,launch,checker}=require('./helpers');
const PORT=8769;
const {ok,fails}=checker();
(async()=>{
  const server=await serve(PORT);
  const browser=await launch();
  const page=await browser.newPage({viewport:{width:1100,height:900}}); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/`); await page.waitForTimeout(300);
  await page.click('#startBtn'); await page.waitForTimeout(150);
  ok(await page.evaluate(()=>speedStep===0&&tempo()===1),'starts at normal tempo');
  // measure fall speed: rows per 3 s at tempo 1 vs after 3 steps
  const rate=async()=>{ await page.evaluate(()=>{ cur.y=0; }); const y0=await page.evaluate(()=>cur.y); await page.waitForTimeout(3000); return (await page.evaluate(()=>cur.y))-y0; };
  const r1=await rate();
  await page.evaluate(()=>{ speedT0-=185000; }); await page.waitForTimeout(250);
  ok(await page.evaluate(()=>speedStep===6&&Math.abs(tempo()-Math.pow(.94,6))<1e-9),'after 185 s of play: step 6, tempo .94^6');
  ok(await page.evaluate(()=>toast&&toast.text==='Faster!'),'faster toast shown');
  const r2=await rate();
  ok(r2>r1,`piece falls faster (${r1} → ${r2} rows per 3 s)`);
  // pause does not count as play time
  await page.keyboard.press('p'); await page.waitForTimeout(700); await page.keyboard.press('p'); await page.waitForTimeout(100);
  ok(await page.evaluate(()=>speedStep===6),'pause did not advance the tempo');
  // story mode: no time speed-up
  await page.evaluate(()=>{ pause(); quitToMenu(); }); await page.click('#modes [data-m="story"]'); await page.click('#startBtn'); await page.waitForTimeout(150);
  await page.evaluate(()=>{ speedT0-=95000; }); await page.waitForTimeout(250);
  ok(await page.evaluate(()=>speedStep===3&&Math.abs(tempo()-Math.pow(.94,3))<1e-9),'story mode speeds up too');
  await page.evaluate(()=>{ pause(); quitToMenu(); }); await page.click('#tutBtn'); await page.waitForTimeout(200); await page.evaluate(()=>{ speedT0-=95000; }); await page.waitForTimeout(250);
  ok(await page.evaluate(()=>tempo()===1),'tutorial stays at normal tempo');
  ok(errors.length===0,'no page errors'+(errors.length?': '+errors.join(' | '):''));
  await browser.close(); server.close(); if(fails.length) process.exit(1);
})().catch(e=>{ console.error(e); process.exit(1); });

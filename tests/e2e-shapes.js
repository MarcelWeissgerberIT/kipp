const {serve,launch,checker}=require('./helpers');
const PORT=8771;
const {ok,fails}=checker();
(async()=>{
  const server=await serve(PORT);
  const browser=await launch();
  const page=await browser.newPage({viewport:{width:1100,height:900}}); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/`); await page.waitForTimeout(300);
  const stats=await page.evaluate(()=>{ const box=m=>m.length<=4&&m[0].length<=4; const cells=l=>l.map(cellsOf); return {
    ext:{n:SHAPE_SETS.ext.list.length,min:Math.min(...cells(SHAPE_SETS.ext.list)),max:Math.max(...cells(SHAPE_SETS.ext.list)),box:SHAPE_SETS.ext.list.every(box)},
    ultra:{n:SHAPE_SETS.ultra.list.length,min:Math.min(...cells(SHAPE_SETS.ultra.list)),max:Math.max(...cells(SHAPE_SETS.ultra.list)),box:SHAPE_SETS.ultra.list.every(box)},
    std:SHAPE_SETS.std.list.length }; });
  ok(stats.std===8&&stats.ext.min===4&&stats.ext.max===8&&stats.ext.box,`extended: ${stats.ext.n} shapes, 4–8 blocks, all within 4×4`);
  ok(stats.ultra.min===4&&stats.ultra.max===16&&stats.ultra.box&&stats.ultra.n>stats.ext.n,`ultra: ${stats.ultra.n} shapes, 4–16 blocks, all within 4×4`);
  ok(await page.evaluate(()=>!document.getElementById('shapes').hidden&&document.querySelectorAll('#shapes button').length===3&&document.querySelector('#shapes [data-sh="std"]').getAttribute('aria-checked')==='true'),'shape switch rendered, Standard selected');
  await page.click('#shapes [data-sh="ultra"]'); await page.click('#startBtn'); await page.waitForTimeout(150);
  ok(await page.evaluate(()=>SHAPES.length===SHAPE_SETS.ultra.list.length&&Math.abs(mult-1.5*1.6)<1e-9&&hsKey()==='endless-12-ultra'),'ultra run: full set, multiplier 1.5×1.6, own leaderboard key');
  const dist=await page.evaluate(()=>{ const c={}; for(let i=0;i<4000;i++){ const k=cellsOf(SHAPES[pickShape()]); c[k]=(c[k]||0)+1; } return c; });
  ok(dist[4]>dist[16]*2&&Object.keys(dist).every(k=>k>=4&&k<=16),'big shapes are rarer than small ones ('+JSON.stringify(dist)+')');
  const big=await page.evaluate(()=>{ const i=SHAPES.findIndex(m=>cellsOf(m)===16); next={i,f:SHAPES[i].map(r=>r.map(()=>0))}; spawn(); drawNext(); return cur.m.length===4&&cur.m[0].length===4&&cur.x===4&&cur.col>=1&&cur.col<=8; });
  ok(big,'16-block piece spawns centred with a valid colour and previews');
  await page.evaluate(()=>{ pause(); quitToMenu(); }); await page.reload(); await page.waitForTimeout(300);
  ok(await page.evaluate(()=>shapeSet==='ultra'&&document.querySelector('#shapes [data-sh="ultra"]').getAttribute('aria-checked')==='true'),'shape set persists across reload');
  await page.click('#modes [data-m="story"]'); await page.click('#startBtn'); await page.waitForTimeout(150);
  ok(await page.evaluate(()=>SHAPES.length===8&&SHAPES===SHAPES_STD),'story mode always uses the standard set');
  await page.evaluate(()=>{ pause(); quitToMenu(); }); await page.click('#modes [data-m="endless"]'); await page.click('#shapes [data-sh="ext"]'); await page.click('#startBtn'); await page.waitForTimeout(150);
  ok(await page.evaluate(()=>SHAPES.every(m=>cellsOf(m)>=4&&cellsOf(m)<=8)&&Math.abs(mult-1.5*1.3)<1e-9),'extended run: only 4–8 block shapes, multiplier 1.3');
  await page.evaluate(()=>{ pause(); quitToMenu(); }); await page.click('#shapes [data-sh="std"]'); await page.waitForTimeout(100);
  ok(errors.length===0,'no page errors'+(errors.length?': '+errors.join(' | '):''));
  await browser.close(); server.close(); if(fails.length) process.exit(1);
})().catch(e=>{ console.error(e); process.exit(1); });

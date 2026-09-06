const {serve,launch,checker}=require('./helpers');
const PORT=8772;
const {ok,fails}=checker();
(async()=>{
  const server=await serve(PORT);
  const browser=await launch();
  const page=await browser.newPage({viewport:{width:1100,height:900}}); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/`); await page.waitForTimeout(300);
  ok(await page.evaluate(()=>document.querySelectorAll('#themes button').length===4&&!!THEMES.ice&&MATS[4]==='ice'),'four materials incl. ice');
  await page.click('#themes [data-t="ice"]'); await page.click('#startBtn'); await page.waitForTimeout(150);
  const reset=()=>page.evaluate(()=>{ grid=empty(); ids=empty(); flags=empty(); cur=null; busy=false; toast=null; charges=3; score=0; lines=0; level=1; quakeReset(); });
  const fillRow=(y,gaps,fx)=>page.evaluate(([y,gaps,fx])=>{ for(let x=0;x<N;x++) if(!gaps.includes(x)){ grid[y][x]=1+x%8; ids[y][x]=pieceId++; flags[y][x]=fx&&fx[x]||0; } },[y,gaps,fx||{}]);
  // slide
  await reset(); await page.evaluate(()=>{ grid[N-1][5]=1; ids[N-1][5]=pieceId++; tip(1); });
  await page.waitForTimeout(1800);
  ok(await page.evaluate(()=>{ let n=0; grid.forEach(r=>r.forEach(v=>{ if(v)n++; })); return n===1&&!!grid[N-1][N-1]; }),'ice body slides to the wall after a tip to the right');
  // shatter
  await reset(); await page.evaluate(()=>{ const id=pieceId++; [[N-1,2],[N-1,3],[N-2,3]].forEach(([y,x])=>{ grid[y][x]=2; ids[y][x]=id; }); shatterIce(); });
  ok(await page.evaluate(()=>new Set([ids[N-1][2],ids[N-1][3],ids[N-2][3]]).size===3&&toast&&toast.text==='Ice shatters!'),'auto-tip shatters ice bodies into single cells');
  // sweep
  await reset(); await fillRow(11,[]); const s0=await page.evaluate(()=>score); await page.evaluate(()=>resolve(()=>{})); await page.waitForTimeout(600);
  ok(await page.evaluate(s0=>!grid.some(r=>r.some(v=>v))&&score-s0>=1000*1.5&&toast&&toast.sub.includes('Clean sweep!'),s0),'clean sweep on ice pays the bonus');
  // mix includes ice
  ok(await page.evaluate(()=>{ mix=true; const m=new Set(); for(let i=0;i<300;i++){ const p=makePiece(); p.f.flat().forEach(v=>{ if(v) m.add(matOf(v)); }); } mix=false; return m.has(4)&&m.has(1)&&m.has(2)&&m.has(3); }),'material mix draws all four materials');
  // acid
  await reset(); await fillRow(9,[],{4:1024}); await page.evaluate(()=>{ [[10,4],[11,4],[11,3]].forEach(([y,x])=>{ grid[y][x]=3; ids[y][x]=pieceId++; }); resolve(()=>{}); }); await page.waitForTimeout(600);
  ok(await page.evaluate(()=>lines===1&&grid[11][4]===0&&grid[10][4]===0&&grid[11][3]===3),'acid dissolves the column below its row, neighbour column stays');
  // mirror
  await reset(); await page.evaluate(()=>{ grid[11][2]=1; ids[11][2]=pieceId++; flags[11][2]=FLAG_R; tip(-1); });
  ok(await page.evaluate(()=>stage.classList.contains('tipR')&&!(flags[11][2]&FLAG_R)),'mirror flips a left tip into a right tip and is consumed'); await page.waitForTimeout(1500);
  // feather
  await reset(); await fillRow(11,[],{6:4096}); await page.evaluate(()=>resolve(()=>{})); await page.waitForTimeout(600);
  ok(await page.evaluate(()=>featherPending===1),'feather row queues one slow piece');
  await page.evaluate(()=>{ spawn(); }); ok(await page.evaluate(()=>curSlow===true&&featherPending===0),'next piece is slow');
  await page.evaluate(()=>{ cur=null; spawn(); }); ok(await page.evaluate(()=>curSlow===false),'the piece after that is normal again');
  // glue
  await reset(); await page.evaluate(()=>{ cur={m:[[1,1]],f:[[FLAG_K,0]],col:2,x:0,y:10,ghost:false}; lock(); });
  ok(await page.evaluate(()=>(flags[10][0]&FLAG_A)&&(flags[10][1]&FLAG_A)&&(flags[10][1]&FLAG_K)&&toast&&toast.text==='Stuck!'),'glue piece landing at the wall sticks like an anchor');
  await page.evaluate(()=>releaseGlue()); ok(await page.evaluate(()=>(flags[10][0]&FLAG_A)&&(flags[10][0]&FLAG_K1)),'first tip: still stuck');
  await page.evaluate(()=>releaseGlue()); ok(await page.evaluate(()=>!(flags[10][0]&(FLAG_A|FLAG_K|FLAG_K1))&&!(flags[10][1]&FLAG_A)),'second tip: released');
  await reset(); await page.evaluate(()=>{ cur={m:[[1,1]],f:[[FLAG_K,0]],col:2,x:5,y:10,ghost:false}; lock(); });
  ok(await page.evaluate(()=>!(flags[10][5]&(FLAG_A|FLAG_K))),'glue away from the wall does nothing');
  // joker
  await reset(); await page.evaluate(()=>{ grid[0][0]=1; ids[0][0]=pieceId++; for(let x=0;x<6;x++){ grid[11][x]=3; ids[11][x]=pieceId++; } for(let x=6;x<9;x++){ grid[11][x]=2; ids[11][x]=pieceId++; } cur={m:[[1]],f:[[FLAG_J]],col:5,x:9,y:11,ghost:false}; lock(); });
  ok(await page.evaluate(()=>grid[11][9]===3),'joker takes the dominant colour of its row');
  const j0=await page.evaluate(()=>{ for(let x=10;x<12;x++){ grid[11][x]=1; ids[11][x]=pieceId++; } const s=score; resolve(()=>{}); return s; }); await page.waitForTimeout(600);
  ok(await page.evaluate(j0=>score-j0===Math.round(100*1*1.5*2)&&toast.sub.includes('Joker ×2'),j0),'joker row scores double');
  // thief
  await reset(); await page.evaluate(()=>{ quakeT=1000; }); await fillRow(11,[],{2:65536}); await page.evaluate(()=>resolve(()=>{})); await page.waitForTimeout(600);
  ok(await page.evaluate(()=>quakeT>quakeMax-1500&&quakeT>5000),'time thief resets the auto-tip timer');
  // responsive canvas
  ok(await page.evaluate(()=>cv.width>=320&&Math.abs(CELL*N-cv.width)<1e-6),'canvas resolution matches board and cell size');
  const big=await browser.newPage({viewport:{width:1920,height:1080}}); await big.goto(`http://127.0.0.1:${PORT}/`); await big.waitForTimeout(300);
  await big.evaluate(()=>{ themeKey='ice'; applyTheme(); }); await big.click('#startBtn'); await big.waitForTimeout(200);
  const dims=await big.evaluate(()=>({css:Math.round(cv.getBoundingClientRect().width),px:cv.width,cell:CELL}));
  ok(dims.css>600&&dims.px>=dims.css&&Math.abs(dims.cell*12-dims.px)<1e-6,`1920×1080: board ${dims.css}px on screen, ${dims.px}px canvas`);
  await big.evaluate(`(()=>{ for(let y=N-5;y<N;y++){ const gap=(y*3)%(N-3); for(let x=0;x<N;x++) if(x<gap||x>=gap+3){ grid[y][x]=1+(x*7+y*3)%8; ids[y][x]=pieceId++; } } flags[N-1][1]=FLAG_X; flags[N-1][2]=FLAG_R; flags[N-1][3]=FLAG_H; flags[N-1][4]=FLAG_K|FLAG_A; flags[N-1][5]=FLAG_J; flags[N-1][6]=FLAG_T; flags[N-2][1]=FLAG_B; flags[N-2][2]=FLAG_M; charges=4; score=4820; lines=17; level=3; draw(); })()`);
  await big.waitForTimeout(200); 
  const small=await browser.newPage({viewport:{width:390,height:844}}); await small.goto(`http://127.0.0.1:${PORT}/`); await small.waitForTimeout(300);
  ok(await small.evaluate(()=>Math.round(cv.getBoundingClientRect().width)===Math.round(390*.92)&&document.documentElement.scrollWidth<=390),'390px: board is 92vw, no horizontal scroll');
  const land=await browser.newPage({viewport:{width:844,height:390}}); await land.goto(`http://127.0.0.1:${PORT}/`); await land.waitForTimeout(300);
  ok(await land.evaluate(()=>{ const w=Math.round(cv.getBoundingClientRect().width); return w>=240&&w<=300; }),'landscape phone: board sized by the height');
  ok(errors.length===0,'no page errors'+(errors.length?': '+errors.join(' | '):''));
  await browser.close(); server.close(); if(fails.length) process.exit(1);
})().catch(e=>{ console.error(e); process.exit(1); });

const {serve,launch,checker}=require('./helpers');
const PORT=8770;
const {ok,fails}=checker();
(async()=>{
  const server=await serve(PORT);
  const browser=await launch();
  const page=await browser.newPage({viewport:{width:1100,height:900}}); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/`); await page.waitForTimeout(300);
  await page.evaluate(()=>{ themeKey='jelly'; applyTheme(); }); await page.click('#startBtn'); await page.waitForTimeout(150);
  const reset=()=>page.evaluate(()=>{ clearInterval(timer); grid=empty(); ids=empty(); flags=empty(); cur=null; busy=false; toast=null; chain=0; lines=0; charges=1; draw(); });
  const fillRow=(y,skip)=>page.evaluate(([y,skip])=>{ for(let x=0;x<N;x++) if(!skip.includes(x)){ grid[y][x]=1+x%8; ids[y][x]=pieceId++; flags[y][x]=0; } },[y,skip]);
  // --- Bomb: clears the 3x3 neighbours outside the cleared row
  await reset(); await fillRow(11,[]); await fillRow(10,[0,1,2,9,10,11]);
  await page.evaluate(()=>{ flags[11][5]|=FLAG_B; });
  await page.evaluate(()=>resolve(()=>{})); await page.waitForTimeout(700);
  const bomb=await page.evaluate(()=>({row:grid[11].slice(3,9).join(''),lines,sub:toast&&toast.sub}));
  ok(bomb.row==='400081'&&bomb.lines===1,'bomb clears neighbours 4-6 above the row, keeps 3 and 7 ('+bomb.row+')');
  ok(/Boom/.test(bomb.sub||''),'boom note in toast');
  // --- Frost: quake bar freezes for 10 s
  await reset(); await fillRow(11,[]); await page.evaluate(()=>{ flags[11][2]|=FLAG_F; quakeT=20000; });
  await page.evaluate(()=>resolve(()=>{})); await page.waitForTimeout(600);
  const q1=await page.evaluate(()=>quakeT); await page.waitForTimeout(500); const q2=await page.evaluate(()=>quakeT);
  ok(q1===q2&&q1===20000,'quake timer frozen after frost row');
  ok(await page.evaluate(()=>document.getElementById('quakeRow').classList.contains('frozen')&&document.getElementById('quakeIcon').textContent==='❄'),'bar shows frozen state');
  await page.evaluate(()=>{ quakeFreezeUntil=0; }); await page.waitForTimeout(300);
  ok(await page.evaluate(()=>quakeT<20000&&document.getElementById('quakeIcon').textContent==='〰'),'timer resumes after the freeze');
  // --- Double charge: +2 for that row
  await reset(); await fillRow(11,[]); await page.evaluate(()=>{ charges=1; flags[11][7]|=FLAG_D; });
  await page.evaluate(()=>resolve(()=>{})); await page.waitForTimeout(600);
  ok(await page.evaluate(()=>charges===3),'charge piece refills two charges');
  // --- Magnet: welds neighbouring bodies on tip
  await reset(); await page.evaluate(()=>{ grid[11][0]=1; ids[11][0]=100; grid[11][1]=2; ids[11][1]=101; flags[11][1]=FLAG_M; grid[11][2]=3; ids[11][2]=102; grid[11][4]=4; ids[11][4]=103; weldMagnets(); });
  const mg=await page.evaluate(()=>({a:ids[11][0],b:ids[11][1],c:ids[11][2],d:ids[11][4],fl:flags[11][1]}));
  ok(mg.a===mg.b&&mg.b===mg.c&&mg.d!==mg.a&&mg.fl===0,'magnet welds its neighbours into one body and is used up');
  // --- Ghost piece: falls through into a hole
  await reset(); await fillRow(9,[0]); await fillRow(10,[0]); await fillRow(11,[5,6,7]);
  await page.evaluate(()=>{ cur={m:[[1,1,1]],f:[[FLAG_G,FLAG_G,FLAG_G]],col:2,x:5,y:0,ghost:true}; });
  ok(await page.evaluate(()=>ghostTarget(cur.m,cur.x)===11),'ghost target is the hole in the bottom row');
  ok(await page.evaluate(()=>canBe(cur.m,10,0)===false&&canBe(cur.m,4,0)===true),'ghost respects walls, moves freely above the stack');
  await page.evaluate(()=>{ step(); step(); }); ok(await page.evaluate(()=>cur.y===2&&hits(cur.m,cur.x,cur.y)===false),'ghost steps down one row at a time');
  await page.evaluate(()=>{ for(let i=0;i<9;i++) step(); }); ok(await page.evaluate(()=>cur&&cur.y===11),'ghost passes through rows 9 and 10');
  await page.evaluate(()=>drop()); await page.waitForTimeout(700);
  ok(await page.evaluate(()=>lines===1&&grid[11][0]===0&&grid[11].slice(1).every(v=>v)&&grid[10][0]===0),'ghost fills the hole, only the bottom row clears');
  // --- Jelly bounce: a jelly body that fell 3+ rows hops back up one
  await reset(); await page.evaluate(()=>{ grid[0][3]=1; ids[0][3]=200; fallCount.clear(); settleAnimated(()=>{}); }); await page.waitForTimeout(1500);
  ok(await page.evaluate(()=>grid[10][3]===1&&grid[11][3]===0),'jelly body bounces one cell up after a long fall');
  await page.evaluate(()=>{ themeKey='stone'; applyTheme(); }); await reset(); await page.evaluate(()=>{ grid[0][3]=1; ids[0][3]=201; fallCount.clear(); settleAnimated(()=>{}); }); await page.waitForTimeout(1500);
  ok(await page.evaluate(()=>grid[11][3]===1),'stone body does not bounce');
  // --- makePiece produces power-ups and the tutorial does not
  const dist=await page.evaluate(()=>{ mode='endless'; const c={}; for(let i=0;i<3000;i++){ const f=makePiece().f.flat().reduce((a,v)=>a|v,0)&PUP_MASK; if(f) c[f]=(c[f]||0)+1; } return c; });
  ok(Object.keys(dist).length===11&&[32,64,128,256,512,1024,2048,4096,8192,32768,65536].every(k=>dist[k]>0),'all eleven power-ups are generated: '+JSON.stringify(dist));
  ok(await page.evaluate(()=>{ mode='tutorial'; for(let i=0;i<500;i++){ if(makePiece().f.flat().reduce((a,v)=>a|v,0)&PUP_MASK) return false; } mode='endless'; return true; }),'no power-ups in the tutorial');
  ok(errors.length===0,'no page errors'+(errors.length?': '+errors.join(' | '):''));
  await reset(); await page.evaluate(()=>{ themeKey='jelly'; applyTheme(); const set=(x,y,c,f)=>{ grid[y][x]=c; ids[y][x]=pieceId++; flags[y][x]=f; }; set(1,11,1,FLAG_A); set(2,11,2,FLAG_C); set(3,11,3,FLAG_B); set(4,11,4,FLAG_M); set(5,11,5,FLAG_F); set(6,11,6,FLAG_D); cur={m:[[1,1],[1,1]],f:[[FLAG_G,FLAG_G],[FLAG_G,FLAG_G]],col:4,x:8,y:8,ghost:true}; next={i:2,f:[[FLAG_G,FLAG_G],[FLAG_G,FLAG_G]]}; draw(); });
  await page.waitForTimeout(200); await page.screenshot({path:'pups.png',clip:{x:330,y:140,width:440,height:530}});
  await browser.close(); server.close(); if(fails.length) process.exit(1);
})().catch(e=>{ console.error(e); process.exit(1); });

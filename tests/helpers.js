// Shared harness: serves index.html from the repo root on a local port and launches Chromium.
// Set CHROME_PATH to use a specific browser binary (otherwise Playwright's bundled Chromium).
const http=require('http'), fs=require('fs'), path=require('path');
const ROOT=path.join(__dirname,'..');
const {chromium}=require('playwright');
function serve(port,transform){
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  const server=http.createServer((req,res)=>{
    const u=new URL(req.url,'http://x');
    if(transform&&transform(u,req,res,html)) return;
    if(u.pathname==='/'||u.pathname==='/index.html'||u.pathname==='/online'){ res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}); return res.end(html); }
    const f=path.join(ROOT,u.pathname.replace(/^\/+/,'')); if(fs.existsSync(f)&&fs.statSync(f).isFile()){ const ext=path.extname(f); res.writeHead(200,{'Content-Type':{'.js':'text/javascript','.webmanifest':'application/manifest+json','.json':'application/json','.png':'image/png','.md':'text/markdown','.sql':'text/plain'}[ext]||'application/octet-stream'}); return res.end(fs.readFileSync(f)); }
    res.writeHead(404); res.end();
  });
  return new Promise(r=>server.listen(port,()=>r(server)));
}
async function launch(){ return chromium.launch({executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']}); }
function checker(){ const fails=[]; let n=0; const ok=(c,m)=>{ n++; if(!c){ fails.push(m); console.error('  FAIL:',m); } else console.log('  ok:',m); }; return {ok,fails,count:()=>n}; }
module.exports={serve,launch,checker,ROOT};

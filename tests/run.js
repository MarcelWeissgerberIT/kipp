// Runs every tests/e2e-*.js file in sequence and exits non-zero if any check failed.
const {execFileSync}=require('child_process'), fs=require('fs'), path=require('path');
const files=fs.readdirSync(__dirname).filter(f=>/^e2e-.*\.js$/.test(f)).sort();
let failed=0;
for(const f of files){
  console.log('\n▶ '+f);
  try{ execFileSync(process.execPath,[path.join(__dirname,f)],{stdio:'inherit',timeout:180000}); }
  catch(e){ failed++; }
}
console.log(`\n${files.length-failed}/${files.length} suites passed`);
process.exit(failed?1:0);

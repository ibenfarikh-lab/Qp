import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const required = [
  'app/page.jsx','app/customer/page.jsx','app/admin/page.jsx','app/globals.css',
  'components/StoreContext.jsx','components/CustomerSessionContext.jsx',
  'lib/services/productService.js','lib/services/orderService.js','lib/services/chatService.js',
  'functions/index.js','firestore.rules','firestore.indexes.json','public/manifest.webmanifest','public/sw.js'
];
const results = [];
for (const rel of required) results.push({check:`required:${rel}`,pass:fs.existsSync(path.join(root,rel))});
const sourceDirs = ['lib','functions','scripts'];
for (const dir of sourceDirs) {
  const walk = d => fs.readdirSync(path.join(root,d),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
  for (const file of walk(dir).filter(f=>/\.(js|jsx|mjs)$/.test(f))) {
    try { execFileSync('node',['--check',path.join(root,file)],{stdio:'pipe'}); results.push({check:`syntax:${file}`,pass:true}); }
    catch { results.push({check:`syntax:${file}`,pass:false}); }
  }
}
const rules=fs.readFileSync(path.join(root,'firestore.rules'),'utf8');
const fn=fs.readFileSync(path.join(root,'functions/index.js'),'utf8');
const orderFn=fn.slice(fn.indexOf('exports.createCustomerOrder'), fn.indexOf('exports.', fn.indexOf('exports.createCustomerOrder') + 1));
results.push({check:'security:no-client-order-create',pass:rules.includes('allow create: if false') || !/pesanan.*allow create: if signedIn\(\)/s.test(rules)});
results.push({check:'security:callable-customer-store-decoupled',pass:!orderFn.includes('user.tokoId !== tokoId')});
const failed=results.filter(x=>!x.pass);
console.log(JSON.stringify({status:failed.length?'FAIL':'PASS',checked:results.length,failed:failed.map(x=>x.check)},null,2));
process.exit(failed.length?1:0);

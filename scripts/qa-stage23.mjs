import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [];
function check(name, ok, detail='') { checks.push({name, ok, detail}); }

const fn = read('functions/index.js');
const rules = read('firestore.rules');
const checkout = read('components/CheckoutModal.jsx');
const firebase = read('firebase.json');

check('Trusted callable exists', fn.includes('exports.createCustomerOrder'));
check('Callable requires authentication', fn.includes("request.auth?.uid"));
check('Callable rejects admin checkout', fn.includes("role || '').toLowerCase() === 'admin'"));
check('Callable validates toko ownership', fn.includes('user.tokoId !== tokoId'));
check('Callable canonicalizes product data', fn.includes('product.aktif === false') && fn.includes('product.hargaJual ?? product.harga'));
check('Callable recalculates total', fn.includes('canonicalItems.reduce'));
check('Idempotency uses deterministic document id', fn.includes('makeIdempotencyDocId(uid, requestId)'));
check('Idempotency commit is transactional', fn.includes('db.runTransaction') && fn.includes('transaction.create(orderRef, orderData)'));
check('Client calls trusted callable', checkout.includes("httpsCallable('createCustomerOrder')"));
check('Direct client order creation is denied', rules.includes('allow create: if false;'));
check('Legacy toko_v13 absent from source', !['app','components','lib','functions'].some(dir => {
  const base = path.join(root, dir);
  if (!fs.existsSync(base)) return false;
  const files = [];
  const walk = (d) => { for (const e of fs.readdirSync(d,{withFileTypes:true})) { const f=path.join(d,e.name); if(e.isDirectory()) walk(f); else files.push(f); } };
  walk(base);
  return files.some(f => fs.readFileSync(f,'utf8').includes('toko_v13'));
}));
check('Firebase config includes Firestore rules/indexes', firebase.includes('firestore.rules') && firebase.includes('firestore.indexes.json'));

let failed = 0;
for (const c of checks) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'} | ${c.name}${c.detail ? ` | ${c.detail}` : ''}`);
  if (!c.ok) failed++;
}
console.log(`\n${checks.length - failed}/${checks.length} static checks passed.`);
process.exitCode = failed ? 1 : 0;

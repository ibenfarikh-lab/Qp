import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const required = [
  'package.json', 'next.config.js', 'firebase.json', '.firebaserc',
  'firestore.rules', 'firestore.indexes.json', 'functions/package.json',
  'functions/index.js', '.env.example', 'functions/.env.example',
  'docs/V4/V4-DOCUMENTATION.md'
];
const forbidden = ['.env', 'functions/.env'];
let failures = [];
for (const file of required) if (!fs.existsSync(path.join(root, file))) failures.push(`missing: ${file}`);
for (const file of forbidden) if (fs.existsSync(path.join(root, file))) failures.push(`secret env committed: ${file}`);
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.scripts?.build !== 'next build') failures.push('package.json build script is not next build');
const fnPkg = JSON.parse(fs.readFileSync(path.join(root, 'functions/package.json'), 'utf8'));
if (fnPkg.engines?.node !== '20') failures.push('Functions Node engine must remain 20');
const fb = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'));
if (fb.functions?.source !== 'functions') failures.push('Firebase Functions source must be functions');
console.log(JSON.stringify({status: failures.length ? 'FAIL' : 'PASS', checks: required.length + forbidden.length + 3, failures}, null, 2));
process.exitCode = failures.length ? 1 : 0;

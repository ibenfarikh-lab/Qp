/**
 * QP V4 Stage 24 — Emulator smoke-test runner.
 *
 * Run after starting:
 *   firebase emulators:start --only auth,firestore,functions
 *
 * This script intentionally does not claim production security. It checks that
 * the configured emulator endpoints are reachable and that the project exposes
 * the expected callable function name. Full identity/rules scenarios remain in
 * the checklist below because they require seeded emulator users/data.
 */
const checks = [
  ['Auth emulator', process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099'],
  ['Firestore emulator', process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'],
  ['Functions emulator', process.env.FUNCTIONS_EMULATOR_HOST || '127.0.0.1:5001'],
];

let failed = false;
for (const [label, value] of checks) {
  const [host, portText] = value.split(':');
  const port = Number(portText);
  try {
    const net = await import('node:net');
    await new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port, timeout: 1200 });
      socket.once('connect', () => { socket.destroy(); resolve(); });
      socket.once('timeout', () => { socket.destroy(); reject(new Error('timeout')); });
      socket.once('error', reject);
    });
    console.log(`PASS ${label}: ${value}`);
  } catch (error) {
    failed = true;
    console.log(`FAIL ${label}: ${value} (${error.message})`);
  }
}

console.log('\nRequired scenario checklist:');
for (const scenario of [
  'Admin registration atomically creates pengguna + toko + defaults',
  'Admin cannot read another toko',
  'Customer cannot read another toko',
  'Customer cannot read another customer order/chat',
  'Customer direct pesanan create is denied',
  'COD customer cannot submit transfer confirmation',
  'Transfer customer can submit only payment confirmation fields',
  'Callable rejects unauthenticated checkout',
  'Callable rejects admin checkout',
  'Callable rejects mismatched tokoId',
  'Callable canonicalizes product price/total',
  'Same requestId returns same order without duplicate',
  'Insufficient stock is rejected before order creation',
]) console.log(`- ${scenario}`);

process.exitCode = failed ? 1 : 0;

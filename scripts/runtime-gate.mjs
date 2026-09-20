import net from 'node:net';

const targets = [
  ['Auth emulator', '127.0.0.1', 9099],
  ['Firestore emulator', '127.0.0.1', 8080],
  ['Functions emulator', '127.0.0.1', 5001],
];

function probe(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok) => { socket.destroy(); resolve(ok); };
    socket.setTimeout(1200);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

let available = 0;
for (const [name, host, port] of targets) {
  const ok = await probe(host, port);
  console.log(`${ok ? 'PASS' : 'WAIT'} | ${name}: ${host}:${port}`);
  if (ok) available += 1;
}

console.log(`\nRuntime services available: ${available}/${targets.length}`);
console.log(available === targets.length
  ? 'RUNTIME_GATE=READY'
  : 'RUNTIME_GATE=BLOCKED (start missing emulator services before claiming runtime PASS)');

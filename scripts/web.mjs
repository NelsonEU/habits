// `npm run web`: the app in a browser, for quick UI checks (no notifications, haptics or file
// import there; the phone stays the final check).
//
// expo-sqlite's web version needs the page to be cross-origin isolated (SharedArrayBuffer). Expo's
// dev server doesn't let a project add headers to the page itself, so Expo runs on EXPO_PORT and
// this proxy, on PORT, adds the two headers to everything it passes along.
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';

const PORT = 8080;
const EXPO_PORT = 8082;
const ISOLATION = {
  'cross-origin-embedder-policy': 'credentialless',
  'cross-origin-opener-policy': 'same-origin',
};

// Extra arguments go to Expo, e.g. `npm run web -- --clear` after changing tailwind.config.ts.
const expo = spawn('npx', ['expo', 'start', '--web', '--port', String(EXPO_PORT), ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, BROWSER: 'none' },
});
expo.on('exit', (code) => process.exit(code ?? 0));

const proxy = http.createServer((req, res) => {
  const upstream = http.request(
    { host: '127.0.0.1', port: EXPO_PORT, path: req.url, method: req.method, headers: req.headers },
    (response) => {
      res.writeHead(response.statusCode ?? 502, { ...response.headers, ...ISOLATION });
      response.pipe(res);
    },
  );
  upstream.on('error', () => {
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('Expo is still starting. Reload in a moment.');
  });
  req.pipe(upstream);
});

// Live reload runs over WebSockets: pass those through untouched.
proxy.on('upgrade', (req, socket, head) => {
  const upstream = net.connect(EXPO_PORT, '127.0.0.1', () => {
    const headers = [];
    for (let i = 0; i < req.rawHeaders.length; i += 2) headers.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
    upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${headers.join('\r\n')}\r\n\r\n`);
    upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
});

proxy.listen(PORT, () => console.log(`\nOpen the app at http://localhost:${PORT} (not Expo's own address)\n`));

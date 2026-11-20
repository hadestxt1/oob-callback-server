// OOB callback server — tiny, dependency-free Node.js app.
// Purpose: a public endpoint that logs every request that hits it, for
// legitimate out-of-band security testing you are authorized to do
// (e.g. SSRF / blind-injection PoCs inside a bug-bounty program's scope).
// Every hit is logged with method, path, query, headers, body, source IP
// and timestamp, and kept in a small in-memory ring buffer.
//
// Endpoints:
//   ANY /            -> logs the hit, answers 200 "ok"
//   ANY /c/<label>   -> same, with a label so one probe can be told apart
//   GET /health      -> 200 "ok" (uptime probe, not logged)
//   GET /logs?token= -> last 200 hits as JSON (needs CALLBACK_TOKEN env)
//
// Env: PORT (default 3000), CALLBACK_TOKEN (secret for /logs; if unset,
// /logs answers 403).

const http = require('http');

const PORT = parseInt(process.env.PORT || '3000', 10);
const TOKEN = process.env.CALLBACK_TOKEN || '';
const MAX_HITS = 200;

const hits = [];

function logHit(req, body) {
  const hit = {
    at: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
    headers: req.headers,
    body: body || '',
  };
  hits.push(hit);
  if (hits.length > MAX_HITS) hits.shift();
  console.log(JSON.stringify({ at: hit.at, method: hit.method, url: hit.url, ip: hit.ip }));
  return hit;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok\n');
    return;
  }

  if (url.pathname === '/logs') {
    if (!TOKEN || url.searchParams.get('token') !== TOKEN) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('forbidden\n');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: hits.length, hits: hits.slice().reverse() }, null, 2));
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1024 * 1024) req.destroy();
  });
  req.on('end', () => {
    logHit(req, body);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok\n');
  });
});

server.listen(PORT, () => {
  console.log(`oob-callback listening on port ${PORT}`);
});

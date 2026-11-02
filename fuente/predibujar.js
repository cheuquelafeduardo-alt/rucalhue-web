const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const DIST = path.join(__dirname, '..');
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.mp4':'video/mp4' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(DIST, p); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(8765);
(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const f of ['index.html', 'cotizar.html']) {
    const p = await b.newPage();
    p.on('pageerror', e => errs.push(f + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(f + ' console: ' + m.text()); });
    await p.goto('http://localhost:8765/' + f, { waitUntil: 'load' });
    await p.waitForTimeout(500);
    const html = await p.$eval('#app', e => e.innerHTML);
    const file = path.join(DIST, f);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('@@PRERENDER@@', () => html));
    await p.close();
  }
  console.log('errores:', errs.length ? errs : 'ninguno');
  await b.close(); srv.close();
})();

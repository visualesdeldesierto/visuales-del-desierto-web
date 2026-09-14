const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('Portales existe como ruta independiente y completa', () => {
  for (const relative of [
    'portales/index.html', 'portales/styles.css', 'portales/app.js',
    'portales/assets/targets/portal-01-target.png',
    'portales/assets/targets/portal-01.mind',
    'portales/assets/video/portal-01-web.mp4'
  ]) assert.ok(fs.existsSync(path.join(root, relative)), relative);
  assert.ok(fs.statSync(path.join(root, 'portales/assets/targets/portal-01.mind')).size > 100000);
  const videoSize = fs.statSync(path.join(root, 'portales/assets/video/portal-01-web.mp4')).size;
  assert.ok(videoSize >= 3000000 && videoSize <= 5000000);
});

test('Portales no se anuncia desde la web pública ni el sitemap', () => {
  assert.doesNotMatch(read('index.html'), /href=["'][^"']*portales/i);
  assert.doesNotMatch(read('sitemap.xml'), /portales/i);
});

test('Portales solicita no indexación en HTML y Vercel', () => {
  const html = read('portales/index.html');
  assert.match(html, /name="robots" content="noindex, nofollow, noarchive, nosnippet"/);
  const config = JSON.parse(read('vercel.json').replace(/^\uFEFF/, ''));
  const sources = config.headers.map(item => item.source);
  assert.ok(sources.includes('/portales'));
  assert.ok(sources.includes('/portales/(.*)'));
  const values = config.headers.flatMap(item => item.headers).filter(item => item.key === 'X-Robots-Tag').map(item => item.value);
  assert.ok(values.every(value => value.includes('noindex')));
});

test('la experiencia conserva carga diferida y manejo del marcador', () => {
  const html = read('portales/index.html');
  const app = read('portales/app.js');
  assert.match(html, /preload="none"/);
  assert.match(html, /data-src="\/portales\/assets\/video\/portal-01-web\.mp4"/);
  assert.match(app, /targetFound/);
  assert.match(app, /targetLost/);
  assert.match(app, /\.pause\(\)/);
});

test('la cámara se solicita directamente desde el gesto de entrada', () => {
  const app = read('portales/app.js');
  const styles = read('portales/styles.css');
  assert.match(app, /navigator\.mediaDevices\?\.getUserMedia/);
  assert.match(app, /await requestCameraPermission\(\);\s*await els\.scene\.systems\["mindar-image-system"\]\.start\(\)/);
  assert.doesNotMatch(app, /await resourceExists/);
  assert.match(styles, /\.panel[^}]*overflow-y:auto/);
  assert.match(styles, /@media \(max-height:650px\)/);
});

test('los recursos cargan aunque Vercel sirva la ruta sin barra final', () => {
  const html = read('portales/index.html');
  for (const resource of [
    '/portales/styles.css',
    '/portales/app.js',
    '/portales/assets/targets/portal-01.mind',
    '/portales/assets/video/portal-01-web.mp4'
  ]) assert.ok(html.includes(resource), resource);
  assert.doesNotMatch(html, /(?:href|src|data-src)="\.\//);
  assert.doesNotMatch(html, /imageTargetSrc: \.\//);
});
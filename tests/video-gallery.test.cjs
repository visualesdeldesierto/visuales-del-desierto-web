const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {parseVimeoUrl, collectVideos, createGallery} = require('../video-gallery.js');

test('Vimeo public, management, player and unlisted links', () => {
  assert.equal(parseVimeoUrl(' https://vimeo.com/1221882993?share=copy ').id, '1221882993');
  assert.equal(parseVimeoUrl('https://vimeo.com/manage/videos/123').id, '123');
  assert.equal(parseVimeoUrl('https://player.vimeo.com/video/123?h=abc').hash, 'abc');
  const unlisted = parseVimeoUrl('https://vimeo.com/123/abc123');
  assert.match(unlisted.src, /h=abc123/);
  assert.equal(unlisted.url, 'https://vimeo.com/123/abc123');
  for (const bad of [null, {}, '', 'javascript:alert(1)', 'http://vimeo.com/123', 'https://evil.com/vimeo.com/123', 'https://vimeo.com.evil.com/123', 'https://user:pass@vimeo.com/123', 'https://vimeo.com/123?h=%22bad']) {
    assert.equal(parseVimeoUrl(bad), null);
  }
});

test('preserves legacy first, skips invalid entries, deduplicates and retains private hashes', () => {
  const videos = collectVideos({vimeoUrl: 'https://vimeo.com/123', vimeoOrientation:'horizontal', videos: [null, {url: 'bad'}, {title:' Otro ', url:'https://vimeo.com/456'}, {title:' Principal ', url:'https://vimeo.com/123/abc'}]});
  assert.deepEqual(videos.map(v => v.id), ['123', '456']);
  assert.equal(videos[0].hash, 'abc');
  assert.equal(videos[0].title, 'Principal');
  assert.equal(videos[0].orientation, 'horizontal');
  assert.equal(videos[1].orientation, 'vertical');
  assert.equal(collectVideos({videos: [{url:'https://vimeo.com/456'}]}).length, 1);
  assert.deepEqual(collectVideos({videos: 'invalid'}), []);
});

class Element {
  constructor(document) {
    this.ownerDocument = document;
    this.children = [];
    this.events = {};
    this.attrs = {};
    this.style = {};
    this.dataset = {};
    const classes = new Set();
    this.classList = {
      add(...values) { values.forEach(value => classes.add(value)); },
      remove(...values) { values.forEach(value => classes.delete(value)); },
      contains(value) { return classes.has(value); },
      toggle(value) {
        if (classes.has(value)) { classes.delete(value); return false; }
        classes.add(value);
        return true;
      }
    };
  }
  addEventListener(name, cb) { (this.events[name] ||= []).push(cb); }
  fire(name, values = {}) { for (const cb of this.events[name] || []) cb({target: this, preventDefault(){}, ...values}); }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = items; }
  setAttribute(name, value) { this.attrs[name] = value; }
  removeAttribute(name) { delete this.attrs[name]; if (name === 'src') delete this.src; }
  get childElementCount() { return this.children.length; }
  querySelectorAll() { return []; }
  focus() { this.ownerDocument.activeElement = this; }
  showModal() { this.open = true; }
  close() { this.open = false; this.fire('close'); }
  setPointerCapture() {}
}

function fixture() {
  const document = {
    events: {},
    createElement(){return new Element(document);},
    querySelectorAll(){return [];},
    getElementById(){return null;},
    addEventListener(name, cb){(this.events[name] ||= []).push(cb);},
    fire(name){for(const cb of this.events[name] || []) cb();}
  };
  const dialog = new Element(document), gallery = new Element(document);
  const names = ['frame','stage','fullscreen','title','caption','nav','counter','pages','swipe','external','close','prev','next'];
  const elements = Object.fromEntries(names.map(name => [name, new Element(document)]));
  dialog.querySelector = selector => elements[selector.match(/data-video-(.+)\]/)[1]];
  document.querySelector = selector => selector === '[data-video-dialog]' ? dialog : selector === '[data-project-gallery]' ? gallery : null;
  return {document, dialog, gallery, elements, controller: createGallery(dialog)};
}
const project = count => ({title:'Teatro', vimeoUrl:'https://vimeo.com/100', videos: Array.from({length:count - 1}, (_, i) => ({title:'Escena ' + (i + 2), url:'https://vimeo.com/' + (101 + i)}))});

test('six videos navigate with buttons, pager, keyboard and wrapping', () => {
  const f = fixture();
  f.controller.open(project(6));
  assert.equal(f.elements.counter.textContent, '1 de 6');
  assert.equal(f.elements.pages.children.length, 6);
  f.elements.next.fire('click');
  assert.equal(f.elements.counter.textContent, '2 de 6');
  assert.match(f.elements.frame.src, /video\/101\?/);
  assert.equal(f.elements.stage.dataset.orientation, 'vertical');
  f.elements.pages.children[5].fire('click');
  assert.equal(f.elements.counter.textContent, '6 de 6');
  f.dialog.fire('keydown', {key:'ArrowRight'});
  assert.equal(f.elements.counter.textContent, '1 de 6');
  f.elements.prev.fire('click');
  assert.equal(f.elements.counter.textContent, '6 de 6');
  assert.equal(f.elements.pages.children[5].attrs['aria-current'], 'true');
  assert.equal(f.elements.pages.children[0].attrs['aria-current'], undefined);
});

test('swipe changes videos, vertical gestures and cancellation do not', () => {
  const f = fixture(); f.controller.open(project(3));
  const down = {isPrimary:true, button:0, pointerId:1, clientX:200, clientY:100};
  f.elements.swipe.fire('pointerdown', down);
  f.elements.swipe.fire('pointerup', {pointerId:1,clientX:100,clientY:105});
  assert.equal(f.elements.counter.textContent, '2 de 3');
  f.elements.swipe.fire('pointerdown', down);
  f.elements.swipe.fire('pointerup', {pointerId:1,clientX:195,clientY:250});
  assert.equal(f.elements.counter.textContent, '2 de 3');
  f.elements.swipe.fire('pointerdown', down);
  f.elements.swipe.fire('pointercancel');
  f.elements.swipe.fire('pointerup', {pointerId:1,clientX:100,clientY:105});
  assert.equal(f.elements.counter.textContent, '2 de 3');
});

test('single video, empty project, native close cleanup and focus return', () => {
  const f = fixture(), opener = new Element(f.document);
  f.controller.open({title:'Empty'});
  assert.equal(f.dialog.open, undefined);
  f.controller.open(project(1), opener);
  assert.equal(f.elements.nav.hidden, true);
  assert.equal(f.elements.swipe.hidden, true);
  assert.equal(f.document.activeElement, f.elements.close);
  f.dialog.close();
  assert.equal(f.elements.frame.src, undefined);
  assert.equal(f.document.activeElement, opener);
  f.controller.open(project(3), opener);
  f.elements.next.fire('click');
  f.elements.close.fire('click');
  f.controller.open(project(3), opener);
  assert.equal(f.elements.counter.textContent, '1 de 3');
});

test('fullscreen button uses the browser API and updates its accessible label', async () => {
  const f = fixture();
  f.elements.stage.requestFullscreen = async () => { f.document.fullscreenElement = f.elements.stage; f.document.fire('fullscreenchange'); };
  f.document.exitFullscreen = async () => { delete f.document.fullscreenElement; f.document.fire('fullscreenchange'); };
  f.controller.open({...project(1), vimeoOrientation:'horizontal'});
  assert.equal(f.elements.stage.dataset.orientation, 'horizontal');
  f.elements.fullscreen.fire('click');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.elements.fullscreen.textContent, 'Salir de pantalla completa');
  assert.equal(f.elements.fullscreen.attrs['aria-expanded'], 'true');
  f.elements.fullscreen.fire('click');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.elements.fullscreen.textContent, 'Pantalla completa');
});

test('fullscreen falls back to filling the mobile viewport', () => {
  const f = fixture(); f.controller.open(project(1));
  f.elements.fullscreen.fire('click');
  assert.equal(f.dialog.classList.contains('is-expanded'), true);
  f.elements.fullscreen.fire('click');
  assert.equal(f.dialog.classList.contains('is-expanded'), false);
});

for (const count of [1, 3, 6]) test('site renders button and opens gallery for ' + count + ' videos', async () => {
  const f = fixture();
  let requestUrl;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8'), {
    document:f.document,
    window:{matchMedia:()=>({matches:true}), addEventListener(){}, SANITY_CONFIG:{projectId:'test',dataset:'production'}, ProjectVideos:{collectVideos,createGallery}},
    fetch:async url => {requestUrl=url; return {ok:true,json:async()=>({result:[project(count)]})};},
    console
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(decodeURIComponent(requestUrl), /vimeoOrientation/);
  assert.match(decodeURIComponent(requestUrl), /videos\[\]\{title, url, orientation\}/);
  const actions = f.gallery.children[0].children[1].children[2];
  const button = actions.children[0];
  assert.equal(button.textContent, count === 1 ? 'Ver video' : 'Ver videos (' + count + ')');
  button.fire('click');
  assert.equal(f.dialog.open, true);
  assert.equal(f.elements.pages.children.length, count);
});

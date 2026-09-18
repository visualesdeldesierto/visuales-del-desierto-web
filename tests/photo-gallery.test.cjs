const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {parsePhoto, collectPhotos, createGallery} = require('../photo-gallery.js');

const photoUrl = id => 'https://cdn.sanity.io/images/ud3wwp5r/production/' + id + '-1200x800-jpg';

test('accepts Sanity images, adds delivery parameters and rejects unsafe URLs', () => {
  const photo = parsePhoto({url: photoUrl('abc'), alt: '  Escenario azul  ', caption: '  The Light  '});
  assert.equal(photo.alt, 'Escenario azul');
  assert.equal(photo.caption, 'The Light');
  assert.match(photo.src, /auto=format/);
  assert.match(photo.src, /w=2400/);
  for (const bad of [
    null,
    {},
    {url: ''},
    {url: 'http://cdn.sanity.io/images/test'},
    {url: 'https://evil.example/images/test'},
    {url: 'https://cdn.sanity.io/files/test'}
  ]) {
    assert.equal(parsePhoto(bad), null);
  }
});

test('collects valid project photos in their Sanity order', () => {
  const photos = collectPhotos({
    heroPhoto: {url: photoUrl('cover'), alt: 'Portada'},
    galleryImages: [
      {url: photoUrl('one'), alt: 'Una'},
      {url: 'bad'},
      {url: photoUrl('two'), alt: 'Dos'}
    ]
  });
  assert.deepEqual(photos.map(photo => photo.alt), ['Portada', 'Una', 'Dos']);
  assert.deepEqual(collectPhotos({galleryImages: 'invalid'}), []);
  assert.deepEqual(collectPhotos(null), []);
});

class Element {
  constructor(document) {
    this.ownerDocument = document;
    this.children = [];
    this.events = {};
    this.attrs = {};
    this.dataset = {};
    this.style = {};
    this.hidden = false;
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
  addEventListener(name, callback) { (this.events[name] ||= []).push(callback); }
  fire(name, values = {}) { for (const callback of this.events[name] || []) callback({target: this, preventDefault(){}, ...values}); }
  replaceChildren(...items) { this.children = items; }
  setAttribute(name, value) { this.attrs[name] = value; }
  removeAttribute(name) { delete this.attrs[name]; if (name === 'src') delete this.src; }
  focus() { this.ownerDocument.activeElement = this; }
  showModal() { this.open = true; }
  close() { this.open = false; this.fire('close'); }
  setPointerCapture() {}
}

function fixture() {
  const document = {
    events: {},
    createElement(){return new Element(document);},
    addEventListener(name, callback){(this.events[name] ||= []).push(callback);},
    fire(name){for(const callback of this.events[name] || []) callback();}
  };
  const dialog = new Element(document);
  const names = ['image','stage','fullscreen','title','caption','nav','counter','pages','swipe','close','prev','next'];
  const elements = Object.fromEntries(names.map(name => [name, new Element(document)]));
  dialog.querySelector = selector => elements[selector.match(/data-photo-(.+)\]/)[1]];
  return {document, dialog, elements, controller: createGallery(dialog)};
}

const project = count => ({
  title: 'The Light',
  galleryImages: Array.from({length: count}, (_, index) => ({
    url: photoUrl('image' + index),
    alt: 'Fotografía ' + (index + 1),
    caption: index === 0 ? 'Escenario' : ''
  }))
});

test('opens the gallery and navigates with buttons, pages and keyboard', () => {
  const fixtureValue = fixture();
  fixtureValue.controller.open(project(3));
  assert.equal(fixtureValue.dialog.open, true);
  assert.equal(fixtureValue.elements.counter.textContent, '1 de 3');
  assert.equal(fixtureValue.elements.image.alt, 'Fotografía 1');
  assert.equal(fixtureValue.elements.pages.children.length, 3);
  fixtureValue.elements.next.fire('click');
  assert.equal(fixtureValue.elements.counter.textContent, '2 de 3');
  fixtureValue.elements.pages.children[2].fire('click');
  assert.equal(fixtureValue.elements.counter.textContent, '3 de 3');
  fixtureValue.dialog.fire('keydown', {key: 'ArrowRight'});
  assert.equal(fixtureValue.elements.counter.textContent, '1 de 3');
  fixtureValue.elements.prev.fire('click');
  assert.equal(fixtureValue.elements.counter.textContent, '3 de 3');
});

test('supports swipe, fullscreen fallback, cleanup and focus return', () => {
  const fixtureValue = fixture();
  const opener = new Element(fixtureValue.document);
  fixtureValue.controller.open(project(3), opener);
  fixtureValue.elements.stage.fire('pointerdown', {isPrimary:true,button:0,pointerId:1,clientX:220,clientY:100});
  fixtureValue.elements.stage.fire('pointerup', {pointerId:1,clientX:100,clientY:105});
  assert.equal(fixtureValue.elements.counter.textContent, '2 de 3');
  fixtureValue.elements.fullscreen.fire('click');
  assert.equal(fixtureValue.dialog.classList.contains('is-expanded'), true);
  fixtureValue.elements.fullscreen.fire('click');
  assert.equal(fixtureValue.dialog.classList.contains('is-expanded'), false);
  fixtureValue.dialog.close();
  assert.equal(fixtureValue.elements.image.src, undefined);
  assert.equal(fixtureValue.document.activeElement, opener);
});

test('single photo hides navigation and the site requests gallery images', () => {
  const fixtureValue = fixture();
  fixtureValue.controller.open(project(1));
  assert.equal(fixtureValue.elements.nav.hidden, true);
  assert.equal(fixtureValue.elements.swipe.hidden, true);
  const script = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.match(script, /galleryImages\[\]\{/);
  assert.match(script, /"heroPhoto"/);
  assert.match(script, /Ver fotos/);
  assert.match(html, /photo-gallery\.js/);
  assert.match(html, /data-photo-dialog/);
});

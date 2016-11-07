import test from 'tape';
import fs from 'fs';
import JnTar from '../lib/JnTar.js';

test('JnTar', (t) => {
  t.doesNotThrow(() => { const jntar = new JnTar('test/data/jntar.tgz'); }, 'has constructor');
  t.throws(() => { const jntar = new JnTar(); }, '...  which takes a filename as parameter');
  t.end();
});

test('JnTar compress', (t) => {
  const jntar = new JnTar('test/data/jntar.tgz');
  jntar.compress(['test/data/filetree.ori'], () => {
    const tarStats = fs.statSync('test/data/tar.tgz');
    const jntarStats = fs.statSync('test/data/jntar.tgz');
    t.ok(fs.statSync('test/data/jntar.tgz').size > 0, `... produces a non empty archive (${jntarStats.size})`);
    t.ok(tarStats.size > jntarStats.size, '... produces smaller archive than a .tgz');
    // fs.unlink('test/data/jntar.tgz', () => {});
    t.end();
  ;})
});

test('JnTar decompress', (t) => {
  t.throws(() => { const jntar = new JnTar('nonexistingfile.tgz'); jntar.decompress(); }, '...  takes a *existing* filename as parameter');
  const jntar = new JnTar('test/data/jntar.tgz'); jntar.decompress('test/data/filetree.uncompress', () => {
    t.ok(true, '... is available');
    t.throws(() => { const jntarStats = fs.statSync('test/data/filetree.uncompress/.jntar_catalog'); }, '... removes the catalog file');
    t.end();
  });  
  // t.doesNotThrow(() => { const jntar = new JnTar('test/data/jntar.tgz'); jntar.decompress('test/data/filetree.uncompress');  }, '... is available');
});

#!/usr/bin/env node

import program from 'commander';
import JnTar from '../lib/JnTar';

var version = '0.0.9';

program
.command('c <archive_name> [target_dirs...]')
.description('Create an archive')
.action((archive_name, target_dirs) => {
  console.log('compress ' + archive_name);
  console.log('target_dirs ' + target_dirs);
  const jntar = new JnTar(archive_name);
  jntar.compress(target_dirs, ()=>{ console.log('archiver has been finalized and the output file descriptor has closed.'); });
});

program
.command('x')
.description('Decompress an archive')
.action((archive) => {
  decompress(archive);
});

program
.command('v')
.description('Display version information')
.action(() => {
  console.log('Version: ' + version);
});

program.parse(process.argv);

var archive_file = program.args.unshift();
var files = program.args;

function compress(archive_file, dir) {
  let jntar = new JnTar(archive_file);
  jntar.compress(dir);
};

function decompress() {
  let jntar = new JnTar(archive_file);
  jntar.archive_name(archive_file);
  jntar.decompress();
}

#!/usr/bin/env node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _JnTar = require('../lib/JnTar');

var _JnTar2 = _interopRequireDefault(_JnTar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var version = '0.0.9';

_commander2.default.command('c <archive_name> [target_dirs...]').description('Create an archive').action(function (archive_name, target_dirs) {
  console.log('compress ' + archive_name);
  console.log('target_dirs ' + target_dirs);
  var jntar = new _JnTar2.default(archive_name);
  jntar.compress(target_dirs, function () {
    console.log('archiver has been finalized and the output file descriptor has closed.');
  });
});

_commander2.default.command('x').description('Decompress an archive').action(function (archive) {
  decompress(archive);
});

_commander2.default.command('v').description('Display version information').action(function () {
  console.log('Version: ' + version);
});

_commander2.default.parse(process.argv);

var archive_file = _commander2.default.args.unshift();
var files = _commander2.default.args;

function compress(archive_file, dir) {
  var jntar = new _JnTar2.default(archive_file);
  jntar.compress(dir);
};

function decompress() {
  var jntar = new _JnTar2.default(archive_file);
  jntar.archive_name(archive_file);
  jntar.decompress();
}
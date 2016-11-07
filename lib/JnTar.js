'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _archiver = require('archiver');

var _archiver2 = _interopRequireDefault(_archiver);

var _md5File = require('md5-file');

var _md5File2 = _interopRequireDefault(_md5File);

var _extractArchive = require('extract-archive');

var _extractArchive2 = _interopRequireDefault(_extractArchive);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function copyFileSync(srcFile, destFile) {
  var BUF_LENGTH = 64 * 1024;
  var buff = new Buffer.allocUnsafe(BUF_LENGTH);
  var fdr = _fs2.default.openSync(srcFile, 'r');
  var fdw = _fs2.default.openSync(destFile, 'w');
  var bytesRead = 1;
  var pos = 0;
  while (bytesRead > 0) {
    bytesRead = _fs2.default.readSync(fdr, buff, 0, BUF_LENGTH, pos);
    _fs2.default.writeSync(fdw, buff, 0, bytesRead);
    pos += bytesRead;
  }
  _fs2.default.closeSync(fdr);
  _fs2.default.closeSync(fdw);
}

// List all files in a directory in Node.js recursively in a synchronous fashion
function walkSync(data, dir) {
  var walkData = data;

  walkData.dirs.push(dir);
  var dirFiles = _fs2.default.readdirSync(dir);

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = dirFiles[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var file = _step.value;

      var filePath = _path2.default.join(dir, file);
      var stats = _fs2.default.lstatSync(filePath);
      if (stats.isDirectory()) {
        // console.log(`adding dir ${filePath}`);
        walkData = walkSync(walkData, filePath + '/');
      } else if (stats.isFile()) {
        var size = stats.size;
        // console.log(`adding file ${filePath}`);
        walkData.files.push({ name: filePath, size: size });
        if (typeof walkData.fileBySize[size] === 'undefined') {
          walkData.fileBySize[size] = [filePath];
        } else {
          walkData.fileBySize[size].push(filePath);
        }
      } else {
        console.error('Not file nor dir ' + filePath);
        console.error(JSON.stringify(stats));
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return walkData;
}

// Private methods
function metaDecompress(dir, catalogFile) {
  var filesInCatalog = _fs2.default.readFileSync(_path2.default.join(dir, catalogFile)).toString().split('\n');
  for (var i in filesInCatalog) {
    // filesInCatalog[i].slice(-1, '');
    if (filesInCatalog[i] !== '') {
      var file = filesInCatalog[i].split('|');
      // Type of meta action to process
      var type = file[0];
      var src = _path2.default.normalize(_path2.default.join(dir, file[1]));
      var dst = _path2.default.normalize(_path2.default.join(dir, file[2]));
      if (type === 'DUP_FILE') {
        try {
          _fs2.default.accessSync(src, _fs2.default.F_OK);
          copyFileSync(src, dst);
        } catch (e) {
          console.error('Error=' + e);
          // It isn't accessible
        }
      } else if (type === 'DIR') {
        try {
          _fs2.default.mkdirSync(src);
          // console.log('DIR ' + src + ' created');
        } catch (e) {
          if (e.code !== 'EEXIST') {
            console.error('Dir error ' + e);
          }
        }
      } else {
        console.error('Unknown type of meta action (' + type + ' )');
        console.error('  for line "' + filesInCatalog[i] + '"');
      }
    }
  }
}

var JnTar = function () {
  function JnTar(fileName) {
    _classCallCheck(this, JnTar);

    if (fileName) {
      this.archiveFileName = fileName;
    } else {
      throw Error('Missing archive name');
    }
    this.catalogFileName = '.jntar_catalog';
    this.min_meta_compress_size_treshold = 2048;

    this.archiver = _archiver2.default.create('tar', {
      gzip: true,
      gzipOptions: {
        level: 1
      }
    });
  }

  _createClass(JnTar, [{
    key: 'archiveName',
    value: function archiveName(name) {
      if (name) {
        this.archiveFileName = name;
      }

      return this.archiveFileName;
    }
  }, {
    key: 'compress',
    value: function compress(dirsToArchive, cb) {
      var output = _fs2.default.createWriteStream(this.archiveFileName);
      var archive = this.archiver;

      output.on('close', function () {
        cb();
      });

      archive.pipe(output);

      var walkData = {
        fileBySize: {},
        dirs: [],
        files: []
      };
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = dirsToArchive[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var d = _step2.value;

          var dir = _path2.default.normalize(d);

          walkData = walkSync(walkData, dir);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      for (var size in walkData.fileBySize) {
        if ({}.hasOwnProperty.call(walkData.fileBySize, size)) {
          var list = walkData.fileBySize[size];
          var fileByHash = {};

          // don't compute md5 if only one file of this side (no collision possible)
          if (list.length === 1) {
            walkData.fileBySize[size] = undefined;
          }

          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = list[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var name = _step3.value;

              var md5sum = _md5File2.default.sync(name);

              if (typeof fileByHash[md5sum] !== 'undefined') {
                fileByHash[md5sum].push(name);
              } else {
                fileByHash[md5sum] = [name];
              }
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }

          walkData.fileBySize[size] = fileByHash;
        }
      }

      var catalogFile = _fs2.default.createWriteStream(this.catalogFileName);

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = walkData.dirs[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _dir = _step4.value;

          catalogFile.write('DIR|' + _dir + '|' + _dir + '|0\n');
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = walkData.files[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var fileData = _step5.value;

          var _name = fileData.name;
          var _size = fileData.size;
          var _list = walkData.fileBySize[_size];

          if (typeof _list === 'undefined') {
            archive.file(_name, { name: _name });
          }

          var _md5sum = _md5File2.default.sync(_name);
          if (typeof _list[_md5sum] !== 'undefined' && _list[_md5sum].length > 1) {
            if (_list[_md5sum][0] === _name) {
              // First file with this md5 => add to archive
              archive.file(_name, { name: _name });
            } else {
              // Collision => write to catalog
              catalogFile.write('DUP_FILE|' + _list[_md5sum][0] + '|' + _name + '|' + _size + '\n');
            }
          } else {
            archive.file(_name, { name: _name });
          }
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      catalogFile.end();
      archive.file(this.catalogFileName, { name: this.catalogFileName });
      archive.finalize();
    }
  }, {
    key: 'decompress',
    value: function decompress(targetDir, cb) {
      var _this = this;

      var dir = targetDir;

      if (!dir) {
        dir = './';
      }

      // Throws an error if the file archive doesn't exists
      // fs.accessSync(this.archiveFileName, fs.F_OK);
      _fs2.default.statSync(this.archiveFileName).isFile();

      (0, _extractArchive2.default)(this.archiveFileName, dir).then(function () {
        metaDecompress(dir, _this.catalogFileName);
        // remove catalogFile
        _fs2.default.unlinkSync(_path2.default.join(dir, _this.catalogFileName));
        cb();
      }).catch(function (e) {
        console.log(e);
      });
    }
  }]);

  return JnTar;
}();

exports.default = JnTar;
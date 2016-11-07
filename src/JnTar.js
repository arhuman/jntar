import archiver from 'archiver';
import md5 from 'md5-file';
import extract from 'extract-archive';
import fs from 'fs';
import path from 'path';

function copyFileSync(srcFile, destFile) {
  const BUF_LENGTH = 64 * 1024;
  const buff = new Buffer.allocUnsafe(BUF_LENGTH);
  const fdr = fs.openSync(srcFile, 'r');
  const fdw = fs.openSync(destFile, 'w');
  let bytesRead = 1;
  let pos = 0;
  while (bytesRead > 0) {
    bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
    fs.writeSync(fdw, buff, 0, bytesRead);
    pos += bytesRead;
  }
  fs.closeSync(fdr);
  fs.closeSync(fdw);
}

// List all files in a directory in Node.js recursively in a synchronous fashion
function walkSync(data, dir) {
  let walkData = data;

  walkData.dirs.push(dir);
  const dirFiles = fs.readdirSync(dir);

  for (const file of dirFiles) {
    const filePath = path.join(dir, file);
    const stats = fs.lstatSync(filePath);
    if (stats.isDirectory()) {
      // console.log(`adding dir ${filePath}`);
      walkData = walkSync(walkData, `${filePath}/`);
    } else if (stats.isFile()) {
      const size = stats.size;
      // console.log(`adding file ${filePath}`);
      walkData.files.push({ name: filePath, size });
      if (typeof walkData.fileBySize[size] === 'undefined') {
        walkData.fileBySize[size] = [filePath];
      } else {
        walkData.fileBySize[size].push(filePath);
      }
    } else {
      console.error(`Not file nor dir ${filePath}`);
      console.error(JSON.stringify(stats));
    }
  }

  return walkData;
}

// Private methods
function metaDecompress(dir, catalogFile) {
  const filesInCatalog = fs.readFileSync(path.join(dir, catalogFile)).toString().split('\n');
  for (const i in filesInCatalog) {
    // filesInCatalog[i].slice(-1, '');
    if (filesInCatalog[i] !== '') {
      const file = filesInCatalog[i].split('|');
      // Type of meta action to process
      const type = file[0];
      const src = path.normalize(path.join(dir, file[1]));
      const dst = path.normalize(path.join(dir, file[2]));
      if (type === 'DUP_FILE') {
        try {
          fs.accessSync(src, fs.F_OK);
          copyFileSync(src, dst);
        } catch (e) {
          console.error(`Error=${e}`);
          // It isn't accessible
        }
      } else if (type === 'DIR') {
        try {
          fs.mkdirSync(src);
          // console.log('DIR ' + src + ' created');
        } catch (e) {
          if (e.code !== 'EEXIST') {
            console.error(`Dir error ${e}`);
          }
        }
      } else {
        console.error(`Unknown type of meta action (${type} )`);
        console.error(`  for line "${filesInCatalog[i]}"`);
      }
    }
  }
}


export default class JnTar {
  constructor(fileName) {
    if (fileName) {
      this.archiveFileName = fileName;
    } else {
      throw Error('Missing archive name');
    }
    this.catalogFileName                 = '.jntar_catalog';
    this.min_meta_compress_size_treshold = 2048;

    this.archiver = archiver.create('tar', {
      gzip: true,
      gzipOptions: {
        level: 1,
      },
    });
  }

  archiveName(name) {
    if (name) {
      this.archiveFileName = name;
    }

    return this.archiveFileName;
  }

  compress(dirsToArchive, cb) {
    const output = fs.createWriteStream(this.archiveFileName);
    const archive = this.archiver;

    output.on('close', () => {
      cb();
    });

    archive.pipe(output);

    let walkData = {
      fileBySize: {},
      dirs: [],
      files: [],
    };
    for (const d of dirsToArchive) {
      const dir = path.normalize(d);

      walkData = walkSync(walkData, dir);
    }

    for (const size in walkData.fileBySize) {
      if ({}.hasOwnProperty.call(walkData.fileBySize, size)) {
        const list = walkData.fileBySize[size];
        const fileByHash = {};

        // don't compute md5 if only one file of this side (no collision possible)
        if (list.length === 1) {
          walkData.fileBySize[size] = undefined;
        }

        for (const name of list) {
          const md5sum = md5.sync(name);

          if (typeof fileByHash[md5sum] !== 'undefined') {
            fileByHash[md5sum].push(name);
          } else {
            fileByHash[md5sum] = [name];
          }
        }

        walkData.fileBySize[size] = fileByHash;
      }
    }

    const catalogFile = fs.createWriteStream(this.catalogFileName);

    for (const dir of walkData.dirs) {
      catalogFile.write(`DIR|${dir}|${dir}|0\n`);
    }

    for (const fileData of walkData.files) {
      const name = fileData.name;
      const size = fileData.size;
      const list = walkData.fileBySize[size];

      if (typeof list === 'undefined') {
        archive.file(name, { name });
      }

      const md5sum = md5.sync(name);
      if (typeof list[md5sum] !== 'undefined' && list[md5sum].length > 1) {
        if (list[md5sum][0] === name) {
          // First file with this md5 => add to archive
          archive.file(name, { name });
        } else {
          // Collision => write to catalog
          catalogFile.write(`DUP_FILE|${list[md5sum][0]}|${name}|${size}\n`);
        }
      } else {
        archive.file(name, { name });
      }
    }

    catalogFile.end();
    archive.file(this.catalogFileName, { name: this.catalogFileName });
    archive.finalize();
  }

  decompress(targetDir, cb) {
    let dir = targetDir;

    if (!dir) {
      dir = './';
    }

    // Throws an error if the file archive doesn't exists
    // fs.accessSync(this.archiveFileName, fs.F_OK);
    fs.statSync(this.archiveFileName).isFile();

    extract(this.archiveFileName, dir).then(() => {
      metaDecompress(dir, this.catalogFileName);
      // remove catalogFile
      fs.unlinkSync(path.join(dir, this.catalogFileName))
      cb();
    }).catch((e) => { console.log(e); });
  }
}

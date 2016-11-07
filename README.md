# jntar

jntar is a JavaScript tar (meta)Archiver implementation.
To be more precise jntar is a proof of concept to ilustrate the benefit of [meta-compression](https://github.com/arhuman/jntar/blob/master/meta-compression.md).

**Beware this is experimental code**

As such the API is subject to change and the code quality is...ahem...Let's talk about it when version 1.0.0 will be released.


## Installation

```sh
# Recommended if you want to use CLI tool
sudo npm install -g jntar

# If you only want to use it in your code
npm install --save jntar
```

## Usage

As a CLI tool :

```sh
# Compression
jntar c jntar.tgz targetdir1

# Decompression
jntar d jntar.tgz uncompressdir
```

As a JavaScript module

```js
// Compresion
const jntar = new JnTar('jntar_archive.tgz');
jntar.compress(['dir1', 'dir2'], callback);

// Decompresion
const jntar = new JnTar('jntar_archive.tgz');
jntar.decompress('uncompress_dir', callback);

```

## API

### `constructor(archivename: string)`

The constructor take only one parameter the archive name

Example:
```js
const jntar = new JnTar('jntar_archive.tgz');
```

### `compress(targetDirs: array, cb: function)`

Asynchronously archive all the directories in the array passed as first arg.

The callback `cb` will be called when the compression is done.

### `decompress(dir: string, cb: function)`

Asynchronously decompress the archive to the dir passed as first arg.

The callback `cb` will be called when the decompression is done.

### FAQ

    Q: Why this name, jntar ?
    A: jntar stands for Jaguar Network TAR 
        (As I'm fortunate enough to work in a company (http://www.jaguar-network.com) which allows me to work on Open Source projects)
        But if you prefer let's just pretend it means: JavaScript Neo TAR

    Q: Why another file dedup tool ?
    A: It's not only a file dedup tool. 
       For me it's: a proof of concept, a meta-compression playground, (soon) the best archive tool in the world ;-)

    Q: Why don't you <put your idea/feature here> ?
    A: Feel free to submit patch :-)

### License

[ISC](https://github.com/arhuman/jntar/blob/master/LICENSE.md)


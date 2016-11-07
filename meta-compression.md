
# Simple idea for even more compression

Nowadays most articles start with a disclaimer.
This one will comply. This article only express *my* views
and don't intend to claim/prove anything.
If you agree, if it makes you think, or jump shouting eureka that's fine.
If you disagree, think it's rubbish that's fine also:)
any feedback is welcome though, even if I admit I'd prefer positive one (this also includes constructive criticisms)

## There's no silver bullet

Whatever the domain it's hard to get an universal *best* solution.
Depending on the context some solutions will be better, but rarely can you find one that outperforms all others whatever the context.
This is especially true in Information Theory, and so in compression because the context convey lot of implicit information/structure that can be leveraged to achieve better compression.
That being said, I hope this is clear that the meta-compression I will present is no different and although efficient for some kind of data (redundant source code) is by no mean supposed to outperform other kind of compression for all kinds of data.

## Meta compression

I choose meta compression to describe the principles explained here only because you have to name things.
I hope you'll forgive the loose meaning of the term and focus on he ideas associated.
Let's assume that meta-compression:
* Operate at an higher level than stream/buffer of data
* Use context information to optimize compression

This idea of implicit context information is the one that drove my work on meta-compression. 
I once realized that licence files where duplicated all around my filesystem.
Digging further, I found several similar files: JavaScript modules, CSS files, images, git hooks...
Studying how tar handle this duplication, I was disappointed to see that tar didn't take advantage of it.
Thinking further it was even more sad to realize that just storing "file B is a copy of file A already compressed" would have lead to a tremendous gain.
A week-end later I had a rudimentary proof of concept proving that using that single meta-compression trick (file dedup) would achieve a 50% tgz reduction on my test directory (Again this only proved that in *some* case the idea would work very well) 

## Meta-compression naive implementation

For a quick proof of concept I wrote jntar.
I wrote the minimal needed to validate the concept.
The implementation is really simple:

Compression.

* Browse recursively the directory to archive
* In a pre-process phase partition files by size.
  When several files have the same size sub-partition them by a computed hash value (md5sum)
  This phase prepare meta-compression
_ then the actual archive creation take place
* adding each file to a compressed archive
  * This step is where meta-compression is used
      + The file dedup action check for every file added that it doesn't share a common size/hash value with other files, if it's the case only the first file is added to the archive, the others are added to a catalog file.
* When all browsed files are added, the catalog file is added and the archive is finalize.

Extraction

* Extract the archive as a normal one.
* Then meta-compression require an additional step
  Create every duplicate listed in catalog file from it's associated source previously extracted

It turns out that this idea is not new:
After seeing it work, I was pointed to severals implementation using file dedup. 
But as most of them were more complicated and miss the idea of generic meta-compression (not just file dedup) I prefered to stick with my proof of concept

## Meta-compression results

The directory used for the test contains code (mainly Perl/JavaScript in git repository)

	arnaud@vm03:~/jaguar_archiver_playground$ du -sh ~/www
	1.9G    /home/arnaud/www

First compression with tar
 
	arnaud@vm03:~/jaguar_archiver_playground$ tar czvf tar.tgz ~/www

Then (meta)compression using jntar

	arnaud@vm03:~/jaguar_archiver_playground$ jntar c jntar.tgz ~/www
 

Extract tarball an rename result to home.tar

	arnaud@vm03:~/jaguar_archiver_playground$ tar xzvf tar.tgz
	arnaud@vm03:~/jaguar_archiver_playground$ mv home/ home.tar
 
Extract meta-compressed tarball and rename result to home.jntar

	arnaud@vm03:~/jaguar_archiver_playground$ jntar x jntar.tgz
	arnaud@vm03:~/jaguar_archiver_playground$ mv home home.jntar
 
Let's compare result

	arnaud@vm03:~/jaguar_archiver_playground$ du -sh *
	1.9G    home.jntar
	1.9G    home.tar
	236M    jntar.tgz     <----------------  Seems it works !
	406M    tar.tgz>

## What's next

### Tools enhancement

The cool thing with meta-compression is that's easy to *add* to existing tools.
It's easy to add it to any file archiver.
In fact the proof of concept I used, was a JavaScript tar/gz archiver augmented with file dedup.

### Plugin ecosystem

The meta compression is a loose term for a generic idea.
The file dedup was the first example of meta compression used to validate the concept, but there are tons of other 'plugins' to create to take profit of the context to optimize compression:
* Fuzzy dedup: Identify files that are similar and only store source and difference (for files that differ from only few strings like author, email or class name)
* git history: Identify set of common files (commit history, objects) and store reference to them
* Application set: Many applications have a common set of files that could be dedup as a whole
* Repository compression: Using online central file repository (Licence/CDN) and store link to them
* Documentation: Some texts make frequent reference to a a common source of information. Storing references to this source rather than extract could be envisioned too
* ...

### Pre/Post process

One area of study could also be exploiting pre/process analysis to setup/optimize the compression phase:
_ Could be analysis to find the best compression parameter
_ could be some kind of reversible normalization/modification that could enhance file compression

### jntar

[jntar](https://github.com/arhuman/jntar) was the proof of concept and is still my playground to test/implement meta-compression.
Making it production ready is, in itself a fulfilling goal.

Idea of new features:
* Using it as a prefilter for other archive tool: jntar --filter rep1 rep2 | yourotherarchivetool 
* Change catalog file to script actually making the copy (in case you dont't have jntar on box where the archive is uncompressed)
* Use hardlink instead of copy (when relevant)


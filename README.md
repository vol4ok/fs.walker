[![build status](https://secure.travis-ci.org/vol4ok/fs.walker.png)](http://travis-ci.org/vol4ok/fs.walker)
# fs.walker

Recursive walk the files and dirs inside a given directory, and invokes callbacks. 
It is useful when processing, transforming or compiling multiple files.

## Usage

`walkSync(targets, options)`
- targets — path or array of paths to walk
- options — object with fields
  - relative — path to dir with respect to which taken a relative path
  - depth — depth of walk
  - on_file – on file callback
  - on_dir — on dir callback

### File or dir callback format:

`function(path, context) {...}`

- path — absolute path to file or dir
- context — helper object associated with this file, with methods and properties
  - relpath() — get relative path (respect to relative option or target path) 
  - isDirectory() — check is directory
  - basename(withoutExt) — return base name with extansion by default, if `withoutExt` is `true` return base name without extension
  - extname() — return extension name
  - dirname() — return dir name
  - path — absolute path of file
  - stat — get file stats
  - base — get relative dir 
  - subpath — path inside base dir (ex: `path` — /base/dir/some/file/path, `base` — /base/dir, `subpath` — some/file/path)

## Example

  Syntax 1:  
```
  walkSync(['/dir', '/dir2'], {
    relative: '../',
    on_file: function(path, context) {...},
    on_dir: function(path, context) {...}
  });
```

  Syntax 2:
```
  walkSync()
    .set({relative: '../'})
    .on('file', function(path, context) {...})
    .on('dir', function(path, context) {...})
    .walk(['/dir', '/dir2']);
```
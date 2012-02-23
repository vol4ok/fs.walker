fs   = require 'fs'
path = require 'path'
_    = require 'underscore'

{EventEmitter} = require 'events'
{basename, dirname, extname, join, existsSync, relative} = path

MAX_INT = 9007199254740992

###
* Walk dirs and files and run callbacks
* @class Walker
###

class Walker
  
  defaults:
    relative: null
    depth: MAX_INT
  
  ###*
  * @constructor
  * @param {Array|String} dirs
  * @param {Object} options
  * @param {Boolean} options.relative
  * @param {Number} options.depth
  * @param {Function} options.on_file
  * @param {Function} options.on_dir
  ###
  
  constructor: (options = {}) ->
    @emitter = new EventEmitter()
    @emitter.on('dir',  options.on_dir)  if _.isFunction(options.on_dir)
    @emitter.on('file', options.on_file) if _.isFunction(options.on_file)
    {@relative, @depth} = _.defaults(options, @defaults)
    
  on: (event, listener) ->
    event = event.toLowerCase()
    if /^(dir|file)$/.test(event)
      @emitter.on(event, listener)
    else
      throw 'Error: unknown event'
    return this
    
  set: (options) ->
    @[key] = val for key, val of options when key in @defaults
    return this
  
  ###*
  * @public
  * @param {Array|String} targets — dirs or files to walk
  ###
  
  walk: (targets) ->
    targets = [ targets ] unless _.isArray(targets)
    for target in targets
      target = fs.realpathSync(target)
      dir = ''
      file = ''
      if @relative?
        @base = fs.realpathSync(@relative)
        dir = dirname(relative(@base, target))
        file = basename(target)
      else
        @base = target
      @_walk(file, dir)
    return this
      
  ###*
  * @private
  * @param {String} apath — absolute path
  * @param {String} [apath = ''] — relative path
  * @param {Number} [depth = ''] — depth of recursion
  ###
  
  _walk: (file, dir, depth = 0) ->
    return true if depth > @depth
    path = join(@base, dir, file)
    stat = fs.statSync(path)
    if stat.isDirectory()
      try
        @emitter.emit('dir', file, dir, @base)
      catch err
        return false if err
      for next in fs.readdirSync(path)
        return false unless @_walk(next, join(dir, file), depth+1)
    else
      try
        @emitter.emit('file', file, dir, @base)
      catch err
        return false if err
    return true

###*
* @api
* @param {Array|String} [targets] - dir or files for scan
* @param {Object} [options] - list of options
*
* @example:

  Syntax 1:  
  walkSync(['/dir', '/dir2'], {
    relative: '../',
    on_file: function(apath, rpath, stat) {...},
    on_dir: function(apath, rpath, stat) {...}
  });
  
  Syntax 2:
  walkSync()
    .set({relative: '../'})
    .on('file', function(apath, rpath, stat) {...})
    .on('dir', function(apath, rpath, stat) {...})
    .walk(['/dir', '/dir2']);
###

walkSync = (targets, options = {}) ->
  if arguments.length is 0
    return new Walker()
  else if arguments.length is 1
    return new Walker(arguments[0])
  return new Walker(arguments[1]).walk(arguments[0])
  
  
exports extends {walkSync, Walker}
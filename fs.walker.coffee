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

class WalkerContext
  constructor: (@base, @path, @_subpath = '', @depth = 0) ->
    @stat = fs.statSync(@path)
  isDirectory: -> @stat.isDirectory()
  makeSubContext: (file) => 
    new WalkerContext(@base
    , join(@path, file)
    , join(@_subpath, file)
    , @depth+1)
  enumDir: ->
    fs.readdirSync(@path).map(@makeSubContext)
  relpath: ->
    rel = relative(@base, @path)
    return rel if @_subpath is ''
    join(dirname(rel), @_subpath)
  dirname: -> dirname(@path)
  basename: (withExt = yes) -> 
    if withExt
      basename(@path)
    else
      basename(@path).replace(/(\.[^.\/]*)?$/i, '')
  extname: -> extname(@path)
  subpath: -> dirname(@_subpath)
      
    
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
    @[key] = val for key, val of options when _.has(@defaults,key) 
    return this
  
  ###*
  * @public
  * @param {Array|String} targets — dirs or files to walk
  ###
  
  walk: (targets) ->
    targets = [ targets ] unless _.isArray(targets)
    for path in targets
      if @relative?
        @base = fs.realpathSync(@relative)
      else
        stat = fs.statSync(path)
        @base = fs.realpathSync(if stat.isDirectory() then path else dirname(path))
      @_walk(new WalkerContext(@base, fs.realpathSync(path)))
    return this
    
  ###*
  * @private
  * @param {Object} ctx — context
  ###
  
  _walk: (ctx) ->
    return true if ctx.depth > @depth
    if ctx.isDirectory()
      try @emitter.emit 'dir', ctx.path, ctx
      catch err
        return false if err is 'break'
        return true if err is 'continue'
        throw err
      for subctx in ctx.enumDir()
        return false unless @_walk(subctx)
    else
      try @emitter.emit 'file', ctx.path, ctx
      catch err
        return false if err is 'break'
        return true if err is 'continue'
        throw err
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
    on_file: function(path, context) {...},
    on_dir: function(path, context) {...}
  });
  
  Syntax 2:
  walkSync()
    .set({relative: '../'})
    .on('file', function(path, context) {...})
    .on('dir', function(path, context) {...})
    .walk(['/dir', '/dir2']);
###

walkSync = (targets, options = {}) ->
  if arguments.length is 0
    return new Walker()
  else if arguments.length is 1
    return new Walker(arguments[0])
  return new Walker(arguments[1]).walk(arguments[0])
  
  
exports extends {walkSync, Walker}
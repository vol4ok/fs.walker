// Generated by CoffeeScript 1.3.1
var EventEmitter, MAX_INT, Walker, WalkerContext, basename, dirname, existsSync, extname, fs, join, path, relative, walkSync, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

fs = require('fs');

path = require('path');

_ = require('underscore');

EventEmitter = require('events').EventEmitter;

basename = path.basename, dirname = path.dirname, extname = path.extname, join = path.join, existsSync = path.existsSync, relative = path.relative;

MAX_INT = 9007199254740992;

/*
* Walk dirs and files and run callbacks
* @class Walker
*/


WalkerContext = (function() {

  WalkerContext.name = 'WalkerContext';

  function WalkerContext(base, path, subpath, depth) {
    this.base = base;
    this.path = path;
    this.subpath = subpath != null ? subpath : '';
    this.depth = depth != null ? depth : 0;
    this.makeSubContext = __bind(this.makeSubContext, this);

    this.stat = fs.statSync(this.path);
  }

  WalkerContext.prototype.isDirectory = function() {
    return this.stat.isDirectory();
  };

  WalkerContext.prototype.makeSubContext = function(file) {
    return new WalkerContext(this.base, join(this.path, file), join(this.subpath, file), this.depth + 1);
  };

  WalkerContext.prototype.enumDir = function() {
    return fs.readdirSync(this.path).map(this.makeSubContext);
  };

  WalkerContext.prototype.relpath = function() {
    var rel;
    rel = relative(this.base, this.path);
    if (this.subpath === '') {
      return rel;
    }
    return join(dirname(rel), this.subpath);
  };

  WalkerContext.prototype.dirname = function() {
    return dirname(this.path);
  };

  WalkerContext.prototype.basename = function(withExt) {
    if (withExt == null) {
      withExt = true;
    }
    if (withExt) {
      return basename(this.path);
    } else {
      return basename(this.path).replace(/(\.[^.\/]*)?$/i, '');
    }
  };

  WalkerContext.prototype.extname = function() {
    return extname(this.path);
  };

  return WalkerContext;

})();

Walker = (function() {

  Walker.name = 'Walker';

  Walker.prototype.defaults = {
    relative: null,
    depth: MAX_INT
  };

  /**
  * @constructor
  * @param {Array|String} dirs
  * @param {Object} options
  * @param {Boolean} options.relative
  * @param {Number} options.depth
  * @param {Function} options.on_file
  * @param {Function} options.on_dir
  */


  function Walker(options) {
    var _ref;
    if (options == null) {
      options = {};
    }
    this.emitter = new EventEmitter();
    if (_.isFunction(options.on_dir)) {
      this.emitter.on('dir', options.on_dir);
    }
    if (_.isFunction(options.on_file)) {
      this.emitter.on('file', options.on_file);
    }
    _ref = _.defaults(options, this.defaults), this.relative = _ref.relative, this.depth = _ref.depth;
  }

  Walker.prototype.on = function(event, listener) {
    event = event.toLowerCase();
    if (/^(dir|file)$/.test(event)) {
      this.emitter.on(event, listener);
    } else {
      throw 'Error: unknown event';
    }
    return this;
  };

  Walker.prototype.set = function(options) {
    var key, val;
    console.log(options);
    for (key in options) {
      val = options[key];
      if (_.has(this.defaults, key)) {
        this[key] = val;
      }
    }
    return this;
  };

  /**
  * @public
  * @param {Array|String} targets — dirs or files to walk
  */


  Walker.prototype.walk = function(targets) {
    var path, stat, _i, _len;
    if (!_.isArray(targets)) {
      targets = [targets];
    }
    for (_i = 0, _len = targets.length; _i < _len; _i++) {
      path = targets[_i];
      if (this.relative != null) {
        this.base = fs.realpathSync(this.relative);
      } else {
        stat = fs.statSync(path);
        this.base = fs.realpathSync(stat.isDirectory() ? path : dirname(path));
      }
      this._walk(new WalkerContext(this.base, fs.realpathSync(path)));
    }
    return this;
  };

  /**
  * @private
  * @param {Object} ctx — context
  */


  Walker.prototype._walk = function(ctx) {
    var subctx, _i, _len, _ref;
    if (ctx.depth > this.depth) {
      return true;
    }
    if (ctx.isDirectory()) {
      try {
        this.emitter.emit('dir', ctx.path, ctx);
      } catch (err) {
        if (err === 'break') {
          return false;
        }
        if (err === 'continue') {
          return true;
        }
        throw err;
      }
      _ref = ctx.enumDir();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        subctx = _ref[_i];
        if (!this._walk(subctx)) {
          return false;
        }
      }
    } else {
      try {
        this.emitter.emit('file', ctx.path, ctx);
      } catch (err) {
        if (err === 'break') {
          return false;
        }
        if (err === 'continue') {
          return true;
        }
        throw err;
      }
    }
    return true;
  };

  return Walker;

})();

/**
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
*/


walkSync = function(targets, options) {
  if (options == null) {
    options = {};
  }
  if (arguments.length === 0) {
    return new Walker();
  } else if (arguments.length === 1) {
    return new Walker(arguments[0]);
  }
  return new Walker(arguments[1]).walk(arguments[0]);
};

__extends(exports, {
  walkSync: walkSync,
  Walker: Walker
});

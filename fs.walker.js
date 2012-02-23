var EventEmitter, MAX_INT, Walker, basename, dirname, existsSync, extname, fs, join, path, relative, walkSync, _,
  __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = Object.prototype.hasOwnProperty,
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

Walker = (function() {

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
    if (options == null) options = {};
    this.emitter = new EventEmitter();
    if (_.isFunction(options.on_dir)) this.emitter.on('dir', options.on_dir);
    if (_.isFunction(options.on_file)) this.emitter.on('file', options.on_file);
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
    for (key in options) {
      val = options[key];
      if (__indexOf.call(this.defaults, key) >= 0) this[key] = val;
    }
    return this;
  };

  /**
  * @public
  * @param {Array|String} targets — dirs or files to walk
  */

  Walker.prototype.walk = function(targets) {
    var dir, file, target, _i, _len;
    if (!_.isArray(targets)) targets = [targets];
    for (_i = 0, _len = targets.length; _i < _len; _i++) {
      target = targets[_i];
      target = fs.realpathSync(target);
      dir = '';
      file = '';
      if (this.relative != null) {
        this.base = fs.realpathSync(this.relative);
        dir = dirname(relative(this.base, target));
        file = basename(target);
      } else {
        this.base = target;
      }
      this._walk(file, dir);
    }
    return this;
  };

  /**
  * @private
  * @param {String} apath — absolute path
  * @param {String} [apath = ''] — relative path
  * @param {Number} [depth = ''] — depth of recursion
  */

  Walker.prototype._walk = function(file, dir, depth) {
    var next, stat, _i, _len, _ref;
    if (depth == null) depth = 0;
    if (depth > this.depth) return true;
    path = join(this.base, dir, file);
    stat = fs.statSync(path);
    if (stat.isDirectory()) {
      try {
        this.emitter.emit('dir', file, dir, this.base);
      } catch (err) {
        console.log("Error: " + err);
        if (err) return false;
      }
      _ref = fs.readdirSync(path);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        next = _ref[_i];
        if (!this._walk(next, join(dir, file), depth + 1)) return false;
      }
    } else {
      try {
        this.emitter.emit('file', file, dir, this.base);
      } catch (err) {
        if (err) return false;
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
    on_file: function(apath, rpath, stat) {...},
    on_dir: function(apath, rpath, stat) {...}
  });
  
  Syntax 2:
  walkSync()
    .set({relative: '../'})
    .on('file', function(apath, rpath, stat) {...})
    .on('dir', function(apath, rpath, stat) {...})
    .walk(['/dir', '/dir2']);
*/

walkSync = function(targets, options) {
  if (options == null) options = {};
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

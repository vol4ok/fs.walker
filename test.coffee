require 'colors'
vows        = require 'vows'
assert      = require 'assert'
fs          = require 'fs'
path        = require 'path'
{inspect}   = require 'util'

{basename} = path

{walkSync, Walker}  = require './fs.walker'

count1 = 0
count2 = 0
walkSync '../',
  on_file: (file, dir, base) ->
    console.log 'on_file'.green, "#{base.yellow}/#{dir.cyan}/#{file.green}"
    count1++
  on_dir: (file, dir, base) ->
    console.log 'on_dir'.magenta, "#{base.yellow}/#{dir.cyan}/#{file.green}"
    count2++
console.log count1, count2
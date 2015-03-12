/*
 * grunt-html2jsonp
 *
 * Copyright (c) 2014 yqt
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var path = require('path');

  var escapeContent = function(content, quoteChar, indentString, strip) {
    var bsRegexp = new RegExp('\\\\', 'g');
    var quoteRegexp = new RegExp('\\' + quoteChar, 'g');
    var nlRegexp = strip ? new RegExp('[ \t]*\r?\n[ \t]*', 'g') : new RegExp('\r?\n', 'g');
    var nlReplace = strip ? '' : ('\\n' + quoteChar + ' +\n' + indentString + indentString + quoteChar);

    return content.replace(bsRegexp, '\\\\').replace(quoteRegexp, '\\' + quoteChar).replace(nlRegexp, nlReplace);
  };

  // convert Windows file separator URL path separator
  var normalizePath = function(p) {
    if ( path.sep !== '/' ) {
      p = p.replace(/\\/g, '/');
    }
    return p;
  };

  // Warn on and remove invalid source files (if nonull was set).
  var existsFilter = function(filepath) {

    if (!grunt.file.exists(filepath)) {
      grunt.log.warn('Source file "' + filepath + '" not found.');
      return false;
    } else {
      return true;
    }
  };

  var getFilename = function(filepath) {
    var normalizedPath = normalizePath(filepath);
    return normalizedPath.replace(/^.+?\/([^\/]+?)(\.[^\.\/]*?)?$/gi, "$1");
  };

  var changeExtensionName = function(filepath, extName) {
    var normalizedPath = normalizePath(filepath);
    return normalizedPath.replace(/.+\./, function (match) {
      return match ? match + extName : normalizedPath + '.' + extName;
    });
  };

  // compile a template to JSONP style
  var compileTemplate = function(filepath, functionName, quoteChar, indentString, strip) {
    var content = escapeContent(grunt.file.read(filepath), quoteChar, indentString, strip);
    return content;
  };

    var buildTemplate = function(functionName, jsonObject){
        return functionName + '(\n' + JSON.stringify(jsonObject) + '\n)';
    };

  grunt.registerMultiTask('html2jsonp', 'Compiles html templates to JSONP style.', function() {

    var options = this.options({
      quoteChar: "'",
      indentString: '  ',
      target: 'js',
      functionName: 'jsonpCallback',
      strip: false
    });

      var _compiled = {};

    // generate a separate module
    this.files.forEach(function(f) {

      // f.dest must be a string or write will fail
      f.src.filter(existsFilter).map(function(filepath) {
          _compiled[getFilename(filepath)] = compileTemplate(filepath, options.functionName, options.quoteChar, options.indentString, options.strip);
      });
    });

      var content = buildTemplate(options.functionName, _compiled);

      grunt.file.write(options.destination, grunt.util.normalizelf(content));

    //Just have one output, so if we making thirty files it only does one line
    grunt.log.writeln("Successfully converted "+(""+this.files.length).green +
                      " html templates to " + options.target + ".");
  });
};

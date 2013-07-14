#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var sys = require('util');

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile, checksfile) {
  if (htmlfile.indexOf("http") == 0) {
    restler.get(htmlfile).on('complete', function(result) {
      if (result instanceof Error) {
        sys.puts("error");
        this.retry(5000);
      } else {
        checkHtmlFile(cheerio.load(result), checksfile);
      }
    });
  } else {
    checkHtmlFile(cheerio.load(fs.readFileSync(htmlfile)), checksfile);
  }
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = htmlfile;
    var checks = loadChecks(checksfile).sort();
    var json = {};
    for(var ii in checks) {
      var present = $(checks[ii]).length > 0;
      json[checks[ii]] = present;
    }
    var outJson = JSON.stringify(json, null, 4);
    console.log(outJson);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};


if(require.main == module) {
  program
      .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
      .option('-f --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
      .option('-u, --url <html_file>', 'Path to http server', null, "")
      .parse(process.argv);
  var source;
  if (program.url) {
    source = program.url;
  } else {
    source = program.file;
  }
  if (program.url) {
    cheerioHtmlFile(program.url, program.checks);
  } else {
    cheerioHtmlFile(program.file, program.checks);
  }
} else {
  exports.checkHtmlFile = checkHtmlFile;
}
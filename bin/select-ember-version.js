#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var run = require('./promise-spawn');
var RSVP = require('rsvp');

function maybeChangeVersion(channel) {
  if (typeof(channel) === 'undefined') {
    return RSVP.Promise.resolve('existing');
  }
  var bowerFile = path.join(__dirname, '..', 'bower.json');
  return run('git', ['checkout', bowerFile]).then(function(){
    var bowerJSON = require(bowerFile);
    fs.writeFileSync(bowerFile, JSON.stringify(rewrite(bowerJSON, channel), null, 2));
    return run('bower', ['install'], {cwd: path.join(__dirname, '..')})
      .then(function(){ return chooseTemplateCompiler(channel);});
  }).then(function(){return channel;});
}

function rewrite(bowerJSON, channel) {
  if (channel === 'existing') {
    return bowerJSON;
  }

  if (!bowerJSON.resolutions) {
    bowerJSON.resolutions = {};
  }

  bowerJSON.dependencies.ember = "components/ember#" + channel;
  bowerJSON.resolutions.ember = channel;

  return bowerJSON;
}


function chooseTemplateCompiler(channel) {
  var state;

  if (channel === 'existing') {
    return RSVP.Promise.resolve();
  }

  if (channel === 'release') {
    state = {
      'broccoli-ember-hbs-template-compiler' : 'install',
      'ember-cli-htmlbars' : 'uninstall'
    };
  } else {
    state = {
      'broccoli-ember-hbs-template-compiler' : 'uninstall',
      'ember-cli-htmlbars' : 'install'
    };
  }
  return RSVP.Promise.all(Object.keys(state).map(function(module){
    return run('npm', [state[module], '--save-dev', module]);
  }))
  .then(function() {
    var configFile = path.join(__dirname, '..', 'tests', 'dummy', 'config', 'environment.js');
    var config = fs.readFileSync(configFile, { encoding: 'utf8' });

    if (process.env.HTMLBARS && channel === 'canary') {
      config = config.replace("//'ember-htmlbars': true", "'ember-htmlbars': true");
      fs.writeFileSync(configFile, config);
    }
  });
}

function foundVersion(package) {
  var filename = path.join(__dirname, '..', 'bower_components', package, 'bower.json');
  if (fs.existsSync(filename)) {
    return require(filename).version;
  }
  filename = path.join(__dirname, '..', 'node_modules', package, 'package.json');
  if (fs.existsSync(filename)) {
    return require(filename).version;
  }
  return "none";
}

function logVersions(channel) {
  console.log("Based on " + channel + " I'm using:");
  ['ember', 'handlebars', 'broccoli-ember-hbs-template-compiler', 'ember-cli-htmlbars'].map(function(module){
    console.log("  " + module + " " + foundVersion(module));
  });
  console.log("  HTMLBars is " + (process.env.HTMLBARS ? "enabled" : "disabled"));
}

maybeChangeVersion(process.env.EMBER_CHANNEL).then(function(channel){
  logVersions(channel);
  process.exit(0);
}).catch(function(err){
  console.log(err);
  console.log(err.stack);
  process.exit(-1);
});

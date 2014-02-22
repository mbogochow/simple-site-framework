
/**
 * Module dependencies.
 */
var express     = require('express')
  , handlebars  = require('handlebars')
  , http        = require('http')
  , path        = require('path')
  , partials    = require('./lib/partials')
  , fs          = require('fs')
  , fileSend    = require('./lib/fileSend.js')
  , xml2js      = require('xml2js')
;

var app = express();
var xmlParser = xml2js.parseString;

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

partials.regPartials(handlebars);

/**
 * Send the given file to the user.  If req.handlebars is defined, then it will 
 * be sent as a compiled Handlebars file.
 */
var sendPage = function(file, req, res) {
  if (req.handlebars) {
    fileSend.sendHandlebarsFile(req.handlebars, file, req.context, res, 
    function(err) {
      console.dir(err);
      res.send();
    });
  } else {
    fileSend.sendFile(file, res);
  }
}

/**
 * Get a JS object from the data file.
 */
function getData() {
  var components_file = "data/bootstrap-components.json";
  return JSON.parse(fs.readFileSync(components_file, 'utf8'));
}

/**
 * Get the page with the given name from the data object,
 */
function getPage(data, key) {
  if (data.nav[key]) return data.nav[key];
  else if (data.sidebar[key]) return data.sidebar[key];
  else return null;
}

/**
 * Get the file type by extracting the file extension from the given file name. 
 * Returns null if a file extension could not be found.
 */
function getFileType(filename) {
  var matches = /\.[0-9a-z]+$/i.exec(filename);
  if (!matches) return null;
  return matches[0].replace(".", "");
}

/**
 * Compare two strings ignoring case.
 */
function equalsIgnoreCase(str1, str2) {
  return str1.toUpperCase() == str2.toUpperCase();
}

/**
 * Get the context for the given page from the data file.
 */
function getContext(name) {
  var context = getData();
  var page = getPage(context, name);
  
  if (page != null)
    page.active = partials.active;
  
  context.page = page;
  context.jquery = fs.existsSync('public/javascripts/jquery.min.js');  
  context.bootstrap = fs.existsSync('public/bootstrap');
  
  var data_files = page['data-files'];
  for (var fkey in data_files) {
    var data_file = data_files[fkey];
    if (!data_file.filetype) 
      data_file.filetype = getFileType(data_file.filename);
    if (equalsIgnoreCase(data_file.filetype, "xml")) {
      var xml = fs.readFileSync("data/" + data_file.filename, 'utf8');
      xmlParser(xml, function (err, result) {
        context[data_file.name] = result;
      });
    }
  }
  return context;
}

/**
 * Start the server.  Initialize app.get() for each page in the data file.
 */
http.createServer(app).listen(app.get('port'), function() {
  var components = getData();

  var callback = function(key, file) {
    return function(req, res) {
      var name = key;
      req.context = getContext(name);
      req.handlebars = handlebars;
      sendPage(file, req, res);
    }
  };

  for (var navkey in components.nav) {
    var nav = components.nav[navkey];
    app.get(nav.target, callback(navkey, nav.filename));
  }

  for (var sidekey in components.sidebar) {
    var sidebar = components.sidebar[sidekey];
    app.get(sidebar.target, callback(sidekey, sidebar.filename));
  }
  
  console.log('Express server listening on port ' + app.get('port'));
});

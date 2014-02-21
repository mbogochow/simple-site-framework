
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
;

var app = express();

var components_file = "data/bootstrap-components.json";

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

var localJquery = fs.existsSync('public/javascripts/jquery.min.js');
var localBootstrap = fs.existsSync('public/bootstrap');
function getContext(name) {
  var components = fs.readFileSync(components_file, 'utf8');
  var context = JSON.parse(components);
  
  if (context.sidebar[name])
  {
    context.page_header = context.sidebar[name].title;
    context.sidebar[name].active = partials.active;
  } else if (context.nav[name]) {
    context.page_header = context.nav[name].title;
    context.nav[name].active = partials.active;
  }
  
  if (!localJquery)
    context.jquery = true;
    
  if (!localBootstrap)
    context.bootstrap = true;
  
  return context;
}

http.createServer(app).listen(app.get('port'), function() {
  var components = JSON.parse(fs.readFileSync(components_file, 'utf8'));

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

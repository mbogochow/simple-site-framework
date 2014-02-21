var fs = require('fs');

var templates = exports.templates = {};
exports.active = 'class="active"';

exports.regPartials = function(handlebars) {
  var partialsDir = __dirname + '/../partials';
  var filenames = fs.readdirSync(partialsDir);
  
  filenames.sort(function(a, b) {
    return a < b ? -1 : 1;
  }).forEach(function (filename) {
    var matches = /^([^.]+).hbs$/.exec(filename);
    if (!matches) return;
   
    var name = matches[1];
    var template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');
   
    templates[name] = template;
   
    handlebars.registerPartial(name, template);
  });
}

exports.compile = function(handlebars, partial, context) {
  return handlebars.compile(templates[partial])(context);
}
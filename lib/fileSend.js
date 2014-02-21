
var fs = require('fs');

//simple function for loading a file and sending to a client
//for use in app.<VERB> callbacks when requesting a static page
var sendFile = exports.sendFile = function(filename, res) {
  fs.readFile('public/' + filename, function(err, data) {
    if (err) return res.send('Could not open ' + filename + '...');
    res.setHeader('Content-Type', 'text/html');
    res.send(data);
  });
};

var sendHandlebarsFile = exports.sendHandlebarsFile = 
function(handlebars, file, context, res, callback) {
  if (!callback) callback = function() {}
  fs.readFile('public/' + file, 'utf8', function(err, data) {
    if (err) return callback(err, null);
    
    var template = handlebars.compile(data);
    res.setHeader('Content-Type', 'text/html');
    res.send(template(context));
  });
};
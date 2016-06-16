#!/bin/env node
/**
 * Mike Bogochow
 * simple-site-framework
 * app.js
 */

/**
 * Module dependencies.
 */
var express         = require('express')
    , handlebars    = require('handlebars')
    , http          = require('http')
    , path          = require('path')
    , favicon       = require('serve-favicon')
    , bodyParser    = require('body-parser')
    , methodOverride = require('method-override')
    , morgan        = require('morgan')
    , partials      = require('./lib/partials')
    , fs            = require('fs')
    , fileSend      = require('./lib/fileSend.js')
    , xml2js        = require('xml2js')
    , markdown 	    = require('markdown')
    ;

var app = express();
var xmlParser = xml2js.parseString;
var mdParser = markdown.markdown;

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public', {
    index: false
}));
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override'));

partials.regPartials(handlebars);

/**
 * Handlebars helper which checks if variable contains anything but whitespace.
 */
handlebars.registerHelper('unless_empty', function (item, block) {
    return (item && /\S/.test(item)) ? block.fn(this) : block.inverse(this);
});


/**
 * Send the given file to the user.  If req.handlebars is defined, then it will
 * be sent as a compiled Handlebars file.
 */
var sendPage = function (file, req, res) {
    if (req.handlebars) {
        fileSend.sendHandlebarsFile(req.handlebars, file, req.context, res,
            function (err) {
                console.dir(err);
                res.status(300).send();
            });
    } else {
        fileSend.sendFile(file, res);
    }
};

/**
 * Get a JS object from the data file.
 */
function getData() {
    var components_file = "data/bootstrap-components.json";
    return JSON.parse(fs.readFileSync(components_file, 'utf8'));
}

/**
 * Get the page with the given name from the data object.
 */
function getPage(data, navkey, sidekey) {
    if (sidekey) {
        if (data.nav[navkey].sidebar[sidekey])
            return data.nav[navkey].sidebar[sidekey];
    } else {
        if (data.nav[navkey])
            return data.nav[navkey];
    }
    return null;
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
function getContext(navkey, sidekey) {
    var context = getData();
    var page = getPage(context, navkey, sidekey);

    if (page != null)
        page.active = partials.active;

    context.page = page;
    context.sidebar = context.nav[navkey].sidebar;
    context.jquery = fs.existsSync('public/javascripts/jquery.min.js');
    context.bootstrap = fs.existsSync('public/bootstrap');
    context.prettify = fs.existsSync('public/google-code-prettify');
    context.hljs = fs.existsSync('public/javascripts/highlight.min.js');

    var data_files = page['data-files'];
    for (var fkey in data_files) {
        var data_file = data_files[fkey];
        if (!data_file.filetype)
            data_file.filetype = getFileType(data_file.filename);
        if (equalsIgnoreCase(data_file.filetype, "xml")) {
            var xml = fs.readFileSync("data/" + data_file.filename, 'utf8');
            xmlParser(xml, {trim: true, normalize: true, explicitArray: false}, function (err, result) {
                if (err) {
                    console.err('Failed to load XML data file: ' + err);
                    return null
                }
                context[data_file.name] = result;
            });
        }
        else if (equalsIgnoreCase(data_file.filetype, 'md')) {
            var md = fs.readFileSync('data/' + data_file.filename, 'utf8');
            context[data_file.name] = mdParser.toHTML(md);
        }
    }
    return context;
}

/**
 * Start the server.  Initialize app.get() for each page in the data file.
 */
app.listen(app.get('port'), function() {
    var components = getData();

    var callback = function (file, navkey, sidekey) {
        return function (req, res) {
            req.context = getContext(navkey, sidekey);
            req.handlebars = handlebars;
            sendPage(file, req, res);
        }
    };

    for (var navkey in components.nav) {
        var nav = components.nav[navkey];

        app.get(nav.target, callback(nav.filename, navkey));

        for (var sidekey in nav.sidebar) {
            var sidebar = nav.sidebar[sidekey];
            app.get(sidebar.target, callback(sidebar.filename, navkey, sidekey));
        }
    }
    
    console.log('Express server listening on port ' + app.get('port'));
});

let express = require('express')
  , fs = require('fs')
  , xml2js = require('xml2js').parseString
  , md2html = require('markdown-it')()
  , hbsHelper = require('../lib/hbsHelper')
  , MongoClient = require('mongodb').MongoClient
  , format = require('util').format;

let partials = hbsHelper.partials;

/**
 * Get the file type by extracting the file extension from the given file name.
 * Returns null if a file extension could not be found.
 */
function getFileType(filename) {
    let matches = /\.[0-9a-z]+$/i.exec(filename);
    if (!matches) return null;
    return matches[0].replace(".", "");
}

/**
 * Compare two strings ignoring case.
 */
function equalsIgnoreCase(str1, str2) {
    return str1.toUpperCase() === str2.toUpperCase();
}

/**
 * Get a JS object from the data file.
 */
function getData() {
    let components_file = "data/components.json";
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

// Parse the components file for data
const components = getData();
function copyContext() {
    // This will work since the object will always be simple (no functions or dates)
    return JSON.parse(JSON.stringify(components));
}

function parseFile(dataSource) {
    let sourceContext;

    // Determine the file type based on the file extension if no filetype is provided
    if (!dataSource.filetype) {
        dataSource.filetype = getFileType(dataSource.filename);
    }

    // Read and render the data file contents
    const fileContents = fs.readFileSync("data/" + dataSource.filename, 'utf8');
    if (equalsIgnoreCase(dataSource.filetype, "xml")) {
        xml2js(fileContents, {trim: true, normalize: true, explicitArray: false}, function(err, result) {
            if (err) {
                console.err('Failed to load XML data file: ' + err);
                return null
            }
            sourceContext = result;
        });
    } else if (equalsIgnoreCase(dataSource.filetype, "md")) {
        sourceContext = md2html.render(fileContents);
    }

    return sourceContext;
}

function parseMongodb(dataSource) {
    let auth = JSON.parse(fs.readFileSync("data/" + dataSource.authfile, 'utf8'));
    let url = format("mongodb://%s:%s@%s:%s/%s?authMechanism=%s&authSource=%s", auth.user, auth.password, auth.host, auth.port, auth.db, (auth.mechanism ? auth.mechanism : 'DEFAULT'), auth.db);

    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function(err, database) {
            let sourceContext;

            if (err) {
                reject(err);
            } else {
                let db = database.db(auth.db);

                sourceContext = {data: {mods: {mod: []}}};
                db.collection(dataSource.collection).find().toArray((err, items) =>  {
                    if (err) {
                        reject(err);
                    } else {
                        const actualItems = items[0];
                        for (const key in actualItems) {
                            if (key !== '_id' && actualItems.hasOwnProperty(key)) {
                                sourceContext.data.mods.mod.push(actualItems[key]);
                            }
                        }

                        database.close();
                        resolve({dataSource: dataSource, context: sourceContext});
                    }
                });
            }
        });
    });
}

/**
 * Get the context for the given page from the data file.
 */
function getContext(navkey, sidekey, callback) {
    const context = copyContext();
    const page = getPage(context, navkey, sidekey);

    if (page != null)
        page.active = partials.active;

    context.nav[navkey].active = partials.active;
    context.page = page;
    context.sidebar = context.nav[navkey].sidebar;
    context.jquery = fs.existsSync('public/javascripts/jquery.min.js');
    context.bootstrap = fs.existsSync('public/bootstrap');
    context.prettify = fs.existsSync('public/google-code-prettify');
    context.hljs = fs.existsSync('public/javascripts/highlight.min.js');

    let dataSources = page['data-sources'];
    let promises = [];
    if (dataSources) {
        for (let dataSource of dataSources) {
            if (dataSource.type === 'file') {
                promises.push({dataSource: dataSource, context: parseFile(dataSource)});
            } else if (dataSource.type === 'mongodb') {
                promises.push(parseMongodb(dataSource));
            } else {
                console.log('Unrecognized data source type: ' + dataSource.type);
            }
        }
    }

    Promise.all(promises)
        .then(results => {
            for (let result of results) {
                context[result.dataSource.name] = result.context;
            }

            callback(context);
        })
        .catch(err => {
            callback('error', err);
        });
}

// Creates the callback for rendering the pages by the router
const callback = function (view, navkey, sidekey) {
    return function (req, res) {
        getContext(navkey, sidekey, function (context, err) {
            if (err) {
                res.render('error', {error: err});
            } else {
                res.render(view, context);
            }
        });
    }
};

const router = express.Router();
module.exports = {router: router, targets: []};

// Parse the components to set up the router and add targets to export
for (const navkey in components.nav) {
    const nav = components.nav[navkey];

    if (nav.target) {
        router.get(nav.target, callback(nav.view, navkey));
        module.exports.targets.push(nav.target);
    }

    for (const sidekey in nav.sidebar) {
        if (nav.sidebar.hasOwnProperty(sidekey)) {
            const sidebar = nav.sidebar[sidekey];
            router.get(sidebar.target, callback(sidebar.view, navkey, sidekey));
            module.exports.targets.push(sidebar.target);
        }
    }
}

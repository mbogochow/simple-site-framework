let express = require('express')
  , fs = require('fs')
  , xml2js = require('xml-js').xml2js
  , md2html = require('markdown-it')()
  , hbs = require('hbs')
  , partials = require('../lib/partials');

// Register all template partials in the partials directory
partials.regPartials(hbs);

let getValue = function (item) {
    if (item instanceof Object) {
        // If it is an empty object then return an empty string
        if (Object.keys(item).length === 0) {
            return '';
        }

        // Extract the actual value based on xml2js keys
        if (item.hasOwnProperty('_text')) {
            return item._text;
        } else if (item.hasOwnProperty('_cdata')) {
            return item._cdata;
        }
    }

    return item;
};
hbs.registerHelper('gv', getValue);

/**
 * Handlebars helper which checks if variable contains anything but whitespace.
 */
hbs.registerHelper('unless_empty', function (item, options) {
    if (item === null || item === undefined) {
        return options.inverse(this);
    }

    let value = getValue(item);
    // Check that it is a non-empty string (all white-space considered empty)
    return /\S/.test(value) ? options.fn(this) : options.inverse(this);
});

hbs.registerHelper('get_nav', function (nav, key, field) {
    if (field) {
        return nav[key][field];
    } else {
        return nav[key];
    }
});

/**
 * if_not_false
 * Returns true as long as the value !== false
 */
hbs.registerHelper('if_not_false', function (value, options) {
    return value !== false ? options.fn(this) : options.inverse(this);
});

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

/**
 * Get the context for the given page from the data file.
 */
function getContext(navkey, sidekey) {
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

    const data_files = page['data-files'];
    if (data_files) {
        for (let data_file of data_files) {
            // Determine the file type based on the file extension if no filetype is provided
            if (!data_file.filetype) {
                data_file.filetype = getFileType(data_file.filename);
            }

            // Read and render the data file contents
            const fileContents = fs.readFileSync("data/" + data_file.filename, 'utf8');
            if (equalsIgnoreCase(data_file.filetype, "xml")) {
                context[data_file.name] = xml2js(fileContents, {trim: true, compact: true, ignoreComment: true});
            } else if (equalsIgnoreCase(data_file.filetype, "md")) {
                context[data_file.name] = md2html.render(fileContents);
            }
        }
    }

    return context;
}

// Creates the callback for rendering the pages by the router
const callback = function (view, navkey, sidekey) {
    return function (req, res) {
        res.render(view, getContext(navkey, sidekey));
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

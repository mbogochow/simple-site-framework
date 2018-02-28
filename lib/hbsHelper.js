let hbs = require('hbs')
  , partials = require('../lib/partials');

exports.hbs = hbs;

// Register all template partials in the partials directory
partials.regPartials(hbs);
exports.partials = partials;

// Register custom hbs helpers
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
 * Log the value to console.log
 */
hbs.registerHelper('log', function (value) {
    console.log(value);
});

module.exports = exports;
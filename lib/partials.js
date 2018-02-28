let fs = require('fs');

let templates = exports.templates = {};
exports.active = 'active';

exports.regPartials = function (handlebars) {
    let partialsDir = __dirname + '/../views/partials';
    let filenames = fs.readdirSync(partialsDir);

    filenames.sort(function (a, b) {
        return a < b ? -1 : 1;
    }).forEach(function (filename) {
        let matches = /^([^.]+).hbs$/.exec(filename);
        if (!matches) {
            return;
        }

        let name = matches[1];
        let template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');

        templates[name] = template;

        handlebars.registerPartial(name, template);
    });
};

exports.compile = function (handlebars, partial, context) {
    return handlebars.compile(templates[partial])(context);
};

module.exports = exports;
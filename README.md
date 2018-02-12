# Simple Site Framework

## Description

This is a simple framework for throwing data into connected dynamic web pages without needing to touch any of the server code or style layout.  It uses [Twitter Bootstrap 4.0](http://getbootstrap.com) using a simple layout with top and side navbar for styling the pages.  Also includes [jQuery](http://jquery.com) and some custom scripts.  It is designed to be able to be used offline if desired.

The framework uses [Handlebars.js](http://handlebarsjs.com) for templating and heavily utilizes partials for simple and uncluttered page creation while keeping the same bootstrap theme for each page and leaving navigation between pages intact.

## Installation

It can be run as is after user content is added.  Bootstrap and jQuery are not provided and so it will attempt to pull these resources from the web on page load if it cannot find them locally.  

In order to be able to operate offline:

1. Download the [Bootstrap distribution package](https://getbootstrap.com/docs/4.0/getting-started/download/).
	- Unzip the package and rename the folder to `bootstrap`.  Place this folder in the `public` directory.
2. Download [jQuery](http://code.jquery.com/jquery-3.3.1.min.js).
	- Rename this file to `jquery.min.js` and place it in the `public/javascripts` directory.
3. Optional: The system supports [Google Code Prettify](https://code.google.com/p/google-code-prettify/).  The effects of Prettify are only seen if you have a `<pre>` tag with `class="prettyprint"`.
	- If you would like to use this feature offline, download the [small package](https://code.google.com/p/google-code-prettify/downloads/list).
	- Extract and move the `google-code-prettify` folder to the `public` directory.
4. Optional: The system also supports [Highlight.js](http://highlightjs.org/).  Highlight.js' syntax highlighting will be active within any `pre > code` tags where the `pre`'s class is not `prettyprint`.
	- If you would like to use Highlight.js offline, download the [javascript file](https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js) and the [CSS file](https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/default.min.css).
	- Move the javascript file to the `public/javascripts` directory and the CSS file to the `public/stylesheets` directory.

## Data Storage

Data is stored in files in the data directory.  Page information is stored in a JSON file named `components.json` with the format:

```json
{
    "brand": "brandName",  
    "nav": {
        "navItem1": {
            "name": "navItem1Name", 
            "target": "/navItem1",
            "title": "navItem1Title",
            "view": "navItem1"
        }
    }, "sidebar": {
        "sideItem1": {
            "name": "sideItem1Name",
            "target": "/sideItem1",
            "title": "sideItem1Title",
            "view": "sideItem1"
        }
    }
}
```

Where `"brand"` is the text that appears in the far left of the navbar on each page.  Each entry in the `"nav"` object represents a button on the navbar and each entry in the `"sidebar"` object is a link on the sidebar.

The following are brief descriptions of each field in the `"nav"` and `"sidebar"` objects:

- `"name"`: The name to appear on the button or link on the navbar or sidebar respectively.
- `"target"`: The target of the link.  What it is set to is arbitrary as long as each entry has a unique target between both `"nav"` and '"sidebar"' entries.  There should also be at least one target for `"/"`.
- `"title"`: The title to appear on the page when it is loaded.
- `"view"`: The name of the view to be loaded from the server for this entry.  There must be a matching view in the views directory to receive the content.

In addition, any other field names may be added anywhere in this file to be used in user pages.  Any of these additional fields will have no effect unless you do something with them on your pages.

For example, if I want two navbar items, one for navigating to home and one to an about page, I would have the following for my `"nav"` object:

```json
//...
"nav": {
    "index": {
        "name": "Home",
        "target": "/"
    },
    "about": {
        "name": "About",
        "target": "/about"
    }
}//...
```

This would produce the following navbar: 

![Alt text](https://github.com/mbogochow/simple-site-framework/blob/master/images/example_navbar.PNG?raw=true)

An example for the sidebar would be similar as they share the same fields.

## Additional Data Files

Additional data files can be loaded to be used by a page using the `data-files` array of a nav or sidebar object.  Any number of files can be added to this array.  The `data-files` array contains objects of the following form:

```json
"data-files": [
    {"name": "", "filename": "", "filetype": ""}
]
```

The fields of the object have the following meaning:

- `name`: An identifier for data.  This will be the name assigned to the data for page creation.
- `filename`: The name of the file to load.
- `filetype`: The type of the file.  If this field is not given, then it will attempt to figure out the file type from the file extension of file given in `filename`.  Currently, supports XML and Markdown.

For XML files, the system uses [xml-js](https://www.npmjs.com/package/xml-js) to create a JS object from the xml file, so at page creation, this `data-files` array:

```json
"data-files": [
    {"name": "my_data", "filename": "my_data.xml", "filetype": "xml"}
]
```

with this content of `my_data.xml`:

```xml
<examples>
    <example>
        <name>My Example</name>
        <description>This an example xml file</description>
    </example>
</examples>
```

would produce the following JS object for page creation: 

```javascript
my_data: {
    examples: {
        example: {
            name: {_text: "My Example"},
            description: {_text: "This is an example xml file"}
        }
    }
}
```

The `my_data` object would be a field in `req.context` so that it can be used for Handlebars.js templates.

For Markdown files, the system uses [markdown-it](https://www.npmjs.com/package/markdown-it) to create an HTML document from the Markdown document.  This document is placed into the `name` field of `req.context` and so it can be accessed through Handlebars with `{{{this.name}}}`.

# Page Creation

The navbar and sidebar will automatically be loaded in correctly for you for each of your pages leaving you to be able to define content of the main section of the page.  You have full power to use any HTML, JS, jQuery, etc. here including using Bootstrap and Handlebars.js features.

Each page should be an HTML document in the public directory with the format:

```mustache
{{> basic-page-top this}}

// Your code

{{> basic-page-bottom this}}
```

The two `{{> ... }}` sections are Handlebars.js partials that load in the rest of the page.

An full example of a page would be:

```html
{{> basic-page-top this}}

<div class="row">
  {{#each sidebar}}
  <div class="col-4">
    <h2>{{this.name}}</h2>
    <p>
      {{{this.description}}}
    </p>
    <p><a class="btn btn-secondary" href="{{this.target}}" role="button">View details ></a></p>
  </div>
  {{/each}}
</div>

{{> basic-page-bottom this}}
```

This could be loaded into the framework with the following `components.json`: 

```json
{
  "brand": "Brand",
  "nav": {
    "index": {
      "name": "Home", 
      "target": "/",
      "title": "This is my example <small>HTML tags here</small>",
      "view": "index",
      "sidebar": {
        "example_content": {
          "name": "Example Content", 
          "target": "/content",
          "title": "Example Content Page",
          "description": "This is a non-existent page created for an example.",
          "view": "noex"
        }
      }
    }
  }
}
```

Which would produce the following page:

![Alt text](https://github.com/mbogochow/simple-site-framework/blob/master/images/example_page.PNG?raw=true)

# Customization

The following files are automatically loaded into each page in the fluid layout:

* /public/stylesheets/custom.scss
* /public/javascripts/custom.js

Therefore, anything added to these files will affect each page on the site.

Alternatively, in place of the `basic-page-top` partial you can use the `basic-page-top-open` and `basic-page-top-close` partials.  Any styles, stylesheets or scripts that you load in between these partials will be loaded into the page.

In addition, in place of the `basic-page-bottom` partial, you can use the `basic-page-bottom-open` and `basic-page-bottom-close` partials.  This will work the same as the top partial but for scripts which should be loaded at the bottom of the body.

Using these alternate partials allows for customization on a page-by-page basis.

# Future Features

The following are on the TODO list:

1. POSTs
2. Additional data sources
3. Additional navigation options
4. Add more bootstrap themes

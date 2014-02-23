Simple Site Framework
==================================================

Description
--------------------------------------

This is a simple framework for throwing data into connected dynamic web pages without needing to touch any of the server code or style layout.  It uses [Twitter Bootstrap 3.1.1](http://getbootstrap.com) using a fluid layout for styling the pages.  Also includes [jQuery](http://jquery.com) and some custom scripts.  It is designed to be able to be used offline by default.

The framework uses [Handlebars.js](http://handlebarsjs.com) for templating and heavily utilizes partials for simple and uncluttered page creation while keeping the same bootstrap theme for each page and leaving navigation between pages intact.

Installation
--------------------------------------
It can be run as is after user content is added.  Bootstrap and jQuery are not provided and so it will attempt to pull these resources from the web on page load if it cannot find them locally.  

In order to be able to operate offline:

1. Download the Twitter Bootstrap distribution package from [here](https://github.com/twbs/bootstrap/releases/download/v3.1.1/bootstrap-3.1.1-dist.zip) or go to [http://getbootstrap.com/](http://getbootstrap.com/).
2. Unzip the package and rename the folder to `bootstrap`.  Place this folder in the `public` directory.
3. Download jQuery from [here](//code.jquery.com/jquery-1.10.2.min.js) or go to [http://code.jquery.com/jquery-1.10.2.min.js](http://code.jquery.com/jquery-1.10.2.min.js).
4. Rename this file to `jquery.min.js` and placed it in the `public/javascripts` directory.
5. Optional: The system supports [Google Code Prettify](https://code.google.com/p/google-code-prettify/).  The effects of Prettify are only seen if you have a `<pre>` tag with `class="prettyprint"`.  If you would like to use this feature offline, download the small package from [here](https://code.google.com/p/google-code-prettify/downloads/detail?name=prettify-small-4-Mar-2013.tar.bz2&can=2&q=) or go to [https://code.google.com/p/google-code-prettify/downloads/list](https://code.google.com/p/google-code-prettify/downloads/list).  Extract and move the `google-code-prettify` folder to the public folder.


Data Storage
==============================

Data is stored in files in the data directory.  Page information is stored in a JSON file named `bootstrap-components.json` with the format:

	{
		"brand": "brandName",  
		"nav": {
			"navItem1": {
				"name": "navItem1Name", 
				"target": "/navItem1"
				"title": "navItem1Title",
				"filename": "navItem1.html"
			}
		}, "sidebar": {
			"sideItem1": {
				"name": "sideItem1Name",
				"target": "/sideItem1",
				"title": "sideItem1Title",
				"filename": "sideItem1.html"
			}
		}
	}

Where `"brand"` is the text that appears in the far left of the navbar on each page.  Each entry in the `"nav"` object represents a button on the navbar and each entry in the `"sidebar"` object is a link on the sidebar.

The following are brief descriptions of each field in the `"nav"` and `"sidebar"` objects:

- `"name"`: The name to appear on the button or link on the navbar or sidebar respectively.
- `"target"`: The target of the link.  What it is set to is arbitrary as long as each entry has a unique target between both `"nav"` and '"sidebar"' entries.  There should also be at least one target for `"/"`.
- `"title"`: The title to appear on the page when it is loaded.
- `"filename"`: The name of the file to be loaded from the server for this entry.

In addition, any other field names may be added anywhere in this file to be used in user pages.  Any of these additional fields will have no effect unless you do something with them on your pages.

For example, if I want two navbar items, one for navigating to home and one to an about page, I would have the following for my `"nav"` object:

	//...,
	"nav": {
		"index": {
			"name": "Home",
			"target": "/"
		},
		"about": {
			"name": "About",
			"target": "/about"
		}
	}//,..
	
This would produce the following navbar: 

![Alt text](https://github.com/mbogochow/simple-site-framework/blob/master/images/example_navbar.PNG?raw=true)

An example for the sidebar would be similar as they share the same fields.

Additional Data Files
--------------------------------------
Additional data files can be loaded to be used by a page using the `data-files` array of a nav or sidebar object.  Any number of files can be added to this array.  The `data-files` array contains objects of the following form:

	"data-files": [
		{"name": "", "filename": "", "filetype": ""}
	]

The fields of the object have the following meaning:

- `name`: An identifier for data.  This will be the name assigned to the data for page creation.
- `filename`: The name of the file to load.
- `filetype`: The type of the file.  If this field is not given, then it will attempt to figure out the file type from the file extension of file given in `filename`.  Currently, only supports XML files.

For XML files, the system uses [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js) to create a JS object from the xml file, so at page creation, this `data-files` array:

	"data-files": [
		{"name": "my_data", "filename": "my_data.xml", "filetype": "xml"}
	]

with this content of `my_data.xml`:

	<examples>
		<example>
			<name>My Example</name>
			<description>This an example xml file</description>
		</example>
	</examples>

would produce the following JS object for page creation: 

	my_data: {
		examples: {
			example: {
				name: "My Example",
				description: "This is an example xml file"
			}
		}
	}

The `my_data` object would be a field in `req.context` so that it can be used for Handlebars.js templates.

Page Creation
======================================

The navbar and sidebar will automatically be loaded in correctly for you for each of your pages leaving you to be able to define content of the main section of the page.  You have full power to use any HTML, JS, jQuery, etc. here including using Bootstrap and Handlebars.js features.

Each page should be an HTML document in the public directory with the format:

	{{> bootstrap-fluid-top this}}
	
	// Your code

	{{> bootstrap-fluid-bottom this}}

The two `{{> ... }}` sections are Handlebars.js partials that load in the rest of the page.

An full example of a page would be:

	{{> bootstrap-fluid-top this}}
	
	<div class="row">
	  {{#each sidebar}}
	    <div class="col-md-4">
	      <h2>{{this.name}}</h2>
	      <p>
	        {{{this.description}}}
	      </p>
	      <p><a class="btn btn-default" href="{{this.target}}" role="button">View details ></a></p>
	    </div>
	  {{/each}}
	</div><!--/row-->

	{{> bootstrap-fluid-bottom this}}

This could be loaded into the framework with the following `bootstrap-components.json`: 

	{
	  "brand": "Brand",
	  "nav": {
	    "index": {
	      "name": "Home", 
	      "target": "/",
	      "title": "This is my example <small>html tags here</small>",
	      "filename": "index.html"
	    }
	  },
	  "sidebar": {
	    "example_content": {
	      "name": "Example Content", 
	      "target": "/content",
	      "title": "Example Content Page",
	      "description": "This is a non-existant page created for an example.",
	      "filename": "noex.html"
	    }
	  }
	}

Which would produce the following page:

![Alt text](https://github.com/mbogochow/simple-site-framework/blob/master/images/example_page.PNG?raw=true)


Future Features
--------------------------------------
The following are on the TODO list:

1. POSTs 
2. Support for having different sidebar links for each navbar item.
2. Add more bootstrap themes.
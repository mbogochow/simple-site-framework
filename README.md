Simple Site Framework
==================================================

Description
--------------------------------------

This is a simple framework for throwing data into connected dynamic web pages without needing to touch any of the server code or style layout.  It uses Twitter Bootstrap 3.1.1 using a fluid layout for styling the pages.  Also includes jQuery and some custom scripts.  It is designed to be able to be used offline by default.

The framework uses Handlebars.js for templating and heavily utilizes partials for simple and uncluttered page creation while keeping the same bootstrap theme for each page and leaving navigation between pages intact.

Installation
--------------------------------------
It can be run as is after user content is added.  Bootstrap and jQuery are not provided and so it will attempt to pull these resources from the web if it cannot find them locally.  

In order to be able to operate offline:

1. Download the Twitter Bootstrap distribution package from [here](https://github.com/twbs/bootstrap/releases/download/v3.1.1/bootstrap-3.1.1-dist.zip) or go to [http://getbootstrap.com/](http://getbootstrap.com/).
2. Unzip the package and rename the folder to `bootstrap`.  Place this folder in the `public` directory.
3. Download jQuery from [here](//code.jquery.com/jquery-1.10.2.min.js) or go to [http://code.jquery.com/jquery-1.10.2.min.js](http://code.jquery.com/jquery-1.10.2.min.js).
4. Rename this file to `jquery.min.js` and placed it in the `public/javascripts` directory.


Data Storage
--------------------------------------

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

![Alt text](https://github.com/mbogochow/simple-site-framework/raw/master/images/example_navbar.png)

An example for the sidebar would be similar as they share the same fields.

Page Creation
--------------------------------------

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

![Alt text](images/example_page.png)

Future Features
--------------------------------------
The following are on the TODO list:

1. Implement more data storage for user pages.  This will likely be XML support as well as addition JSON files support.
2. POSTs 
3. Add more bootstrap themes.
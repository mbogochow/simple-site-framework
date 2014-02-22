

/*
 * Return an HTML string with the given href attribute and inner HTML.
 */
function makeLink(href, display)
{
  return '<a href="' + href + '">' + display + '</a>';
}

/* 
 * Set the given category key to active.
 */
function setActive(categories, category)
{
  categories[category].active = true;
}

/*
 * Make and attribute object with the given name and value
 */
function makeAttribute(name, value)
{
  var attr = document.createAttribute(name);
  attr.nodeValue = value;
  
  return attr;
}

/* 
 * Returns true if the template tag is supported; false otherwise.
 */
function templatesSupported()
{
  return 'content' in document.createElement('template');
}

/* 
 * Get the content of the template tag with the given id or the first template 
 * if an id is not given.
 */
function getTemplateContent(id)
{
  var name = 'template';
  if (id)
    name += '#' + id;
  
  return document.querySelector(name).content;
}

/* 
 * Adds the template node as a child to the element with the given CSS selector.
 */
function addTemplate(parentSelector, node)
{
  document.querySelector(parentSelector)
          .appendChild(document.importNode(node, true));
}

/* 
 * Set text content of the header of the page-header div to the given text.
 */
function setPageHeader(header)
{
  var pageHeader = document.querySelector('div.page-header h1');
  
  pageHeader.textContent = header;
}

/* 
 * Set sidebar list to have the given categories.
 */
function setSidebar(categories)
{
  var content = getTemplateContent('sidebar');
  
  var listItem = content.querySelector('li');
  //list.innerHTML = "";
  for (var category in categories)
  {
    var cat = categories[category];
    listItem.innerHTML = makeLink(cat.file, cat.name);
    if (cat.active == true)
    {
      listItem.attributes.setNamedItem(makeAttribute('class', 'active'));
    }
  }
  
  addTemplate('.nav-sidebar', content);
}

/* 
 * Add content to the main div.
 */
function addContent(id, name, description)
{
  var content = getTemplateContent('content');
  
  var container = content.querySelector('div.content');
  var header = container.querySelector('h2');
  var desc = container.querySelector('div.description');
  
  container.attributes.setNamedItem(makeAttribute("id", id));
  header.textContent = name;
  desc.innerHTML = description;
  
  addTemplate('div.main', content);
}

/* 
 * Load data from XML file.  Uses jquery.
 */
function loadData(dataFile) { 
	$.get(dataFile, {}, function(xml) {
		// Run the function for each student tag in the XML file
		$('mod', xml).each(function(i) {
      var modID = $(this).find("id").text();
      var modName = $(this).find("name").text();
      var modDescription = $(this).find("description").text();
			
      addContent(modID, modName, modDescription);
		});
	});
}
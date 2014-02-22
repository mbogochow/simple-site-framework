
function init(id)
{
  var categories = {
    installed_mods: 
      {name: "Installed Mods", file: "installed_mods.html"}
  };
  
  categories[id].active = true;
  setSidebar(categories);
  
  return categories;
}
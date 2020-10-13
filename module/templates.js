/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [

    // Actor Sheet Partials
    "systems/glog/templates/actor/parts/actor-traits.html",
    "systems/glog/templates/actor/parts/actor-inventory.html",
    "systems/glog/templates/actor/parts/actor-features.html",
    "systems/glog/templates/actor/parts/actor-spellbook.html",
    "systems/glog/templates/actor/parts/actor-effects.html",


    // // Item Sheet Partials
    "systems/glog/templates/item/parts/item-action.html",
    "systems/glog/templates/item/parts/item-activation.html",
    "systems/glog/templates/item/parts/item-description.html",
    "systems/glog/templates/item/parts/item-stats.html",

    // rolled things
    "systems/glog/templates/chat/roll-damage.html",
    "systems/glog/templates/chat/roll-result.html",
    "systems/glog/templates/chat/roll-spell.html",

  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};

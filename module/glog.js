// Import Modules
import { GlogActor } from "./actor/actor.js";
import { GlogCharacterSheet } from "./actor/character-sheet.js";
import { GlogEnemySheet } from "./actor/npc-sheet.js";
import { GlogItem } from "./item/item.js";
import { GlogItemSheet } from "./item/item-sheet.js";
import { G } from "./config.js";
import { registerSystemSettings } from "./settings.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import TraitSelector from "./apps/trait-selector.js";

/**
 * GLOG - Mostly Many Rats on a Stick 
 * 
 * - "mostly" because it uses Many Rats on a stick as a starting point (defaults) 
 *   but may include config settings and overrides that let you adapt it to 
 *   other GLOG hacks (i.e. roll over behavior rather than roll under + opposed rolls)
 * 
 * Based on the Glog Hack by Skerples found here: 
 *   https://coinsandscrolls.blogspot.com/2019/10/osr-glog-based-homebrew-v2-many-rats-on.html
 *   which is licensed under CC-BY-SA 3.0:
 *      https://creativecommons.org/licenses/by-sa/3.0/
 * 
 *   - free to share 
 *   - free to adapt 
 * 
 * This implementation for FoundryVTT is licensed under GPL Version 3 (see LICENSE.txt).
 *    styling, and some foundryVTT api code snippets are based on the GPL Version 3 
 *    implementation of the Open Gaming License DND5 Foundry VTT repository 
 *    here: https://gitlab.com/foundrynet/dnd5e , which was used as an API reference resource 
 *    during development of this module.
 */

Hooks.once('init', async function () {

  console.log(`GLOG | Initializing the Goblin Laws of Gaming - Mostly Many Rats On a Stick`);
  console.log(G.LOGO);
  game.glog = {
    applications: {
      GlogActor,
      GlogItem,
      TraitSelector
    },
    config: G
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.G = G;
  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2
  };

  // Define custom Entity classes
  CONFIG.Actor.entityClass = GlogActor;
  CONFIG.Item.entityClass = GlogItem;

  // Register System Settings
  registerSystemSettings();

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("glog", GlogCharacterSheet, { types: ["character"], makeDefault: true, label: "GLOG.SheetClassCharacter" });
  Actors.registerSheet("glog", GlogEnemySheet, { types: ["npc"], makeDefault: true, label: "GLOG.SheetClassNPC"});
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("glog", GlogItemSheet, { makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function () {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
  });

  // Preload Handlebars Templates
  preloadHandlebarsTemplates();
});
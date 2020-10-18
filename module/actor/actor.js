// import { glogRoll, getRollableProperties, basicWeaponAttack } from "../roll/roll.js";

import { calculateAttributes } from "./attributes.js";
import { collectStatMods, summarizeMods, applyBaseAbilityModifiers } from "./modifiers.js";
import { G } from '../config.js';
import { S } from '../sanctuary.js';
import * as display from "../roll/display.js";
import * as weapon from "../roll/weapon.js";
import * as roll from "../roll/roll.js";
import { GlogDice } from "../roll/dice.js";


/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class GlogActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this.data;

    this._syncVersions(actorData.data);

    switch (actorData.type) {
      case "character":
        return this._prepareCharacterData(actorData);
      case "npc":
        return this._prepareNpcData(actorData);
    }

  }

  _syncVersions(data) {
    if(!data.stats.hasOwnProperty("meleeFumbleRange")) {
      data.stats["meleeFumbleRange"] = {value: 0};
    }
    if(!data.stats.hasOwnProperty("rangeFumbleRange")) {
      data.stats["rangeFumbleRange"] = {value: 0};
    }
  }


  /** @override */
  async createOwnedItem(itemData, options) {

    if (this.data.type === "character") {
      let t = itemData.type;
      let initial = {};
      initial["data.ownedByPC"] = true;
      mergeObject(itemData, initial)
    } else {
      // TODO need to revisit these since the user can't change them in the current UI
      // NPC spells are always spells, weapons always equipped (not that it matters)
      let t = itemData.type;
      let initial = {};
      if (t === "weapon") initial["data.proficient"] = true;
      if (t === "weapon") initial["data.ownedByPC"] = false;
      if (["weapon", "equipment"].includes(t)) initial["data.equipped"] = true;
      if (t === "spell") initial["data.prepared"] = true;
      if (t === "spell") initial["data.type"] = "brain";
      if (t === "feat") initial["data.activation.type"] = "";
      mergeObject(itemData, initial);
    }
    return super.createOwnedItem(itemData, options);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;

    /**
     * TODO need to clean these up but for now, on the template.json file 
     * abilities -> str, dex, con, int 
     * stats -> these are all modifiers, not actually statistics themselves 
     *   (( this is poorly named but avoiding the refactoring for now ))
     * aux -> Just fatigue, this is a stupid name 
     * 
     * primaryStats ->  derived stats we care about that have modifiers or 
     *        are rollable 
     *        examples: meleeAttack (modified by stat.meleeAttack) 
     *                  def (modified by stat.modified) 
     * 
     * These are toggable via the TWEAKS section of the character sheet 
     * to turn on/off auto calculating vs. entering them
     * 
     */


    /** Handle override tweak settings ***************************/
    let uconfig = {}
    if (data.hasOwnProperty("uconfig")) {
      uconfig = data.uconfig
    } else {
      for (let [s, stat] of Object.entries(CONFIG.G.configStats)) {
        uconfig[s] = false;
      }
      data['uconfig'] = uconfig;
    };

    for (let [s, stat] of Object.entries(CONFIG.G.abilities)) {
      data.abilities[s].override = uconfig[s];
    }

    for (let [s, stat] of Object.entries(data.primaryStats)) {
      if(s === "meleeAttack" || s === "rangeAttack") {
        data.primaryStats[s].override = uconfig["attack"];
      } else {
      data.primaryStats[s].override = uconfig[s];
      }
    }

   /************************************************************** */


    // collect the statMods up front as this is used in several places
    const relevantStatMods = collectStatMods(actorData.items, G);
    const equippedModSummary = summarizeMods(
      [relevantStatMods.auto.mods, relevantStatMods.autoEffects.mods],
      G.modifiers
    );
    data['relevantStatMods'] = relevantStatMods;
    data['equippedModSummary'] = equippedModSummary;

    /**
     * Sequence:
     * Figure out the base ability modifiers
     * Apply calculate total fatigue + apply it
     * Figure out # of slots (remember the inventory slot modifier)
     * Figure out encumbrance
     * Figure out the remaining derived stats
     * 
     */
    applyBaseAbilityModifiers(data.abilities, equippedModSummary);
    this._determineSlotLimits(data, actorData.items, equippedModSummary["fatigueMod"]);
    calculateAttributes(data, actorData.items, equippedModSummary);
    data["allStats"] = { ...data.abilities, ...data.stats, ...data.primaryStats }
    for (let [a, abl] of Object.entries(data["allStats"])) {
      if (!abl.hasOwnProperty("total")) {
        abl.total = abl.value
      }
    };

  }

  _determineSlotLimits(data, items, fatigueMod) {
    const stats = data.stats;
    const invQuickMod = data['equippedModSummary'].invQuick;
    const invSlowMod = data['equippedModSummary'].invSlow;

    const fatigue = data.aux.fatigue.value + fatigueMod;
    const slots = data.slots;
    const totalAllowed = data.abilities["str"].total - fatigue;
    const quickSlotsAllowed = (totalAllowed <= 3 + invQuickMod) ? totalAllowed : 3 + invQuickMod;
    const regularAllowed = totalAllowed - quickSlotsAllowed + invSlowMod;

    const weighted = items.filter(item => item.data.hasOwnProperty("slots"));
    let quick = 0.0;
    let slow = 0.0;

    for (let item of weighted) {
      if (item.data.slots !== 0.0) {
        if (item.data.quickslot) {
          quick = quick + (item.data.quantity * item.data.slots);
        }
        else {
          slow = slow + (item.data.quantity * item.data.slots);
        }
      }
    }

    slots.slow.max = regularAllowed;
    slots.slow.value = slow
    slots.quick.max = quickSlotsAllowed;
    slots.quick.value = quick;
  }

  _prepareNpcData(actorData) {
    const data = actorData.data;

    data["allStats"] = { ...data.abilities, ...data.primaryStats, ...data.auxiliaryStats }
    for (let [a, abl] of Object.entries(data["allStats"])) {
      if (!abl.hasOwnProperty("total")) {
        abl.total = abl.value
      }
    };
  }

  // will either be "meleeAttack" or "rangeAttack"
  getAttackStats(type) {
    const atk = (type === "melee") ? "meleeAttack" : "rangeAttack";
    const data = this.data.data;
    const total = data.allStats[atk].total;
    const crits = (type === "melee") ? data.allStats["meleeCritRange"].value : data.allStats["rangeCritRange"].value
    const fumbles = (type === "melee") ? data.allStats["meleeFumbleRange"].value : data.allStats["rangeFumbleRange"].value
    const decay = data.allStats["rangeDecayMod"].total
    const distance = data.allStats["rangeDistanceMod"].total
    return {
      "total": total,
      "crits": crits,
      "fumbles": fumbles,
      "decay": decay,
      "distance": distance
    }
  }

  getDamageModifiers(type, bonusAtr) {
    const data = this.data.data;
    let global = 0
    // otherwise you are a spell.
    if (type === "melee" || type == "ranged" || type === "range") {
      const atk = (type === "melee") ? "meleeDamage" : "rangeDamage";
      global = data.allStats[atk].value;
    }
    const bonus = S.fromMaybe(0)(S.map(atr => data.allStats[atr].bonus)(bonusAtr));
    return {
      "global": global,
      "bonus": bonus,
      "attr": S.fromMaybe("")(bonusAtr)
    };
  }

  /**
 * Roll a generic ability test or saving throw.
 * Prompt the user for input on which variety of roll they want to do.
 * @param {String}abilityId     The ability id (e.g. "str")
 * @param {Object} options      Options which configure how ability tests or saving throws are rolled
 */
  rollAbility(abilityId) {
    const label = CONFIG.G.allStats[abilityId];
    new Dialog({
      title: `${label} Check`,
      content: `
      <form class="flexcol">
        <div class="form-group">
          <label for="situation">Situational Modifier</label>
          <input type="text" name="situation" placeholder="0">
        </div>
      </form>
      <p>What kind of ${label} check?</p>`,

      buttons: {
        test: {
          label: "Roll Under",
          callback: (html) => {
            let situationMod = html.find('input[name="situation"]').val();
            const mod = S.fromMaybe(0)(S.parseInt(10)(situationMod))
            this.rollAbilityTest(abilityId, mod);
          }
        },
        opposed: {
          label: "Opposed",
          callback: (html) => {
            let situationMod = html.find('input[name="situation"]').val();
            const mod = S.fromMaybe(0)(S.parseInt(10)(situationMod))
            this.getOpposedTargetValue(abilityId, mod);
          }
        }
      }
    }).render(true);
  }

  /**
 * Roll an Ability Test
 * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
 * @param {String} abilityId    The ability ID (e.g. "str")
 * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
 */
  rollAbilityTest(abilityId, situationMod) {
    const speaker = ChatMessage.getSpeaker({ actor: this });
    const params = roll.getAbilityTest(this.data.data, abilityId, situationMod, "ability");
    return GlogDice.sendAttackRoll({
      parts: params.parts,
      data: params.data,
      title: params.title,
      flavor: params.formula,
      speaker: speaker
    });

  }


  getOpposedTargetValue(abilityId, situationMod) {
    const label = CONFIG.G.allStats[abilityId];
    new Dialog({
      title: `Opposed ${label} Check`,
      content: `
        <form class="flexcol">
          <div class="form-group">
            <label for="target">Opponent Stat</label>
            <input type="text" name="target" placeholder="10">
          </div>
        </form>
        <p>What kind of ${label} check?</p>`,

      buttons: {
        cancel: {
          label: "Cancel",
          callback: (html) => {
            null;
          }
        },
        roll: {
          label: "Roll",
          callback: (html) => {
            let target = html.find('input[name="target"]').val();
            const effectiveTarget = S.fromMaybe(10)(S.parseInt(10)(target))
            this.rollOpposed(abilityId, situationMod, effectiveTarget);
          }
        }
      }
    }).render(true);
  }


  /**
  * Roll an opposed ability test
  * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
  * @param {String} abilityId    The ability ID (e.g. "str")
  * @param {Object} options      Options which configure how ability tests are rolled
  * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
  */
  rollOpposed(abilityId, situationMod, target) {
    const speaker = ChatMessage.getSpeaker({ actor: this });
    const params = roll.getOpposedAbilityTest(this.data.data, abilityId, situationMod, target)
    return GlogDice.sendAttackRoll({
      parts: params.parts,
      data: params.data,
      title: params.title,
      flavor: params.formula,
      speaker: speaker
    });
  }

  /** ITEM ROLLING */

  rollEquipment(item) {

    this.getModesDisplayDialogue(item);
  }

  getModesDisplayDialogue(item) {
    const modes = item.getDialogModes();
    if (modes.length >= 1) {
      const modeButtons = S.unchecked.map(mode => this.generateButtonsForModes(mode, item))(modes)
      const title = `Available Actions for ${item.name}`;
      const buttons = modeButtons.reduce((acc, elem) => {
        return mergeObject(acc, elem)
      }, {});

      new Dialog({
        title: title,
        content: "",
        buttons: buttons
      }).render(true);
    } else {
      console.log(`${item.name} has no actions`);
    }

  }
  generateButtonsForModes(mode, item) {
    if (mode.type === "attack") {
      return {
        attack: {
          "label": `${mode.subType} ${mode.type}`,
          callback: () => this.rollWeaponDialogue(item, mode.subType)
        }
      }
    } else if (mode.type === "effect") {
      if (mode.subtype === "effect") {
        return {
          damage: {
            label: "damage/effect",
            callback: () => this.rollDamage(item, false, mode.source)
          }
        }
      } else if (mode.subtype === "alternative") {
        return {
          alt: {
            label: "alt. damage",
            callback: () => this.rollDamage(item, true, mode.source)
          }
        }
      }
    }
  }

  /** ROLLING WEAPON ATTACK  ********************************************************* */

  rollWeaponDialogue(item, weaponType) {
    const data = item.data.data; 
    const proficient = (data.proficient) ? data.proficient : true;
    const config = {
      "weapon": {
        "weaponType": weaponType,
        "name": item.name,
        "weaponMod": item.getWeaponModifier(weaponType),
        "critMod": item.getWeaponCritModifier(weaponType),
        "fumbleMod": item.getWeaponFumbleModifier(weaponType),
        "rangeMod": item.getRangeModifiers(),
        "distance": item.getWeaponDistance(),
        "proficient": proficient
      },
      "dialogueContent": this.rollWeaponDialogueContent(weaponType),
      "dialogueParser": html => this.parseWeaponAttackDialogueContent(html)
    }
    this.rollAttackDialogue(config);
  }

  rollWeaponDialogueContent(weaponType) {
    if (weaponType === "melee") {
      return `
      <form class="flexcol">
        <div class="form-group">
         <label for="target">Opponent Def</label>
         <input type="text" name="target" placeholder="10">
        </div>
        <div class="form-group">
          <label for="situation">Hit modifier</label>
          <input type="text" name="situation" placeholder="0">
        </div>
      </form>`
    }
    if (weaponType == "range") {
      return `
      <div class="form-group">
       <label for="range">Range</label>
        <input type="text" name="range" placeholder="0">
      </div>
      <form class="flexcol">
      <div class="form-group">
       <label for="target">Opponent Def</label>
       <input type="text" name="target" placeholder="10">
      </div>
      <div class="form-group">
        <label for="situation">Hit or Dam modifier</label>
        <input type="text" name="situation" placeholder="0">
      </div>
    </form>`
    }
  }

  parseWeaponAttackDialogueContent(html) {
    const target = html.find('input[name="target"]').val();
    const situationMod = html.find('input[name="situation"]').val();
    const range = html.find('input[name="range"]').val() || "0";
    return {
      "situationMod": S.fromMaybe(0)(S.parseInt(10)(situationMod)),
      "target": S.fromMaybe(10)(S.parseInt(10)(target)),
      "range": S.fromMaybe(0)(S.parseInt(10)(range))
    }
  }


  rollAttackDialogue(config) {
    new Dialog({
      title: `Attacking with ${config.weapon.name}`,
      content: config.dialogueContent,
      buttons: {
        test: {
          label: "Attack",
          callback: (html) => {
            const attackStats = this.getAttackStats(config.weapon.weaponType);
            const parsedContent = config.dialogueParser(html);
            const params = weapon.getBasicWeaponAttack(attackStats, config.weapon, parsedContent);
            const speaker = ChatMessage.getSpeaker({ actor: this });
            return GlogDice.sendAttackRoll({
              parts: params.parts,
              data: params.data,
              title: params.title,
              flavor: params.formula,
              speaker: speaker
            });
          }
        }
      }
    }).render(true);
  }


  /** ROLLING DAMAGE  ********************************************************* */

  /** attackType can be "melee" or "ranged" */
  rollDamage(item, isAlternative, attackType) {
    const itemDamage = item.getWeaponDamageComponents(isAlternative);
    const dieModifiers = this.getDamageModifiers(attackType, itemDamage.bonusAtr);
    const usageFormulas = item.getUsageFormulas();
    const usageFormulasModes = display.usageFormulaModes(usageFormulas);
    const usage = {
      "formulas": usageFormulas,
      "mode": usageFormulasModes
    };

    // Figure out what kind of dice you need
    const needsDice = (itemDamage.formulas) ? ((itemDamage.formulas.type === "formula") ? true : false) : false;
    const content = this.rollWeaponDamageDialogueContent(needsDice);

    // screw this compatable formulas for now 
    // const compatableFormulas = roll.hasCompatableFormulas(itemDamage.formulas, usageFormulas);
    // const compatableFormulas = true;
    if (itemDamage.formulas) {
      // should make a usageForma -> extras thing 
      return new Dialog({
        title: `Applying ${itemDamage.name}`,
        content: content,
        buttons: {
          test: {
            label: "Damage/effect",
            callback: (html) => {
              const parsedContent = this.parseWeaponDamageDialogueContent(html);
              const params = weapon.applyDamage(itemDamage, dieModifiers, usage, parsedContent);
              const speaker = ChatMessage.getSpeaker({ actor: this });
              return GlogDice.sendAttackRoll({
                parts: params.parts,
                data: params.data,
                title: params.title,
                flavor: params.formula,
                speaker: speaker,
                nd: parsedContent.nd
              });
            }
          }
        }
      }).render(true);
    } else {
      // you are just for effect 
      console.log("Spell has no formula. Set to [effect] for misc roll.");
    }
  }


  rollWeaponDamageDialogueContent(needsND) {
    if (needsND) {
      return `
      <form class="flexcol">
      <div class="form-group">
      <label for="nd"># of [DICE]</label>
       <input type="text" name="nd" placeholder="1">
     </div>
      <div class="form-group">
        <label for="situation">Damage modifier</label>
        <input type="text" name="situation" placeholder="0">
      </div>
    </form>`
    } else {
      return `
      <form class="flexcol">
      <div class="form-group">
        <label for="situation">Damage modifier</label>
        <input type="text" name="situation" placeholder="0">
      </div>
    </form>`
    }
  }

  parseWeaponDamageDialogueContent(html) {
    const situationMod = html.find('input[name="situation"]').val();
    const nd = html.find('input[name="nd"]').val() || "1";
    return {
      "situationMod": S.fromMaybe(0)(S.parseInt(10)(situationMod)),
      "nd": S.fromMaybe(0)(S.parseInt(10)(nd))
    }
  }


  /** MISC BUTTONS  */

  async longRest(dialog=true, chat=true) {
    const data = this.data.data 
    let flavor = "" 
    let dhp = 0;
    let recoveredValue = 0;
    if (data.hp.value < 0) {
      dhp = 0 - data.hp.value 
      flavor = "<p>Lethal damage removed. Now at 0 HP.</p>";
      recoveredValue = 0;
    } else {
      dhp = data.hp.max - data.hp.value;
      recoveredValue = data.hp.max;
    };

    const updateData = {
      "data.hp.value": recoveredValue
    };

    await this.update(updateData);
    if ( chat ) {
      ChatMessage.create({
        user: game.user._id,
        speaker: {actor: this, alias: this.name},
        flavor: flavor,
        content: `${this.name} has a night's rest. Recovers ${dhp} hp. Consumes 1 ration.`
      })
    };
  }

  async shortRest() {
    const data = this.data.data
    const level = data.level

    const roll = new Roll(`1d6 + ${level}`).roll();
    const speaker = ChatMessage.getSpeaker({ actor: this });
    
    let prefix = "";
    let newHP = 0;
    if (data.hp.value < 0) {
      prefix = "<p>Lethal damage removed. Now at 0 HP.</p>";
    } else {
      prefix = `<p>Up to ${roll.total} HP has been restored.</p>`
      newHP = Math.min(data.hp.value + roll.total, data.hp.max);
    }

    const flavor = `${this.name} has a quick 1 hour lunch. Consumes 1 ration..` +
      prefix;
    const updateData = {
      "data.hp.value": newHP
    };
    await this.update(updateData);

    roll.toMessage({
      flavor: flavor,
      spaker: speaker
    });

  }
}
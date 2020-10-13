import { G } from "../config.js";
import BaseGlogSheet from "./base-sheet.js";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class GlogEnemySheet extends BaseGlogSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["glog", "sheet", "actor", "npc"],
            width: 600,
            height: 680
        });
    }

    /** @override */
    getData() {
        const data = super.getData();

        const rollAbleStats = new Set(CONFIG.G.rollableStats);
        for (let [s, stat] of Object.entries(data.data.primaryStats)) {
            stat.label = CONFIG.G.npcStats[s];
            if (rollAbleStats.has(s)) {
                stat.rollable = true;
            } else {
                stat.rollable = false;
            }
        }
        // Prepare owned items
        this._prepareItems(data);

        // TODO probably need to collect statMods from Actions and Spells 
        return data
    }

    _prepareItems(data) {
        const features = {
            weapons: { label: game.i18n.localize("Attacks"), items: [], hasActions: true, dataset: { type: "weapon", "weapon-type": "natural" } },
            actions: { label: game.i18n.localize("Actions"), items: [], hasActions: true, dataset: { type: "feat", "activation.type": "action" } },
            equipment: { label: game.i18n.localize("Inventory"), items: [], dataset: { type: "loot" } }
        };

        let [spells, other] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;
            item.hasUses = item.data.uses && (item.data.uses.max > 0);
            if (item.type === "spell") arr[0].push(item);
            else arr[1].push(item);
            return arr;
        }, [[], []]);

        // Organize Features
        for (let item of other) {
            if (item.type === "weapon") features.weapons.items.push(item);
            else if (item.type === "feat") {
                features.actions.items.push(item);
            }
            else features.equipment.items.push(item);
        }

        // organize spellbook
        const spellbook = {
            spells: { label: "Spells", items: [], hasActions: false, dataset: { type: "spell" } }
        };
        for (let s of spells) {
            s.order = G.spellOrder[s.data.type];
            s.levelLabel = G.spellLevels[s.data.level];
        }

        spells.sort((a, b) => a.order - b.order);

        spellbook.spells.items = spells;

        // Assign and return
        data.features = Object.values(features);
        data.spellbook = Object.values(spellbook);
    }

      /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
        super.activateListeners(html);
        html.find(".health .rollable").click(this._onRollHPFormula.bind(this));
        html.find(".hd .rollable").click(this._onPopulateFromHD.bind(this));
        html.find(".morale .rollable").click(this._rollMorale.bind(this));


      }

        /**
   * Handle rolling NPC health values using the provided formula
   * @param {Event} event     The original click event
   * @private
   */
  _onRollHPFormula(event) {
    event.preventDefault();
    const formula = this.actor.data.data.attributes.hp.formula;
    if ( !formula ) return;
    const hp = new Roll(formula).roll().total;
    AudioHelper.play({src: CONFIG.sounds.dice});
    this.actor.update({"data.hp.value": hp, "data.hp.max": hp});
  }

  _onPopulateFromHD(event) {   
    event.preventDefault();
    const hd = this.actor.data.data.details.cr.level; 
   
    const atkValue = this._attackFromHD(hd);
    const save = this._getSaveFromHD(hd);

    this.actor.update(
      {"data.primaryStats.meleeAttack.value": atkValue,
      "data.primaryStats.meleeAttack.total": atkValue,
      "data.primaryStats.rangeAttack.value": atkValue,
      "data.primaryStats.rangeAttack.total": atkValue,
      "data.primaryStats.save.value": save,
      "data.primaryStats.save.total": save,
      "data.primaryStats.def.value": 12,
      "data.primaryStats.def.value": 12
    }
    )
  }


  _attackFromHD(hd) {
      if (hd <= 0) {
          return 10
      }
      else if (hd <= 1) {
          return 10
      }
      else if (hd <= 2) {
        return 11
    }
      else if (hd <= 3) {
          return 12
      }
      else if (hd <= 5) {
          return 14
      }
      else if (hd <= 7) {
          return 15
      }
      else {
          return 10 + (hd -2)
      }
  }

  _getSaveFromHD(hd) {
      return 4 + Math.round(1.3333 * hd)
  }

  _rollMorale(event) {
    event.preventDefault();
    const morale = +this.actor.data.data.morale;
    const name = this.actor.name;

    const skip = morale === 2 || morale === 3;
    if (!skip) {

        return new Dialog({
            title: `Morale check for ${name}`,
            content: `
            <form class="flexcol">
            <div class="form-group">
              <label for="situation">Situation Modifier</label>
              <input type="text" name="situation" placeholder="0">
            </div>
          </form>`,
            buttons: {
              test: {
                label: "Morale check",
                callback: (html) => {
                  const situationMod = html.find('input[name="situation"]').val();
                  const mod = (situationMod) ? (+situationMod) : 0;
                  // this is an OVER so need to invert the result
                  // since you want a +2 to help, so that means take -2 off the result 
                  // because if you roll over morale you fail. 
                  const roll = new Roll(["2d6", (mod * -1)].join("+")).roll();
                  const speaker = ChatMessage.getSpeaker({ actor: this });
                  let flavor = ""
                  if (roll.total > morale) {
                      flavor = `${this.actor.name} fails it's morale check!`;
                  } else {
                      flavor = `${this.actor.name} passes it's morale check!`;
                  };
                  roll.toMessage({
                      flavor: flavor,
                      spaker: speaker
                    });
                }
              }
            }
          }).render(true);
    }
  }
    
}
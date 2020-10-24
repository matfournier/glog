import { G } from '../config.js';

export class GmTools {

  static async rollReactionForPlayer() {
    new Dialog({
      title: `Reaction Roll Check`,
      content: `
      <form class="flexcol">
        <div class="form-group">
          <label for="situation">Which Character</label>
          <input type="text" name="situation" placeholder="">
        </div>
      </form>
      `,
      buttons: {
        test: {
          label: "Roll Reaction",
          callback: (html) => {
            let name = html.find('input[name="situation"]').val();
            const actor = game.actors.find(a => a.data.name === name)
            if (actor) {
              const cha = actor.data.data.abilities.cha.bonus;
              this.rollReactionTable(cha)
            }
          }
        }
      }
    }).render(true);
  }

  static async rollReactionTable(chaModifier) {
    let tables = game.packs.get("glog.gm_tables");
    if (tables) {
      await tables.getIndex() // Load the compendium index
      const entry = tables.index.find((entity) => entity.name === "Reaction Roll");
      if (entry) {
        const table = await tables.getEntity(entry._id)
        const roll = new Roll(
          `2d6+${chaModifier}`
        )
        await table.draw({ roll, displayChat: true })
      }
    }
  }

  /**
   * 
   * @param recon "recon" or "candle" or "dark"
   */
  static async rollEncounterTable(recon) {
    let tables = game.packs.get("glog.gm_tables");
    if (tables) {
      await tables.getIndex() // Load the compendium index
      const entry = tables.index.find((entity) => entity.name === "Encounter Die");
      if (entry) {
        const table = await tables.getEntity(entry._id)
        const roll = new Roll(
          `1d6`
        )
        const result = await table.draw({ roll, displayChat: false });
        const resultText = `Encounter die: ${result.results[0].text}`;
        this._reconRoll(resultText, recon);
      }
    }
  }

  static async _reconRoll(er, recon) {
    const roll = new Roll("1d6").roll();
    const total = roll.total;
    const success = (total === 1) ? true : false;

    if (er.includes("Active Encounter") || er.includes("Passive Encounter")) {
      if (recon === "recon") {
        if (success) {
          roll.toMessage({
            flavor: `<h2> Encounter Roll - Recon Die </h2>` +
              `<p>${er} and success/advantage</p>`
          })
        } else {
          roll.toMessage({
            flavor: `<h2> Encounter Roll - Recon Die </h2>` +
              `<p>${er}</p>`
          })
        }
      } else if (recon === "candle") {
        if (success) {
          roll.toMessage({
            flavor: `<h2> Encounter Roll - Ambush Die </h2>` +
              `<p>${er} and failed/surprised></p>`
          })
        } else {
          roll.toMessage({
            flavor: `<h2> Encounter Roll - Recon Die </h2>` +
              `<p>${er}</p>`
          })
        }
      } else {
        if (total <= 2) {
          roll.toMessage({
            flavor: `<h2> Encounter Roll - Ambush Die </h2>` +
              `<p>${er} and failed/surprised</p>`
          })
        } else {
          roll.toMessage({
            flavor: `<h2> Encounter Roll - Recon Die </h2>` +
              `<p>${er}</p>`
          })
        }
      }
    } else {
      if (recon === "recon") {
        if (success) {
          roll.toMessage({
            flavor: `<h2> Encounter Roll - Recon Die </h2>` +
              `<p>${er} and signs</p>`
          })
        } else {
          roll.toMessage({
            flavor: `<h2> Encounter Roll</h2>` +
              `<p>${er}</p>`
          })
        }
      } else {
        roll.toMessage({
          flavor: `<h2> Encounter Roll</h2>` +
            `<p>${er}</p>`
        })
      }
    } 
  }
}



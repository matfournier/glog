import { spellFromDice, applyUsageText } from "./spell.js";

export class GlogDice {
  static async sendAttackRoll({
    parts = "",
    data = {},
    title = null,
    flavor = null,
    speaker = null,
    nd = null // magic dice
  } = {}) {


    let chatData = {
      user: game.user._id,
      speaker: speaker,
    };

    let templateData = {
      title: title,
      flavor: flavor,
      data: data
    };

    let roll = null;
    let template = "";
    if (data.type === "damage") {
      if (data.condition === "formula") {
        template = "systems/glog/templates/chat/roll-spell.html";
        roll = new Roll(`${nd}d6`, data).roll();
        templateData.result = GlogDice.applySpellDice(data, roll, parts);
      } else {
        template = "systems/glog/templates/chat/roll-damage.html";
        roll = new Roll(parts, data).roll();
        templateData.result = GlogDice.applyDiceDamage(data, roll);
      }

    } else {
      template = "systems/glog/templates/chat/roll-result.html";
      roll = new Roll(parts, data).roll();
      templateData.result = GlogDice.applySingleDice(data, roll);
    }

    // convert the roll to a chat message and return the roll

    // templateData.result = {
    //     isSuccess: false,
    //     isFailure: false,
    //     // target: 19,
    //     // total: -1,
    //     details: "<b>Attack fils!</b>"
    // };
    let x = 9;

    return new Promise((resolve) => {
      roll.render().then((r) => {
        templateData.rollGLOG = r;
        renderTemplate(template, templateData).then((content) => {
          chatData.content = content;
          // Dice So Nice
          if (game.dice3d) {
            game.dice3d
              .showForRoll(
                roll,
                game.user,
                true,
                chatData.whisper,
                chatData.blind
              )
              .then((displayed) => {
                ChatMessage.create(chatData);
                resolve(roll);
              });
          } else {
            chatData.sound = CONFIG.sounds.dice;
            ChatMessage.create(chatData);
            resolve(roll);
          }
        });
      });
    });
  }

  /** e.g. for an ability test, there is only 1d20 in play */
  static applySingleDice(data, roll) {
    let result = {
      isSuccess: false,
      isCriticalSuccess: false,
      isFailure: false,
      isCriticalFailure: false,
      total: roll.total,
      details: "",
      extra: []
    };

    let die = roll.terms[0].total;
    if (data.condition == "below") {
      if (data.crit.can) {
        if (die <= data.crit.on) {
          result.isCriticalSuccess = true,
            result.details = data.crit.text;
          return result
        }
      }
      if (data.fumble.can) {
        if (die >= data.fumble.on) {
          result.isCriticalFailure = true;
          result.details = data.fumble.text;
          return result
        }
      }
      if (roll.total <= data.target) {
        result.isSuccess = true;
        result.details = data.success;
      } else {
        result.isFailure = true;
        result.details = data.failure;
      }
    }
    return result;
  }

  static applyDiceDamage(data, roll) {
    let result = {
      "damage": (roll.total < 1) ? 1 : roll.total
    }
    return result;
  }


  static applySpellDice(data, roll, parts) {
    const res = spellFromDice(parts.formula, roll);
    const situationBonus = parts.parts.reduce((acc, e) => acc + e, 0);
    let bonusText = "";
    if (situationBonus !== 0) {
      if (situationBonus >= 1) {
        bonusText = `+ ${situationBonus} bonus`;
      } else {
        bonusText = `- ${situationBonus} bonus`;
      }
    };

    parts.parts.push(res.result);
    const effectiveUsage = applyUsageText(res, data.usage)
    const totalDamage = parts.parts.reduce((acc, e) => acc + e, 0);
    const moreExtras = [
      { "text": `rolls: ${res.rolls.join(" ")}` },
      { "text": `formula: (${res.formula}) ${bonusText}` },
      { "text": `diceToRemove: ${res.diceToRemove}` }
    ]
    if (data.usage) {
      moreExtras.unshift({"text": `usage: ${effectiveUsage}`});
    }
    if (res.complications.mishaps > 0) {
      moreExtras.push({ "text": `mishaps: ${res.complications.mishaps}` });
    };
    if (res.complications.doom) {
      moreExtras.push({ "text": `DOOM DOOM DOOM DOOM` });
    };

    if (res.complications.quadruple) {
      moreExtras.push({ "text": `QUADRUPLE!` });
    };

    return {
      "damage": totalDamage,
      "extra": data.extra.concat(moreExtras)
    };
  }

  static applyUsageText(spellRes, data) {

  }
}
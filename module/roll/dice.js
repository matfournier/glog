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

    let renderRoll = null;
    let template = "";
    if (data.type === "damage") {
      if (data.condition === "formula") {
        template = "systems/glog/templates/chat/roll-spell.html";
        let roll = new Roll(`${nd}d6`, data).roll();
        templateData.result = GlogDice.applySpellDice(data, roll, parts);
        renderRoll = roll;
      } else {
        template = "systems/glog/templates/chat/roll-damage.html";
        let rolls = [];
        rolls.push(new Roll(parts, data).roll())
        if (data.advantage != "none") {
          rolls.push(new Roll(parts, data).roll())
        }
        templateData.result = GlogDice.applyDiceDamage(data, rolls);
        renderRoll = GlogDice.getBestDamageDice(data, rolls);
      }
    } else {
      template = "systems/glog/templates/chat/roll-result.html";
      let rolls = [];
      rolls.push(new Roll(parts, data).roll())
      if (data.advantage != "none") {
        rolls.push(new Roll(parts, data).roll())
      }
      templateData.result = GlogDice.applySingleDice(data, rolls);
      renderRoll = GlogDice.getBestAttackDie(data, rolls);
    }

    return new Promise((resolve) => {
      // need to know which roll was the best.
      // this is a massive pain.
      renderRoll.render().then((r) => {
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
            resolve(renderRoll);
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
      total: null,
      details: "",
      extra: []
    };

    let die = 0;
    let total = 0;
    if (data.condition == "below") {
      const best = GlogDice.getBestAttackDie(data, roll);
      die = best.terms[0].total
      total = best.total
      data.extra.unshift({ "text": `unmodified rolls: ${roll.map(e => e.terms[0].total)}` });
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
      if (total <= data.target) {
        result.isSuccess = true;
        result.details = data.success;
      } else {
        result.isFailure = true;
        result.details = data.failure;
      }
    }
    result.total = total;
    return result;
  }

  static getBestAttackDie(data, roll) {
    if (data.condition === "below") {
      if (data.advantage === "none") {
        return roll[0]
      } else if (data.advantage === "advantage") {
        return (roll.reduce(function (prev, curr) {
          return prev.terms[0].total > curr.terms[0].total ? curr : prev
        }));
      } else {
        return (roll.reduce(function (prev, curr) {
          return prev.terms[0].total > curr.terms[0].total ? prev : curr
        }));
      }
    }
  }

  static applyDiceDamage(data, roll) {
    let moreExtras = { "text": data.usage };
    data.extra.unshift(moreExtras);
    data.extra.unshift({ "text": `unmodified rolls: ${roll.map(e => e.terms[0].total)}` });
    let die = GlogDice.getBestDamageDice(data, roll);
    let result = {
      "damage": (die.total < 1) ? 1 : die.total
    }
    return result;
  }

  static getBestDamageDice(data, roll) {
    if (data.advantage === "advantage") {
      return (roll.reduce(function (prev, curr) {
        return prev.terms[0].total > curr.terms[0].total ? prev : curr
      }));
    } else if (data.advantage === "disadvantage") {
      return (roll.reduce(function (prev, curr) {
        return prev.terms[0].total > curr.terms[0].total ? curr : prev
      }));
    }
    else {
      return roll[0];
    }
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
      moreExtras.unshift({ "text": `usage: ${effectiveUsage}` });
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
}
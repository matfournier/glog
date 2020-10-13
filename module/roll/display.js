import { G } from "../config.js";
import { S } from "../sanctuary.js";

export async function displayRoll(params, speaker) {
    const _roll = str => {
        let roll = new Roll(str);
        try {
            roll.roll();
        } catch (err) {
            console.error(err);
            ui.notifications.error(`Dice roll evaluation failed: ${err.message}`);
            return null;
        }
        return roll;
    }
    const messageData = {};
    const roll = _roll("1d20");
    messageData.speaker = speaker || ChatMessage.getSpeaker();
    messageData.flavor = params.flavour + params.diceF(roll);
    if (roll) roll.toMessage(messageData);
}

export function displayDamageRoll(params, speaker) {
    const _roll = str => {
        let roll = new Roll(str);
        try {
            roll.roll();
        } catch (err) {
            console.error(err);
            ui.notifications.error(`Dice roll evaluation failed: ${err.message}`);
            return null;
        }
        return roll;
    }
    const messageData = {};
    const roll = _roll(params.formula);
    messageData.speaker = speaker || ChatMessage.getSpeaker();
    messageData.flavor = params.flavour + params.diceF(roll);
    if (roll) roll.toMessage(messageData);
}

/** If any formula has a [dice]/[sum]/[best] etc component 
 *  need to render a dialogue to get how many to roll
 * returns true/false
 */
// export function usageHasMD(formulas) {
//     return S.unchecked.any(formula => formula.data.type === "formula")(formulas)
// };

export function usageFormulaModes(usageFormulas) {
    const arr = S.unchecked.map(f => f.data.type)(usageFormulas);
    const check = arr.reduce((acc, elem) => {
        if (elem.type === "formula") acc.formula = true;
        if (elem.type === "dice") acc.dice = true;
        return acc;
    }, {
        "formula": false,
        "dice": false
    });
    return check;
}

const meleeAttack = {
    "type": "attack",
    "subType": "melee",
    "source": ""
};

const rangeAttack = {
    "type": "attack",
    "subType": "range",
    "source": ""
};

const effect = source => {
    const res =  {
        "type": "effect",
        "subtype": "effect",
        "source": source
    };
    return res 
}

const alternativeDamage = source =>  {
    const res= {
        "type": "effect",
        "subtype": "alternative",
        "source": source
    };
    return res;
};

export const actionTypes = {
    melee: meleeAttack,
    range: rangeAttack,
    effect: effect,
    alt: alternativeDamage
    };




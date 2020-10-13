import { G } from "../config.js";
import { S } from "../sanctuary.js";
import * as roll from "./roll.js";
import * as spell from "./spell.js";

/**
 * 
 * @param {*} html html from dialogue
 * @param {*} data actor data
 * @param {*} item the item being used in the attack 
 * @param {*} config {
 *    "situationMod": string // any situation modifiers 
 *    "target": string // the target value from DM e.g. 14
 *    "mode": string // melee or range 
 *    "range": string // the range to target, 0 if melee
 *   }
 */

export function getBasicWeaponAttack(attackStats, weapon, input) {
    const parsedTarget = input.target;

    const appliedSituationMod = roll.maybeSituationModifier(input.situationMod);
    const appliedWeaponMod = weapon.weaponMod;
    const penalties = attackPenalty(attackStats, weapon, input);

    const targetMod = S.fromMaybe(0)(S.map(v => v.value)(appliedSituationMod)) +
        S.fromMaybe(0)(S.map(v => v.value)(appliedWeaponMod)) +
        S.fromMaybe(0)(penalties.penalty)

    const proficientMod = (weapon.proficient) ? 0 : -4;
    const effectiveTarget = attackStats.total + (10 - parsedTarget) + targetMod + proficientMod;
    const critRange = (effectiveTarget <= 0) ? 1 : Math.min(effectiveTarget, (attackStats.crits.value + weapon.critMod));

    const flavour = [];
    flavour.push({ text: `${weapon.name} at ${attackStats.total} against ${parsedTarget}` });
    flavour.push({ text: `formula: ${attackStats.total} + (10 - ${parsedTarget}) | roll <= ${effectiveTarget}` });

    // extras 
    const ext1 = S.unchecked.fromMaybe([])(S.map(v => [{ text: v.text }])(appliedSituationMod));
    const ext2 = S.unchecked.fromMaybe([])(S.map(v => [{ text: v.text }])(appliedWeaponMod));
    const ext3 = S.unchecked.fromMaybe([])(S.map(v => [{ text: v }])(penalties.text));
    const extras = S.join([ext1, ext2, ext3]);
    (weapon.proficient) ? "" : extras.push({ text: "Not proficient: -4" });

    const result = {
        title: getAttackTitle(attackStats, weapon, input),
        formula: flavour,
        parts: "1d20",
        data: {
            "target": effectiveTarget,
            "type": "attack",
            "condition": "below",
            "success": "ATTACK SUCCEEDS",
            "failure": "ATTACK FAILS",
            "crit": {
                "can": true,
                "on": critRange,
                "text": "CRITICAL HIT!"
            },
            "fumble": {
                "can": true,
                "on": 20,
                "text": "FUMBLE!"
            },
            "extra": extras
        }
    };
    return result;
}

function getAttackTitle(attackStats, weapon, input) {
    if (weapon.weaponType === "melee") {
        return `${weapon.weaponType} attack`
    } else {
        return `${weapon.weaponType} attack at D: ${input.range}`;
    }
}

function attackPenalty(attackStats, weapon, input) {
    if (weapon.weaponType === "melee") {
        return meleeAttackPenalty(attackStats)
    } else {
        return rangedAttackPenalty(
            attackStats,
            weapon.rangeMod,
            weapon.distance,
            input.range
        )
    }
}

function meleeAttackPenalty(attackStats) {
    return {
        "text": S.Nothing,
        "penalty": S.Nothing
    }
}

function rangedAttackPenalty(attackStats, rangeModifiers, weaponDistance, targetDistance) {
    const localDecayModifier = rangeModifiers.decay
    const localRangeDistanceMod = rangeModifiers.distance

    const decayModifier = attackStats.decay + localDecayModifier;
    const rangeDistanceMod = attackStats.distance + localRangeDistanceMod;

    const effectiveDistance = weaponDistance + rangeDistanceMod;

    // range of 30, target 20 away, 10. No peanlity 
    // range of 30, target 50 away, -20 distanceDiff, -2 penalty 
    const distanceDiff = effectiveDistance - targetDistance
    const penalty = 10 * decayModifier;
    const rangePenalty = (distanceDiff >= 0) ? 0 : Math.floor(Math.abs(distanceDiff) / penalty);

    return {
        "text": (rangePenalty !== 0) ? S.Just(`Applied Range penalty: ${-rangePenalty}`) : S.Nothing,
        "penalty": (rangePenalty !== 0) ? S.Just(-rangePenalty) : S.Nothing
    }
}

/** Damage / Effects */

export function applyEffects(itemDamage, dieMods, usage, input) {
    // if (itemDamage.formulas.length >= 1) {
    //    return applyDamage(itemDamage, dieMods, usage, input);
    // } else {
    //     if (usage.length >= 1) {
    //        return  applyJustEffects(itemDamage, usage, input);
    //     } else {
    //         return S.Nothing;
    //     }
    // }
    if (itemDamage.formulas.type === "dice") {
        return applyDamage(itemDamage, dieMods, usage, input)
    } else {
        console.log("TODO");
    }
}

// what about getting the parts from `usage` into the flavour? 
// will need a usageComponent or something. 
// need to handle itemDamage.damageMod 

export function applyDamage(itemDamage, dieMods, usage, input) {
    const dieModParts = dieModsParts(dieMods);
    const situationModParts = simpleParts(input.situationMod, "Situation modifier");
    const itemDamageModParts = simpleParts(itemDamage.damageMod, "Local damage modifier");
    const parts = S.join([dieModParts, situationModParts, itemDamageModParts]);
    const rollParts = S.unchecked.map(p => p.value)(parts);
    const extras = parts.map(v => {
        const res = { "text": v.text }
        return res
    });


    if (itemDamage.formulas.type === "dice") {
        const result = {
            title: getTitle(itemDamage),
            formula: getDamageType(itemDamage),
            parts: [itemDamage.formulas.formula].concat(rollParts).join("+"),
            data: {
                "target": null,
                "type": "damage",
                "condition": "dice",
                "success": null,
                "failure": null,
                "crit": null,
                "fumble": null,
                "extra": extras.concat(simpleUsageDetails(usage.formulas))
            }
        }
        return result;
    }
    else if (itemDamage.formulas.type === "flat") {
        const intFormula = +itemDamage.formulas.formula
        rollParts.push(intFormula)
        const damage = rollParts.reduce((acc, p) => acc + p);
        const result = {
            title: getTitle(itemDamage),
            formula: getDamageType(itemDamage),
            parts: `${damage}`,
            data: {
                "target": null,
                "type": "damage",
                "condition": "flat",
                "success": null,
                "failure": null,
                "crit": null,
                "fumble": null,
                "extra": extras.concat(simpleUsageDetails(usage.formulas))
            }
        }
        return result;
    } else {
        // we have a spell formula to parse. 
        const result = {
            title: getTitle(itemDamage),
            formula: getDamageType(itemDamage),
            parts: {
                "formula": itemDamage.formulas.formula,
                "parts": rollParts
            },
            data: {
                "target": null,
                "type": "damage",
                "condition": "formula",
                "success": null,
                "failure": null,
                "crit": null,
                "fumble": null,
                "extra": extras.concat(simpleUsageDetails(usage.formulas))
            }
        }
        return result;
    }
}

export function simpleUsageDetails(usage) {
   return usage.reduce((acc, use) => {
        if(use.type === "range") {
            acc.push({"text": `range: ${use.data.formula} ${use.data.unit}`});
        }
        if(use.type === "duration") {
            acc.push({"text": `duration: ${use.data.formula} ${use.data.unit}`});
        }
        if(use.type === "template") {
            acc.push({"text": `template: ${use.data.formula} ${use.data.unit} ${use.data.targetType}`});
        }
        return acc;
    }, [])
}

function getTitle(itemDamage) {
    let title = "";
    if (itemDamage.sourceItemType === "weapon") {
        title = `${itemDamage.name} damage` 
    } else if (itemDamage.sourceItemType === "spell") {
        title = `Casting ${itemDamage.name}`
    } else {
        title = `Applying ${itemDamage.name}` 
    }
    return title;
}

function getDamageType(itemDamage) {
    const res = []
    if (itemDamage.damageType) {
      res.push({"text": `(${itemDamage.damageType}) damage`});
    };
    return res;
}


// const nd = input.nd;
// if (damageFormula.hasMD) {
//     const effectiveFormula =
//         damageFormula.formula + dieModParts + situationModParts + itemDamageModParts;
//     const flavour = `<p>Hits with ${itemDamage.name} for </p>`
//     const formula = `${nd}$6`
//     const rollResultFunction = (dice) => {
//         const res = spells.fromDice(dice);
//         console.log(res)
//     }
//     return {
//         "type": "formula",
//         "flavour": "flavour",
//         "formula": "formula",
//         "diceF": rollResultFunction,
//     }

// } else if (damageFormula.hasDice) {
//     const effectiveDamage =
//         damageFormula.formula + dieModParts + situationModParts + itemDamageModParts;
//     const flavour = `<p>Hits with ${itemDamage.name} for </p>`
//     const rollResultFunction = (dice) => {
//         const total = dice.total;
//         return `<h2>${total} damage</h2>`
//     }
//     return {
//         "type": "dice",
//         "flavour": flavour,
//         "formula": effectiveDamage,
//         "diceF": rollResultFunction
//     }
// } else {
//     // apply flat damage. 
//     const formulaPart = itemDamage.formulas.reduce((acc, formula) => {
//         return acc + (+formula.formula)
//     }, 0)
//     const damage = formulaPart + dieMods.global + dieMods.bonus + input.situationMod + itemDamage.damageMod
//     const flavour = `<p>Hits with ${itemDamage.name} for <h4>${damage} damage</h4></p>`;
//     return {
//         "type": "flat",
//         "flavour": flavour
//     }
// }


/** get diceMode */
// function generateDamageFormula(formulas) {
//     return (formulas.reduce((acc, formula) => {
//         if (formula.type === "formula") {
//             acc.hasMD = true;
//         } else if (formula.type === "dice") {
//             acc.hasDice = true;
//         }
//         if (acc.formula) {
//             acc.formula = acc.formula + ` + ${formula.formula}`
//         } else {
//             acc.formula = `${formula.formula}`
//         }
//         return acc;
//     }, {
//         "hasMD": false,
//         "hasDice": false,
//         "formula": []
//     })
//     )
// }

function dieModsParts(dieMods) {
    const res = [];
    if (dieMods.global !== 0) {
        res.push({
            "value": dieMods.global,
            "text": `Global modifier: ${dieMods.global}`
        });
    }
    if (dieMods.bonus !== 0) {
        res.push({
            "value": dieMods.bonus,
            "text": `${dieMods.attr} bonus: ${dieMods.bonus}`
        });
    }
    return res;

}

function simpleParts(mod, prefix) {
    let res = [];
    if (mod !== 0) {
        res.push({
            "value": mod,
            "text": `${prefix}: ${mod}`
        });
    }
    return res;
}


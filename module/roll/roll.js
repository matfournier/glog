import { S } from "../sanctuary.js";
import { G } from '../config.js';
import * as weapon from "./weapon.js";


/**
 * 
 * {
 *   "ability": string,
 *   "mode": {
 *     "type": "under" // or opposed or melee or ranged 
 *     ""  
 * }
 * }
 * 
 */
export function rollTypeFactory(data, ability, mode) {
    switch (mode.type) {
        case 'ability':
            return rollAbilityConfig(data, ability);
        case 'opposed':
            return rollAbilityConfig(data, ability);
        case 'melee':
            return weapon.rollMeleeAtkConfig(data);
        case 'ranged':
            return weapon.rollRangedAtkConfig(data, mode.weaponDistance, mode.targetDistance, mode.item);
    }

}


export function maybeSituationModifier(situationMod) {
    const maybeMod = (situationMod === 0) ? S.Nothing : S.Just({
        "value": situationMod,
        "text": (situationMod < 0) ? "disadvantage" : "advantage"
    })

    return S.map(mod => {
        const res = {
            "value": mod.value,
            "text": `Applied ${mod.text} of ${mod.value}`
        }
        return res
    })(maybeMod);
}

export function rollAbilityConfig(data, ability) {
    const total = data.allStats[ability].total;
    const label = G.allStats[ability];
    const crits = S.Nothing;

    return {
        "total": total,
        "label": label,
        "crits": crits // Maybe[int]
    }
}

export function getAbilityTest(data, ability, situationMod) {
    const config = rollTypeFactory(data, ability, { "type": "ability" });
    const target = config.total;
    const appliedSituationMod = maybeSituationModifier(situationMod);
    const targetMod = S.fromMaybe(0)(S.map(v => v.value)(appliedSituationMod));
    const effectiveTarget = target + targetMod;
    const extras = S.unchecked.fromMaybe([])(S.map(v => {
        const res = [{text: v.text}];
        return res})(appliedSituationMod));

    const roll = {
        title: `Ability Test: ${config.label}`,
        formula: [{text: `${config.label} ${config.total} | roll <= ${effectiveTarget}`}],
        parts: "1d20",
        data: {
            "target": effectiveTarget,
            "type": "ability",
            "condition": "below",
            "success": "SUCCESS",
            "failure": "FAILED",
            "crit": {
                "can": false,
                "on": 1,
                "text": "critical!"
            },
            "fumble": {
                "can": false,
                "on": 20,
                "text": "fumble!"
            },
            "extra": extras
        }
    };
    return roll;
}

export function getOpposedAbilityTest(data, ability, situationMod, target) {
    const config = rollTypeFactory(data, ability, { "type": "opposed" });
    const abilityScore = config.total;
    const appliedSituationMod = maybeSituationModifier(situationMod);
    const targetMod = S.fromMaybe(0)(S.map(v => v.value)(appliedSituationMod))

    const effectiveTarget = abilityScore + (10 - target) + targetMod;

    const flavour = []
    flavour.push({text:`${config.label} test at ${abilityScore} against ${target}`});
    flavour.push({text:`formula: ${abilityScore} + (10 - ${target}) | roll <= ${effectiveTarget}`});

    const extras = S.unchecked.fromMaybe([])(S.map(v => {
        const res = [{text: v.text}];
        return res})(appliedSituationMod));

    const roll = {
        title: `Opposed Ability: ${config.label}`,
        formula: flavour,
        parts: "1d20",
        data: {
            "target": effectiveTarget,
            "type": "opposed",
            "condition": "below",
            "success": "SUCCESS",
            "failure": "FAILED",
            "crit": {
                "can": false,
                "on": 1,
                "text": "critical!"
            },
            "fumble": {
                "can": false,
                "on": 20,
                "text": "fumble!"
            },
            "extra": extras
        }
    };
    return roll;
}

export function isDiceRoll(str) {
    let re = /^[\d+]?d\d+[\+|\-]?\d*$/;
    return re.test(str)
}

export function isFormula(str) {
    return (str.includes("[dice]") || str.includes("[sum]") || str.includes("[highest]") ||
        str.includes("[best]") || str.includes("[lowest]") || str.includes("[worst]")) ||
        str.includes("[effect]");
}

export function getFormulaType(str, unit) {
    if (isDiceRoll(str)) {
        return {
            "type": "dice",
            "formula": str,
            "unit": unit
        }
    } else if (isFormula(str)) {
        return {
            "type": "formula",
            "formula": str,
            "unit": unit
        }
    } else {
        if (S.isJust(S.parseInt(10)(str))) {
            return {
                "type": "flat",
                "formula": str,
                "unit": unit
            };
        } else {
            return {
                "type": "dice",
                "formula": str,
                "unit": unit
            };
        }
    }
}

/**
 * can mix and match 1d6 + flat, e.g. 1d6 and 10 
 * can mix and match [dice] and flat,  [sum] with a duration of 10 
 * cannot mix and match 1d6 terms with [dice] terms 
 * @param {} damageFormulas 
 * @param {*} usageFormulas 
 */
// export function hasCompatableFormulas(damageFormulas, usageFormulas) {
//     const dam = S.unchecked.map(f => f.type)(damageFormulas);
//     const usage = S.unchecked.map(f => f.data.type)(usageFormulas);
//     const arr = dam.concat(usage);
//     const check = arr.reduce((acc, elem) => {
//         if (elem.type === "formula") acc.formula = true;
//         if (elem.type === "dice") acc.dice = true;
//         return acc;
//     }, {
//         "formula": false,
//         "dice": false
//     });
//     return !(check.formula && check.dice)
// }
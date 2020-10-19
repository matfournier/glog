import { G } from "../config.js";
import { rollAbilityConfig } from "../roll/roll.js";

export function calculateAttributes(data, items, equippedModSummary) {
    determineDerivedStats(data, items, equippedModSummary);
}

function determineDerivedStats(data, items, eqModMap) {
    const abilities = data.abilities;
    const level = data.level;
    const uconfig = data.uconfig;
    const primaryStats = data.primaryStats
    const aux = data.aux;
    const stats = data.stats;

    const armour = items.filter(item => item.type === "equipment" &&
        G.armourKeys.includes(item.data.type));
    const sthMvArmourPenalty = determineSthMvPenality(armour);

    // TODO consider Math.floor? maybe a config option? 
    const encumbrancePenality = Math.round(determineEncumbrancePenalty(data.slots, eqModMap['er']));

    // use the summarized effects as the baseline for the values
    // this is needed for rolling and other things but is in a shit place codewise

    initStatsFromModifiers(stats, eqModMap);

    //specific overrides for primary stats based on many rats on a stick
    calculatePrimaryStats(
        primaryStats,
        uconfig,
        level,
        armour,
        abilities,
        eqModMap,
        encumbrancePenality,
        sthMvArmourPenalty
    );

    // calculate movement 

    if (encumbrancePenality <= -10) {
        aux["movement"].value = "crawl";
    } else if (encumbrancePenality <= -6) {
        aux["movement"].value = "slow";
    } else {
        aux["movement"].value = primaryStats["mv"].value + 20;
    };

    if (encumbrancePenality <= -10) {
        aux["run"].value = "NA";
    } else if (encumbrancePenality <= -6) {
        aux["run"].value = "slow";
    } else {
        aux["run"].value = primaryStats["mv"].value + 50;
    };

    // doctoring 
    stats["doc"].value = Math.floor(eqModMap["doc"] + abilities["int"].value / 2);
}

/** Initialize stats from the eqModMap 
 *  however, some of them are 0 and can't be 
 *  so we overwrite those to be 1 instead if they are less than 1.
 */
function initStatsFromModifiers(stats, eqModMap) {
    Object.keys(stats).forEach(function (key, index) {
        stats[key].value = eqModMap[key]
    });

    const fixProp = p => {
        if (stats[p].value >= 1) {
            stats[p].value = stats[p].value + 1
        };
        if (stats[p].value < 1) {
            stats[p].value = 1;
        };
    };
    const propsOfOne = ["meleeCritRange", "rangeCritRange", "rangeDecayMod"];
    for (let p of propsOfOne) {
        fixProp(p);
    };
}

function calculatePrimaryStats(
    primaryStats,
    uconfig,
    level,
    armour,
    abilities,
    eqModMap,
    encumbrancePenality,
    sthMvArmourPenalty,
) {

    const calcTotal = stat => {
        return primaryStats[stat].total = primaryStats[stat].value + primaryStats[stat].mod;
    }

    const getEquippedModifier = stat => {
        return primaryStats[stat].mod = eqModMap[stat];
    }
    // Attack values
    // Note: weapon specific values that modify this are handled during 
    // rolling
    // this only includes the "globally applied" values 
    if (!uconfig.attack) {
        const baseAttackValue = determineAttackFromLevel(level);
        primaryStats["meleeAttack"].value = baseAttackValue;
        primaryStats["rangeAttack"].value = baseAttackValue;
    }
    primaryStats["meleeAttack"].mod = eqModMap["meleeAttack"];
    primaryStats["rangeAttack"].mod = eqModMap["rangeAttack"];
    calcTotal("meleeAttack");
    calcTotal("rangeAttack");

    // DEF

    if (!uconfig.def) {
        const lowerBoundDef = 10

        primaryStats["def"].value = 10; (lowerBoundDef <= 1) ? 1 : lowerBoundDef;
    };

    const defMod = encumbrancePenality + Math.max(
        abilities["dex"].bonus,
        determinedDefenseFromArmour(armour)) +
        eqModMap["def"];

    primaryStats["def"].mod = defMod;

    const lowerBoundtotal = primaryStats["def"].value + primaryStats["def"].mod;

    (lowerBoundtotal <= 0) ? primaryStats["def"].total = 1 : primaryStats["def"].total = lowerBoundtotal;

    // MV 
    if (!uconfig.mv) {
        primaryStats["mv"].value = 12 + encumbrancePenality + abilities["dex"].bonus
            + sthMvArmourPenalty;
    };
    getEquippedModifier("mv");
    calcTotal("mv");

    // STEALTH

    if (!uconfig.sth) {
        const lowerBoundStealth = 5 + abilities["dex"].bonus + encumbrancePenality
            + sthMvArmourPenalty
        primaryStats["sth"].value = (lowerBoundStealth <= 1) ? 1 : lowerBoundStealth;
    };
    getEquippedModifier("sth");
    calcTotal("sth");

    // SAVE

    if (!uconfig.save) {
        primaryStats["save"].value = getLevelSaveBonus(level) +
            abilities["cha"].bonus
    };
    getEquippedModifier("save");
    calcTotal("save");

}


const determinedDefenseFromArmour = armour => {
    return armour.reduce(function (acc, elem) {
        return acc + ((elem.data.equipped) ? G.armourDefs[elem.data.type] : 0)
    }, 0)
}

const determineSthMvPenality = (armour) => {
    return armour.reduce(function (acc, elem) {
        if (elem.data.equipped) {
            if (G.armourPenalities.hasOwnProperty[elem.data.type]) {
                return Math.min(acc, G.armourPenalities[elem.data.type]);
            } else {
                return acc;
            }
        } else {
            return acc;
        }
    }, 0)
}

export const getLevelSaveBonus = level => {
    if (level <= 0) {
        return 5;
    }
    else if (level <= 1) {
        return 6;
    }
    else if (level <= 4) {
        return 7;
    }
    else if (level <= 7) {
        return 8;
    }
    else if (level <= 9) {
        return 9;
    }
    else {
        return 10;
    }
}

const determineAttackFromLevel = level => {
    if (level <= 0) {
        return 10;
    }
    else if (level <= 1) {
        return 11;
    }
    else if (level <= 3) {
        return 12;
    }
    else if (level <= 5) {
        return 13;
    }
    else if (level <= 7) {
        return 14;
    }
    else {
        return 15;
    }
}

function tolerate(num, acceptableTolerance) {
    var nearestRoundNumber = Math.round(num);
    var difference = Math.abs(nearestRoundNumber - num);
    if (difference <= acceptableTolerance) {
        num = nearestRoundNumber;
    }

    return num;
}
const determineEncumbrancePenalty = (slots, penalty) => {
    const totalAllowed = slots.slow.max + slots.quick.max;
    const used = slots.quick.value + slots.slow.value;
    const delta = tolerate((totalAllowed - used), 0.01) + penalty;
    return (delta <= 0) ? delta : 0
}


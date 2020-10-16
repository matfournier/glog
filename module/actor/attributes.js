import { G } from "../config.js";

export function calculateAttributes(data, items, equippedModSummary) {
    determineDerivedStats(data, items, equippedModSummary);
}

function determineDerivedStats(data, items, eqModMap) {
    const abilities = data.abilities;
    const level = data.level;
    const stats = data.stats;

    const armour = items.filter(item => item.type === "equipment" &&
         G.armourKeys.includes(item.data.type));
    const sthMvArmourPenalty = determineSthMvPenality(armour);
    
    // TODO consider Math.floor? maybe a config option? 
    const encumbrancePenality = Math.round(determineEncumbrancePenalty(data.slots, eqModMap['er']));

    // use the summarized effects as the baseline for the values
    initStatsFromModifiers(stats, eqModMap);

    //specific overrides for primary stats based on many rats on a stick
    const primaryStats = data.primaryStats;
    calculatePrimaryStats(
        primaryStats,
        stats,
        level,
        armour,
        abilities,
        eqModMap,
        encumbrancePenality,
        sthMvArmourPenalty
    );
}

/** Initialize stats from the eqModMap 
 *  however, some of them are 0 and can't be 
 *  so we overwrite those to be 1 instead if they are less than 1.
 */
function initStatsFromModifiers(stats, eqModMap) {
    Object.keys(stats).forEach(function(key,index) {
        stats[key].value = eqModMap[key]
    });

    const fixProp = p => {
        if (stats[p].value < 1) {
            stats[p].value = 1;
        }
    };
    const propsOfOne = ["meleeCritRange", "rangeCritRange", "rangeDecayMod"];
    for (let p of propsOfOne) {
        fixProp(p);
    };
}

function calculatePrimaryStats(
    primaryStats,
    stats,
    level, 
    armour,
    abilities,
    eqModMap,
    encumbrancePenality,
    sthMvArmourPenalty,
    ) {

   
    // Attack values
    // Note: weapon specific values that modify this are handled during 
    // rolling
    // this only includes the "globally applied" values 
    
    const baseAttackValue = determineAttackFromLevel(level)
    stats["meleeAttack"].value = baseAttackValue +
        eqModMap["meleeAttack"];
    stats["rangeAttack"].value = baseAttackValue +
        eqModMap["rangeAttack"];

    // DEF
    // const lowerBoundDef = 10 + encumbrancePenality + Math.max(
    //     abilities["dex"].bonus,
    //     determinedDefenseFromArmour(armour)
    // ) + eqModMap["def"];
    // primaryStats["def"].value = (lowerBoundDef <= 1) ? 1 : lowerBoundDef;

    // // MV Rating
    // stats["mv"].value = 12 + encumbrancePenality + abilities["dex"].bonus
    //    + sthMvArmourPenalty + eqModMap["mv"];

    // MOVEMENT
    // if (encumbrancePenality <= -10) {
    //     primaryStats["movement"].value = "crawl";
    // } else if (encumbrancePenality <= -6) {
    //     primaryStats["movement"].value = "slow";
    // } else {
    //     primaryStats["movement"].value = stats["mv"].value + 20; 
    // }

    // if (encumbrancePenality <= -10) {
    //     primaryStats["run"].value = "NA";
    // } else if (encumbrancePenality <= -6) {
    //     primaryStats["run"].value = "slow";
    // } else {
    //     primaryStats["run"].value = stats["mv"].value + 50; 
    // }

    // STEALTH
    // const lowerBoundStealth = 5 + abilities["dex"].bonus + encumbrancePenality
    //     + sthMvArmourPenalty + eqModMap["sth"];

    // stats["sth"].value = (lowerBoundStealth <= 1) ? 1 : lowerBoundStealth;

    // // SAVE
    // primaryStats["save"].value = getLevelSaveBonus(level) +
    //     abilities["cha"].bonus + eqModMap["save"];

    // // DOC
    // stats["doc"].value = Math.floor(stats["doc"].value + abilities["int"].value / 2);

}

const determinedDefenseFromArmour = armour => {
  return armour.reduce(function(acc, elem) {
    return acc + ((elem.data.equipped) ? G.armourDefs[elem.data.type] : 0)
  }, 0)
}

const determineSthMvPenality = (armour) => {
    return armour.reduce(function(acc, elem) {
        if (elem.data.equipped) {
            return Math.min(acc, G.armourPenalities[elem.data.type])
        } else {
            return acc
        }
    }, 0)
}

const getLevelSaveBonus = level => {
    if (level <= 0) {
        return 5
    }
    else if (level <= 1) {
        return 6
    }
    else if (level <= 4) {
        return 7
    }
    else if (level <= 7) {
        return 8
    }
    else if (level <= 9) {
        return 9
    }
    else {
        return 10
    }
}

const determineAttackFromLevel = level => {
    if (level <= 0) {
        return 10
    }
    else if (level <= 1) {
        return 11
    }
    else if (level <= 3) {
        return 12
    }
    else if (level <= 5) {
        return 13
    }
    else if (level <= 7) {
        return 14
    }
    else {
        return 15
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


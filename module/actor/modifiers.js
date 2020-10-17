/**
 * Buckets the mods into one place 
 * auto - auto applied mods from weapons/spells/etc. that are equipped + applied
 * manual - mods that need manual tracking from weapons/spells/etc
 * autoEffects - auto applied mods from ad-hoc mods added to the Effects tab 
 * manualEffects - manual mods from ad-hoc mods added to the Effects tab 
 * 
 * discards:
 *  mods that are not equipped
 *  mods that are equipped but not applied (e.g. temporary effects)
 *  mods that don't do anything (0 values)
 *  mods that are equipped and applied but local to the weapon only
 *         ^- these are handled during weapon/equipment rolls.
 */

export function collectStatMods(items, G) {

    const mods = {
        manualEffects: { label: "Manual Effects", mods: [], dataset: { type: "effect" }, isEffect: true, renderDetails: false },
        autoEffects: { label: "Auto Applied Effects", mods: [], dataset: { type: "effect" }, isEffect: true, renderDetails: true, isNested: true },
        auto: { label: "Auto Applied Eq/Class/Spell Effects", mods: [], dataset: { type: "auto" }, isAppliedEffect: true, renderDetails: true },
        manual: { label: "Manual Eq/Class/Spell Effects", mods: [], dataset: { type: "manual" }, isAppliedEffect: true, renderDetails: false }
    };

    for (const item of items) {
        if (item.type === "effect") {
            if (item.data.mod.type === "auto") {
                mods.autoEffects.mods.push(item);
            } else {
                mods.manualEffects.mods.push(item);
            };
        } else if (item.data.hasOwnProperty("statMods")) {
            if (item.data.equipped && item.data.statMods.applied) {
                for (let mod of item.data.statMods.parts) {
                    if (mod[1] === "auto") {
                        if (+mod[2] !== 0 && mod[4] === "globally") {
                            mods.auto.mods.push({
                                "stat": mod[0],
                                "type": mod[1],
                                "value": +mod[2], // need to coerce to int
                                "source": mod[3],
                                "equipped": true,
                                "label": G.modifiers[mod[0]]
                            });
                        }
                    }
                    else {
                        mods.manual.mods.push({
                            "stat": "",
                            "type": mod[1],
                            "value": "", // need to coerce to int
                            "source": mod[3],
                            "equipped": true,
                            "label": ""
                        });
                    }
                }
            }
        }
    }
    return mods
}

// Returns of map of all the variables that can be modified with each key
// summarize by the +/- of all the automods 
// takes in [auto.mods, autoEffects.mod] returns Map {mod => sum}
export function summarizeMods(autoMods, modsMap) {
    const deepCopy = JSON.parse(JSON.stringify(modsMap)) //.map(elem => 0)
    let stats = Object.fromEntries(
        Object.entries(deepCopy).map(([key, value]) => [key, 0])
    );

    for (let m of autoMods[0]) {
        stats[m.stat] = stats[m.stat] + m.value;
    };
    for (let m of autoMods[1]) {
        if (m.data.equipped) {
            stats[m.data.mod.stat] = stats[m.data.mod.stat] + m.data.mod.value;
        };
    };
    return stats;

}

/*********************************************************************/
/** using ManyRatsOnAStick, determine bonuses from stats
 *  then apply auto mods 
 */
export function applyBaseAbilityModifiers(abilities, modsMap) {
    for (let [key, ability] of Object.entries(abilities)) {
        ability.mod = modsMap[key];
        ability.total = ability.value + ability.mod;
        if(!ability.override) { // if the user has used TWEAKS to avoid calculating bonuses
            ability.bonus = determineAbilityBonus(ability.total);
        }
    }
}

/**
 * Calculate the ability bonus from the total attribute
 * e.g. Str of 16 with a Ring of Strength +2 is a str of 18 
 * so an ability bonus of 3
 */
const determineAbilityBonus = i => {
    if (i <= 2) {
        return -3
    }
    else if (i <= 5) {
        return -2
    }
    else if (i <= 8) {
        return -1
    }
    else if (i <= 11) {
        return 0
    }
    else if (i <= 14) {
        return 1
    }
    else if (i <= 17) {
        return 2
    }
    else if (i <= 20) {
        return 3
    }
    else if (i <= 23) {
        return 4
    }
    else {
        return 5
    }
}

/*********************************************************************/

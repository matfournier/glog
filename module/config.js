export const G = {}

G.LOGO = ""; // TODO

G.spellTypes = {
    "cantrip": "Cantrip",
    "brain": "Brain",
    "spellbook": "Spellbook",
    "scroll": "Scroll",
    "alternate": "Alternate"
};

G.skillOrRace = {
    "skill": "Skill",
    "race": "Race"
};

G.spellOrder = {
    "cantrip": 1,
    "brain": 2,
    "spellbook": 3
};

G.spellLevels = {
    "oneSix": "1-6",
    "oneEight": "1-8",
    "oneTen": "1-10",
    "chosen": "Chosen"
};

G.diceOps = {
    "plus": "+",
    "times": "x"
};

G.diceTypes = {
    "none": "none",
    "diceSum": "Sum [dice]",
    "diceNum": "[dice]"
};

G.classLevels = {
    "A": "A",
    "B": "B",
    "C": "C",
    "D": "D"
};

G.abilities = {
    "str": "Strength",
    "dex": "Dexterity",
    "con": "Constituition",
    "int": "Intelligence",
    "wis": "Wisdom",
    "cha": "Charisma"
};

G.abilityAbbreviations = {
    "str": "Str",
    "dex": "Dex",
    "con": "Con",
    "int": "Int",
    "wis": "Wis",
    "cha": "Cha"
};

G.stats = {
    "def": "Defense",
    "meleeAttack": "Melee Attack Value",
    "rangeAttack": "Range Attack Value",
    "mv": "Move Rating",
    "sth": "Stealth",
    "save": "Save",
    "invQuick": "Quick Slot Modifier",
    "invSlow": "Slow Slot Modifier",
    "initMod": "Iniative Modifier",
    "doc": "Doctoring Skill",
    "meleeCritRange": "Melee Crit Range",
    "rangeCritRange": "Range Crit Range",
    "meleeFumbleRange": "Melee Fumble Range",
    "rangeFumbleRange": "Range Fumble Range",
    "meleeDamage": "Melee Damage Modifier",
    "rangeDamage": "Range Damage Modifier",
    "rangeDistanceMod": "Range Distance Modifier",
    "rangeDecayMod": "Range Decay Modifier",
    "er": "Encumbrance Modifier",
    "fatigueMod": "Fatigue Modifier",
};

G.configStats = {
    "str" : "Str",
    "dex": "Dex",
    "con": "Con",
    "int": "Int",
    "wis": "Wis",
    "cha": "Cha",
    "def": "Def",
    "mv": "Move Rating",
    "sth": "Stealth",
    "save": "Save",
    "attack": "Attack Ratings",
    "bslots": "Slots"
};

G.npcStats = {
    "def": "Defense",
    "meleeAttack": "Melee",
    "rangeAttack": "Range",
    "mv": "MV",
    "sth": "Stealth",
    "save": "Save",
    "invQuick": "Quick Slot Modifier",
    "invSlow": "Slow Slot Modifier",
    "initMod": "Iniative Modifier",
    "doc": "Doctoring Skill",
    "meleeCritRange": "Melee Crit Range",
    "rangeCritRange": "Range Crit Range",
    "meleeFumbleRange": "Melee Fumble Range",
    "rangeFumbleRange": "Range Fumble Range",
    "meleeDamage": "Melee Damage Modifier",
    "rangeDamage": "Range Damage Modifier",
    "rangeDistanceMod": "Range Distance Modifier",
    "rangeDecayMod": "Range Decay Modifier",
    "er": "Encumbrance Modifier",
    "fatigueMod": "Fatigue Modifier",
}

G.allStats = {...G.abilities, ...G.stats};
G.modifiers = {...G.abilities, ...{
    "def": "Defense",
    "mv": "Move Rating",
    "sth": "Stealth",
    "save": "Save",
    "invQuick": "Quick Slot Modifier",
    "invSlow": "Slow Slot Modifier",
    "initMod": "Iniative Modifier",
    "doc": "Doctoring Skill",
    "meleeCritRange": "Melee Crit Range",
    "rangeCritRange": "Range Crit Range",
    "meleeFumbleRange": "Melee Fumble Range",
    "rangeFumbleRange": "Range Fumble Range",
    "meleeAttack": "Melee Attack Modifier",
    "meleeDamage": "Melee Damage Modifier",
    "rangeAttack": "Range Attack Modifier",
    "rangeDamage": "Range Damage Modifier",
    "rangeDistanceMod": "Range Distance Modifier",
    "rangeDecayMod": "Range Decay Modifier",
    "er": "Encumbrance Modifier",
    "fatigueMod": "Fatigue Modifier",
}}

G.aux = {
    "fatigue": "Fatigue"
};

G.shortPrimaryStats = {
    "def": "Defense",
    "meleeAttack": "Melee Attack",
    "rangeAttack": "Range Attack",
    "mv": "Move Rating",
    "sth": "Stealth",
    "save": "Save Score",
}


G.statBonusTypes = {
    "weapon": "Just this item's roll",
    "globally": "All rolls"
};

G.rollableStats = ["doc"];

// Creature Sizes
G.actorSizes = {
    "tiny": "Tiny",
    "sm": "Small",
    "med": "Normal",
    "lg": "Large",
    "huge": "Huge",
    "grg": "Gargantuan"
};


G.distanceUnits = {
    "self": "Self",
    "touch": "Touch",
    "ft": "Ft",
    "mi": "Mi",
    "other": "Other"
};

G.languages = {
    "common": "Common",
    "goblin": "Goblin",
    "elven": "Elven",
    "dwarf": "Dwarf"
};

// Damage Types
G.damageTypes = {
    "acid": "Acid",
    "bludgeoning": "Blugeoning",
    "cold": "Cold",
    "fire": "Fire",
    "force": "Force",
    "lightning": "Lightning",
    "necrotic": "Necrotic",
    "piercing": "Piercing",
    "poison": "Poison",
    "psychic": "Psychic",
    "radiant": "Radiant",
    "slashing": "Slashing",
    "magic": "Magic",
    "alien": "Alien"
};

// Damage Resistance Types
G.damageResistanceTypes = mergeObject(duplicate(G.damageTypes), {
    "physical": "Physical"
});

/**
 * This Object defines the types of single or area targets which can be applied
 * @type {Object}
 */
G.targetTypes = {
    "self": "Self",
    "creature": "Creature",
    "space": "Obj/Space",
    "radius": "Radius",
    "line": "Line",
    "cone": "Cone",
    "square": "Square",
};



/**
 * Map the subset of target types which produce a template area of effect
 * The keys are target types and the values are MeasuredTemplate shape types
 * @type {Object}
 */
G.areaTargetTypes = {
    cone: "cone",
    line: "ray",
    radius: "circle",
    square: "rect"
};

G.conditionTypes = {
    "blinded": "Blinded",
    "charmed": "Charmed",
    "deafened": "Deafened",
    "diseased": "Diseased",
    "exhaustion": "Exhaustion",
    "frightened": "Frightened",
    "grappled": "Grappled",
    "incapacitated": "Incapacitated",
    "invisible": "Invisible",
    "paralyzed": "Paralyzed",
    "petrified": "Petrified",
    "poisoned": "Poisoned",
    "prone": "Prone",
    "restrained": "Restrained",
    "stunned": "Stunned",
    "unconscious": "Unconscious"
};

G.monsterTags = {
    "neutral": "Neutral",
    "indifferent": "Indifferent",
    "hostile": "Hostile",
    "savage": "Savage",
    "dumb": "Dumb",
    "int": "Intelligent",
    "cunning": "Cunning",
    "hungry": "Hungry",
    "barb": "Barbaric",
    "civ": "Civilized",
    "fant": "Fanatical",
    "biped": "Biped",
    "creature": "Creature",
    "summoned": "Summoned",
    "elemental": "Elemental",
    "undead": "Undead",
    "insect": "Insect",
    "guard": "Guardian",
    "flying": "Flying",
    "swimming": "Swimming",
    "infra": "Infravision"
}

/**
 * Define the set of types which a weapon item can take
 * @type {Object}
 */
G.weaponTypes = {
    "melee": "Melee",
    "ranged": "Ranged"
};

/**
* Define the set of weapon property flags which can exist on a weapon
* @type {Object}
*/
G.weaponProperties = {
    "lgt": "Light",
    "med": "Medium",
    "hvy": "Heavy",
    "two": "Two-handed",
    "handhalf": "Hand a half",
    "lr": "Long range",
    "mech": "Mechanical",
    "def": "Defensive",
    "dev": "Devastating",
    "pole": "Pole weapon",
    "throw": "Throwing",
    "amm": "Ammunition",
};

/**
* This Object defines the various lengths of time which can occur
* @type {Object}
*/
G.timePeriods = {
    "inst": "Instant",
    "turn": "Turn",
    "round": "Round",
    "minute": "Minute",
    "hour": "Hour",
    "day": "Day",
    "month": "Month",
    "year": "Year",
    "perm": "Permanent",
    "spec": "Special"
};

/**
* This describes the ways that an ability can be activated
* @type {Object}
*/
G.abilityActivationTypes = {
    "action": "Action"
};

G.abilityConsumptionTypes = {
    "ammo": "Ammunition",
    "material": "Material",
    "other": "Other"
};

/**
 * The set of equipment types for armor, clothing, and other objects which can ber worn by the character
 * @type {Object}
 */
G.equipmentTypes = {
    "none": "None",
    "leather": "Leather (+2 def)",
    "chain": "Chain (+4 def, -2 mv/sth)",
    "plate": "Plate (+6 def, -4 mv/sth)",
    "shield": "Shield",
    "clothing": "Clothing",
    "trinket": "Trinket"
};

G.armourDefs = {
    "leather": 2,
    "chain": 4,
    "plate": 6,
    "shield": 1
};

G.armourPenalities = {
    "light": 0,
    "chain": -2,
    "plate": -4
};

G.armourKeys = Object.keys(G.armourDefs);

/**
 * Enumerate the valid consumable types which are recognized by the system
 * @type {Object}
 */
G.consumableTypes = {
    "light": "Light",
    "food": "Food",
    "ammo": "Ammunition",
    "potion": "Potion",
    "poison": "Poison",
    "scroll": "Scroll",
    "wand": "Wand",
    "other": "other"
};

/**
* Enumerate the lengths of time over which an item can have limited use ability
* @type {Object}
*/
G.limitedUsePeriods = {
    "charges": "Charges",
    "round": "Round",
    "fight": "Fight",
    "turn": "Turn",
    "day": "Day"
};

/**
* Classification types for item action types
* @type {Object}
*/
G.itemActionTypes = {
    "aaak": "Attack",
    "formula": "dice/spell",
    "other": "Other"
};

G.miscActionTypes = {
    "melee": "Melee Attack",
    "ranged": "Range Attack",
    "formula": "Formula/spell/effect"
};

G.secondaryActionTypes = {
    "melee": "Melee Attack",
    "ranged": "Range Attack"
};

G.weaponActionTypes = {};

G.spellActionTypes = {
    "melee": "Melee Attack",
    "ranged": "Range Attack"

}

G.statModTypes = {
    "auto": "auto",
    "manual": "manual"
};

G.icons = {
    "class": {
        icon: "systems/glog/ui/icons/class.svg"
    },
    "race": {
        icon: "systems/glog/ui/icons/race.svg"
    },
    "skill": {
        icon: "systems/glog/ui/icons/skill.svg"
    },
    "consumable": {
        icon: "systems/glog/ui/icons/torch.svg"
    },
    "weapon": {
        icon: "systems/glog/ui/icons/weapon/sword.svg"
    },
    "spell": {
        icon: "systems/glog/ui/icons/spell.svg"
    },
    "loot": {
        icon: "systems/glog/ui/icons/loot.svg"
    },
    "equipment": {
        icon: "systems/glog/ui/icons/equipment/leather.svg"
    }
};

G.encounter = {
    "recon": "Have Light/Torch/Lantern",
    "candle": "Candle only",
    "dark": "Darkness"
};
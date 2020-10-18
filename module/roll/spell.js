import { S } from "../sanctuary.js";

/**
 * This is laughably overcomplicated and I need to redo this. 
 * @param {*} numDice 
 * @param {*} diceLimit max number of dice to accept  
 * @param {*} formula [sum] + [dice] or whatever
 * @param {*} burnF [int] => int, to burn dice or not
 * @param {*} complicationF [int] => Maybe[{complications}]

/** assumes MD is not above 5! 
 * 
 * - TODO need to make a map [term] -> value applied for dice
 * - so you can go and get the [sum] / etc. parts for duration / etc.
 */
export const spellFromDice = (formula, dice) => {
    const rolls = S.map(r => r.result)(dice.terms[0].results);
    const terms = getTermsMap(rolls)
    const formulaResult = getSpellResult(runDiceFormula(formula, rolls, terms));
    return {
        "formula": formula,
        "rolls": rolls,                      // string
        "result": formulaResult,                  // null or value use 
        "diceToRemove": spellBurn(rolls),           // int 
        "complications": spellComplications(rolls),   // Maybe complications 
        "terms": getTermsMap(rolls)
    };
}

/**
 * loooool need to redo this into something that isn't a shitshow
 * 
 * @param  formula  e.g. "2 + [sum] - [dice]"
 *   understands numbers, [sum], [dice], [highest] (or [best]), 
 *               [lowest] (or [worst])
 *   parses from left to right, does not understand brackets or order of operations.
 *   white space is significant e.g. 2+[sum] is invalid 
 *     while 2 + [sum] is valid
 * 
 * returns Maybe {
 *   value: int 
 *   status: Maybe(formula)
 * }
 * if None, something went wrong
 * if value is null something went wrong 
 * if status is maybe, something went wrong (e.g. formula is 2 + ) with a trailing op 
 *  
 * @param {*} dice the rolled dice values, if you rolled 3dice then it could be 
 *                 [1,1,4] or [6, 2, 4] or whatever
 */
const runDiceFormula = (formula, dice, termsMap) => {
    return S.unchecked.reduce(acc => part => {
        return S.unchecked.chain(result => {
            return S.unchecked.chain(component => {
                if (S.isJust(result.status)) {
                    const op = S.unchecked.fromMaybe(null)(result.status) // we know it exists
                    if (component.isOP) {
                        return S.Nothing
                    } else {
                        const applied = component.f(dice);
                        return S.Just({
                            "value": op(applied),
                            "status": S.Nothing,
                            "start": false
                        })
                    }
                } else {                       // you are outside an op 
                    if (!component.isOP && result.start) {
                        const applied = component.f(dice);
                        return S.Just({
                            "value": applied,
                            "status": S.Nothing,
                            "start": false
                        })
                    } else if (component.isOP && !result.start) {
                        return S.Just({
                            "value": null,
                            "status": S.Just(component.f(result.value)),
                            "start": false
                        })
                    } else {
                        return S.Nothing
                    }
                }
            })(getComponent(part, termsMap))
        })(acc)
    }
    )(S.Just({
        "value": 0,
        "status": S.Nothing,
        "start": true
    }))(S.splitOn(" ")(formula))
}

// Str -> Maybe {"isOP": true, "f" thing}
function getComponent(str, termMap) {
    if (str === "+") {
        return S.Just({
            "isOP": true,
            "f": a => b => a + b
        })
    } else if (str === "-") {
        return S.Just({
            "isOP": true,
            "f": a => b => a - b
        })
    } else if (str === "*") {
        return S.Just({
            "isOP": true,
            "f": a => b => a * b
        })
    }
    else if (str === "[sum]") {
        return S.Just({
            "isOP": false,
            "f": dice => termMap[str]
        })
    } else if (str === "[dice]") {
        return S.Just({
            "isOP": false,
            "f": dice => termMap[str]
        })
    } else if (str === "[best]" || str === "[highest]") {
        return S.Just({
            "isOP": false,
            "f": dice => termMap[str]
        })
    } else if (str === "[worst]" || str === "[lowest]") {
        return S.Just({
            "isOP": false,
            "f": dice => termMap[str]
        })
    } else if (str === "[effect]") {
        return S.Just({
            "isOP": false,
            "f": dice => termMap[str]
        })
    } else {
        return (S.map(num => {
            const res = {
                "isOP": false,
                "f": dice => num
            }
            return res;
        })(S.parseInt(10)(str))
        )
    }
}

function getTermsMap(roll) {
    const best = Math.max(...roll);
    const worst = Math.min(...roll);
    return {
        "[sum]": S.sum(roll),
        "[dice]": roll.length,
        "[best]": best,
        "[highest]": best,
        "[worst]": worst,
        "[lowest]": worst,
        "[effect]": 0
    };
}


/** parses a spell result into a value or 0 if stuff went wrong */
const getSpellResult = res => {
    const maybeResult = S.chain(r => S.isJust(r.status) ? S.Nothing : S.Just(r.value))(res);
    return S.unchecked.fromMaybe(null)(maybeResult);
}


const spellBurn = rolls => (S.filter(S.gte(4))(rolls)).length
const noBurn = rolls => 0;

const spellComplications = rolls => {
    const counts = rolls.reduce((acc, val) => acc.set(val, 1 + (acc.get(val) || 0)), new Map());
    let isDoom = false;
    let isQuadruple = false;
    var doubles = 0;
    for (let value of counts.values()) {
        if (value >= 3) isDoom = true;
        if (value >= 4) isQuadruple = true;
        if (value % 2 == 0) {
            doubles = doubles + Math.floor(value / 2);
        }
    }
    return ({
        "doom": isDoom,
        "mishaps": (isDoom) ? 0 : doubles,
        "quadruple": isQuadruple
    })
}

const noSpellComplications = rolls => S.Nothing

export const applyUsageText = (spellRes, text) => {
    const termMap = spellRes.terms;
    const sub = subText(termMap, text);
    return sub;
};

const subText = (termMap, text) => {
    if (text) {
        return Object.keys(termMap).reduce((acc, term) => {
            acc = acc.replace(term, termMap[term]);
            return acc;
        }, text);
    } else {
        return ""
    }
};


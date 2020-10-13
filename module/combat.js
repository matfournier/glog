/**
 * Override the default Initiative formula to customize special behaviors of the system.
 * Apply advantage, proficiency, or bonuses where appropriate
 * Apply the dexterity score as a decimal tiebreaker if requested
 * See Combat._getInitiativeFormula for more detail.
 */
export const _getInitiativeFormula = function(combatant) {
  // going to need to invert this 
  // as it wants a roll over 

  // normally you want to roll under wisdom

  // not sure how to incorporate this.
  // this will be hard: Some particularly quick enemies might impose a penalty on
  // PCs’ Wisdom, or act twice in each round.

  // for players 
  // 1d20ms<=8

  const actor = combatant.actor;
  if ( !actor ) return "1d20";
  const init = actor.data.data.attributes.init;

  const parts = [];
  if (actor.data.type === "character") {
      const wis  = actor.data.data.allStats.wis.total
      const mv = actor.data.data.allStats.mv.total; // for tiebreaker
      const dex = actor.data.data.allStats.dex.total; // for tiebreak
      parts.push(`1d20ms<=${wis}`);
      parts.push(mv/200);
      parts.push(dex/200);
  } else {
    
     // TODO add something here for iniative override for going before players?
     parts.push("-0.13");
     const atk = actor.data.data.allStats.meleeAttack.total;
     parts.push(atk/250) // tie breaker
     parts.push (getRandomInt(1,50)/500) // tie breaker
    }

  const res = parts.join(" + ");

  return res;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}
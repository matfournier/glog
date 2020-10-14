# The GLOG for FoundryVTT 

**THIS IS STILL IN HEAVY DEVELOPMENT STAGES** 

All the features you need to play The Goblin Laws of Gaming in Foundry VTT.

Trying to implement [GLOG](https://madqueenscourt.blogspot.com/2020/07/glog-for-gretchlings-or-notes-towards.html) is like to nail water to a board as it's 
very nature is unconstrained. It's less a ruleset, more like a movement. This 
[FoundryVTT](https://foundryvtt.com/) system puts a line in the sand so people 
can play remotely with friends.

The rulesets target the a basis of most content: [The Glog - Many Rats on a Stick](https://coinsandscrolls.blogspot.com/2019/10/osr-glog-based-homebrew-v2-many-rats-on.html) version released
by [Skerples](https://www.drivethrurpg.com/browse/pub/12623/Skerples).

## License

The implementation (this repository) is licensed under GPL 3.  Primarily based 
on the mechaics of the [Glog Hack by Skerples](https://coinsandscrolls.blogspot.com/2019/10/osr-glog-based-homebrew-v2-many-rats-on.html) which is licensed under
[CC-BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)

## Goals

1. To make Many Rats on a Stick playable in FoundryVTT 
2. To automate the finicky parts (iniative rolling is in and easy!)
3. To not be too automated ... so we keep flexibility for glog hacks
4. To be reasonably flexible to allow class/spell/equipment hacks

Parts 1 and 2 are well underway.  Parts 3 and 4 are in progress (see Features TODO), such as 
changing from the opposed roll system to a roll over + target system as a configuration seting. 
A reasonable goal I'm setting is being able to play both Many Rats on a Stick OR [Arnold K's Lair of the Lamb](http://goblinpunch.blogspot.com/2020/04/lair-of-lamb-final.html) merely by changing some flags 
and a few items.  

If your system deviates too far from either of these this codebase may not work for you. Such is the nature of the GLOG and you can always fork this repository and make the code changes you need for your system. 

### To automate the finicky parts ... but not too much 

The sheet and code exist to automate work for the GM and players. A full usage/tutorial 
can be found in the guide section below.

- Character stat bonuses and derived stats (save, atk, etc.) are calculated 
- Equipment/Spells/Weapons/etc are tracked 
- Stats can be modified by nearly everything and are automatically tracked
- Manual effects can also be tracked for things too complicated to be automatically tracked 
- Slot usage is calculated and tracked (the little shield equipped icon puts it in your quick slot)
- Lunch/Rest implemented as well as removing fatal wounds (negative HP) 
- Weapons/Spells/etc are rollable and provide dialogs to quickly roll what you need 
- **A vastly simpler NPC sheet is present for the GM** to fill in as much or as little as required 
    - An option exists to 1-click and provide reasonable defaults for important parameters based on HD that the GM can use as a starting point when making monsters on the fly 
- A spell damage language exists so you can input sell damage as `[sum] + [best]` for instance 
    - burned dice, doubles, triples, quadruples are also calculated for you 

The inputs can be rather abstract (see the guide), particular around effects, damage input, and rolling.  Nearly everything is rollable so you flexible input many things.  Please see the guide 
and (eventually all the classes/skills from Many Rats on a Stick which is in the compendium that 
comes with the system). 

**However nothing in your sheet affects another sheet**.  No damage is automatically removed, not 
even from your own sheet. A dialog may tell you how many dice were burned in a spell but it is up 
to you to remove those dice. This does not automate the system for you, but it does aim to automate
the bean counting. 

### Currency

Currency isn't set in the game. Pick what you want. Maybe your system runs on silver. The price field is a `String` so you could make a Loot item called Gold and set it's price to be 100 sp or whatever.  Put
your slot-weight per coin however you want. 

## Featues TODO (Develop Branch) 

- Turn off automatic calculation of derived stats and bonuses on a stat and character by character basis
    - this is required even for Many Rats on a Stick e.g. how the Sorceror works with regards to Saves.
    - this will let people put in alternative stat ceilings, bonus curves, and more flexible characters 
    at the expense of (locally) lost automation
    - *IN PROGRESS*
- Write a guide.  The sheets are actually kind of complicated at first glance but they are surprisingly functional.  I can enter a class from GLOG in <2 minutes for the most part. 
- Implement config options to change between Many Rats on a Stick-style rolling and Lair of the Lamb-style rolling 
- Link spells to their mishap/doom tables so they can be rolled on from the character sheet 
    - FoundryVTT doesn't really have a good way to make these discoverable in a character sheet 
    - Have some ideas, Tables may need to become an item 
- Content content content
    - Need to implement all the content from Many Rats on a Stick:
        - items, weapons, 

## Guide 

TODO 



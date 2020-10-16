import TraitSelector from "../apps/trait-selector.js";
import { G } from "../config.js";

export default class BaseGlogSheet extends ActorSheet {

    constructor(...args) {
        super(...args);
    }

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            scrollY: [
                ".inventory .inventory-list",
                ".features .inventory-list",
                ".spellbook .inventory-list",
                ".efects .inventory-list"
            ],
            tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    /** @override */
    get template() {
        return `systems/glog/templates/actor/${this.actor.data.type}-sheet.html`;
    }

    /** @override */
    getData() {
        const data = super.getData();
        data.dtypes = ["String", "Number", "Boolean"];
        data['config'] = CONFIG.G

        // Ability Scores
        for (let [a, abl] of Object.entries(data.actor.data.abilities)) {
            abl.label = CONFIG.G.abilities[a];
        }

        this._prepareTraits(data.actor.data.traits);
        return data;
    }

    /* -------------------------------------------- */

    _prepareTraits(traits) {
        const map = {
            "dr": CONFIG.G.damageResistanceTypes,
            "di": CONFIG.G.damageResistanceTypes,
            "dv": CONFIG.G.damageResistanceTypes,
            "ci": CONFIG.G.conditionTypes,
            "languages": CONFIG.G.languages,
            "mt": CONFIG.G.monsterTags
        };

        for (let [t, choices] of Object.entries(map)) {
            const trait = traits[t];
            if (!trait) continue;
            let values = [];
            if (trait.value) {
                values = trait.value instanceof Array ? trait.value : [trait.value];
            }
            trait.selected = values.reduce((obj, t) => {
                obj[t] = choices[t];
                return obj;
            }, {});

            // Add custom entry
            if (trait.custom) {
                trait.custom.split(";").forEach((c, i) => trait.selected[`custom${i + 1}`] = c.trim());
            }
            trait.cssClass = !isObjectEmpty(trait.selected) ? "" : "inactive";
        }
    }

    /**
     * First pass of separating out various item types, as this is used often 
     */
    _collectItems(data) {

        const inventory = {
            weapon: { label: "Weapon", items: [], dataset: { type: "weapon" } },
            equipment: { label: "Equipment", items: [], dataset: { type: "equipment" } },
            consumable: { label: "Consumable", items: [], dataset: { type: "consumable" } },
            loot: { label: "Loot", items: [], dataset: { type: "loot" }, isLoot: true }
        };

        let [items, spells, feats, archetypes] = data.items.reduce((arr, item) => {

            // Item details
            item.img = item.img || DEFAULT_TOKEN;
            item.hasUses = item.data.uses && (item.data.uses.max > 0);

            // Item toggle state
            this._prepareItemToggleState(item);

            // enrich the item name
            if (item.type === "loot") {
                const suffix = (item.data.cost) ? `[${item.data.cost}]` : ""
                item.richName = `${item.name} ${suffix}`;
            }

            // Classify items into types
            if (item.type === "spell") arr[1].push(item);
            else if (item.type === "feat") arr[2].push(item);
            else if (item.type === "archetype") arr[3].push(item);
            else if (Object.keys(inventory).includes(item.type)) arr[0].push(item);
            return arr;
        }, [[], [], [], []]);

        return {
            "items": items,
            "spells": spells,
            "feats": feats,
            "archetypes": archetypes
        };
    }

    /**
    * A helper method to establish the displayed preparation state for an item
    * @param {Item} item
    * @private
    */
    _prepareItemToggleState(item) {
        const isActive = getProperty(item.data, "equipped");
        item.toggleClass = isActive ? "active" : "";
        item.toggleTitle = isActive ? "Equipped" : "Unequipped";
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if (this.isEditable) {
            // Item summaries
            html.find('.item .item-name h4').click(event => this._onItemSummary(event));

            // Trait Selector
            html.find('.trait-selector').click(this._onTraitSelector.bind(this));

            // Item State Toggling
            html.find('.item-toggle').click(this._onToggleItem.bind(this));

            // Add Inventory Item
            html.find('.item-create').click(this._onItemCreate.bind(this));
            html.find('.item-edit').click(this._onItemEdit.bind(this));
            html.find('.item-delete').click(this._onItemDelete.bind(this));
        }

        // if (this.actor.owner) {

        // Ability Checks
        html.find('.ability-name').click(this._onRollAbilityTest.bind(this));


        // Roll Skill Checks
        // this is unfortunately named due to css naming, should fix this.
        html.find('.skill-name').click(this._onRollOtherAbilityCheck.bind(this));

        // def/save 

        html.find('.defsave').click(this._onRollDefSaveTest.bind(this));

        // Item Rolling
        html.find('.item .item-image').click(event => this._onItemRoll(event));
        // html.find('.item .item-recharge').click(event => this._onItemRecharge(event));

        // Rollable abilities.
        // html.find('.rollable').click(this._onRoll.bind(this));
        // }
    }

    /* -------------------------------------------- */

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    _onItemSummary(event) {
        event.preventDefault();
        let li = $(event.currentTarget).parents(".item"),
            item = this.actor.getOwnedItem(li.data("item-id"))
        // chatData = item.getChatData({secrets: this.actor.owner});

        // Toggle summary
        if (li.hasClass("expanded")) {
            let summary = li.children(".item-summary");
            summary.slideUp(200, () => summary.remove());
        } else {
            // TODO make a shortener?
            let div = $(`<div class="item-summary">See item descrption</div>`);
            if (item) {
                div = $(`<div class="item-summary">${item.data.data.description.value}</div>`);
            }
            let props = $(`<div class="item-properties"></div>`);
            //   chatData.properties.forEach(p => props.append(`<span class="tag">${p}</span>`));
            div.append(props);
            li.append(div.hide());
            div.slideDown(200);
        }
        li.toggleClass("expanded");
    }

    /**
     * Handle toggling the state of an Owned Item within the Actor
     * @param {Event} event   The triggering click event
     * @private
     */
    _onToggleItem(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".item").dataset.itemId;
        const item = this.actor.getOwnedItem(itemId);
        const attr = "data.equipped";
        return item.update({ [attr]: !getProperty(item.data, attr) });
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const itemData = {
            name: `New ${type.capitalize()}`,
            type: type,
            data: duplicate(header.dataset)
        };
        delete itemData.data["type"];
        return this.actor.createOwnedItem(itemData);
    }

    /**
    * Handle deleting an existing Owned Item for the Actor
    * @param {Event} event   The originating click event
    * @private
    */
    _onItemDelete(event) {
        event.preventDefault();
        const li = event.currentTarget.closest(".item");
        this.actor.deleteOwnedItem(li.dataset.itemId);
    }

    /**
    * Handle editing an existing Owned Item for the Actor
    * @param {Event} event   The originating click event
    * @private
    */
    _onItemEdit(event) {
        event.preventDefault();
        const li = event.currentTarget.closest(".item");
        const item = this.actor.getOwnedItem(li.dataset.itemId);
        item.sheet.render(true);
    }


    /** 
     * Handle spawning the TraitSelector application which allows a checkbox of multiple trait options
     * @param {Event} event   The click event which originated the selection
     * @private
     */
    _onTraitSelector(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const label = a.parentElement.querySelector("label");
        const choices = CONFIG.G[a.dataset.options];
        const options = { name: a.dataset.target, title: label.innerText, choices };
        new TraitSelector(this.actor, options).render(true)
    }



    /**
   * Handle rolling a Skill check
   * @param {Event} event   The originating click event
   * @private
   */
    _onRollOtherAbilityCheck(event) {
        event.preventDefault();
        const skill = event.currentTarget.parentElement.dataset.skill;
        this.actor.rollAbility(skill, { event: event });
    }

    /* -------------------------------------------- */


      /**
   * Handle rolling an Ability check, either a test or a saving throw
   * @param {Event} event   The originating click event
   * @private
   */
  _onRollAbilityTest(event) {
    event.preventDefault();
    let ability = event.currentTarget.parentElement.dataset.ability;
    this.actor.rollAbility(ability, {event: event});
  }

        /**
   * Handle rolling an Ability check, either a test or a saving throw
   * @param {Event} event   The originating click event
   * @private
   */
  _onRollDefSaveTest(event) {
    event.preventDefault();
    let ability = event.currentTarget.dataset.ability;
    this.actor.rollAbility(ability, {event: event});
  }

    /**
   * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
   * @private
   */
  _onItemRoll(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.getOwnedItem(itemId);
    return this.actor.rollEquipment(item);
  }

}
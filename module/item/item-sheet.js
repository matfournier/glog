/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class GlogItemSheet extends ItemSheet {
  constructor(...args) {
    super(...args);
    if (this.object.data.type === "archetype") {
      this.options.resizable = true;
      this.options.width = 600;
      this.options.height = 640;
    }
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["glog", "sheet", "item"],
      width: 560,
      height: 480,
      resizable: true,
      scrollY: [".tab.details"],
      tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/glog/templates/item/";
    return `${path}/${this.item.data.type}.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.labels = this.item.labels;

    // Include CONFIG values
    data.config = CONFIG.G;

    // Item Type, Status, and Details
    data.itemType = data.item.type.titleCase();
    if (data.item.type === "effect" && data.item.data.mod.type === "auto") {
      data.effectInput = true;
    }
    data.itemStatus = this._getItemStatus(data.item);
    data.itemProperties = this._getItemProperties(data.item);
    data.isPhysical = data.item.data.hasOwnProperty("slots");

    // Action Details
    // data.hasAttackRoll = this.item.hasAttack;
    data.isHealing = data.item.data.actionType === "heal";
    // data.isFlatDC = getProperty(data.item.data, "save.scaling") === "flat";
    
    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(position = {}) {
    position.height = this._tabs[0].active === "details" ? "auto" : this.options.height;
    return super.setPosition(position);
  }

  /* -------------------------------------------- */
  /*  Form Submission                             */
  /* -------------------------------------------- */

  /** @override */
  _updateObject(event, formData) {

    // TODO: This can be removed once 0.7.x is release channel
    if (!formData.data) formData = expandObject(formData);

    const mods = formData.data?.statMods;
    if (mods) mods.parts = Object.values(mods?.parts || {}).map(d => [d[0] || "str", 
      d[1] || "auto", 
      d[2] || 0, 
      d[3] || `${this.item.data.type}: ${this.item.data.name}`,
      d[4] || "globally"])
    
    // Update the Item
    super._updateObject(event, formData);
  }

  /**
 * Get the text item status which is shown beneath the Item type in the top-right corner of the sheet
 * @return {string}
 * @private
 */
  _getItemStatus(item) {
    if (item.type === "spell") {
      return item.data.equipped ? "Equipped" : "Unequipped";
    }
    else if (["weapon", "equipment", "feat"].includes(item.type)) {
      return item.data.equipped ? "Equipped" : "Unequipped";
    }
  }

  /**
  * Get the Array of item properties which are used in the small sidebar of the description tab
  * @return {Array}
  * @private
  */
  _getItemProperties(item) {
    const props = [];
    const labels = this.item.labels;

    if (item.type === "weapon") {
      props.push(...Object.entries(item.data.properties)
        .filter(e => e[1] === true)
        .map(e => CONFIG.G.weaponProperties[e[0]]));
    }

    else if (item.type === "spell") {
      props.push(CONFIG.G.spellTypes[item.data.type]);
    }

    else if (item.type === "equipment") {
      props.push(CONFIG.G.equipmentTypes[item.data.type]);
    }

    // TODO POPULATE THIS
    // else if (item.type === "feat") {
    //   props.push(labels.featType);
    // }

    // Action type
    if (item.data.actionType) {
      props.push(CONFIG.G.itemActionTypes[item.data.actionType]);
    }

    // Action usage
    // if ((item.type !== "weapon" && item.type !== "equipment" ) && item.data.activation && !isObjectEmpty(item.data.activation)) {
    //   props.push(
    //     labels.activation,
    //     labels.range,
    //     labels.target,
    //     labels.duration
    //   )
    // }
    return props.filter(p => !!p);
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // html.find(".damage-control").click(this._onDamageControl.bind(this));
    html.find(".statmod-control").click(this._onStatModControl.bind(this));

    // Roll handlers, click handlers, etc. would go here.
  }

//   /**
//  * Add or remove a damage part from the damage formula
//  * @param {Event} event     The original click event
//  * @return {Promise}
//  * @private
//  */
//   async _onDamageControl(event) {
//     event.preventDefault();
//     const a = event.currentTarget;

//     // Add new damage component
//     if (a.classList.contains("add-damage")) {
//       await this._onSubmit(event);  // Submit any unsaved changes
//       const damage = this.item.data.data.damage;
//       return this.item.update({ "data.damage.parts": damage.parts.concat([["", ""]]) });
//     }

//     // Remove a damage component
//     if (a.classList.contains("delete-damage")) {
//       await this._onSubmit(event);  // Submit any unsaved changes
//       const li = a.closest(".damage-part");
//       const damage = duplicate(this.item.data.data.damage);
//       damage.parts.splice(Number(li.dataset.damagePart), 1);
//       return this.item.update({ "data.damage.parts": damage.parts });
//     }
//   }

  /**
 * Add or remove a stat modification 
 * @param {Event} event     The original click event
 * @return {Promise}
 * @private
 */
  async _onStatModControl(event) {
    event.preventDefault();
    const a = event.currentTarget;

    // Add new statMod component
    if (a.classList.contains("add-statmod")) {
      await this._onSubmit(event);  // Submit any unsaved changes
      const mods = this.item.data.data.statMods;
      return this.item.update({ "data.statMods.parts": mods.parts.concat([["", ""]]) });
    }

    // Remove a statMod component
    if (a.classList.contains("delete-statmod")) {
      await this._onSubmit(event);  // Submit any unsaved changes
      const li = a.closest(".statmod-part");
      const stat = duplicate(this.item.data.data.statMods);
      stat.parts.splice(Number(li.dataset.statPart), 1);
      return this.item.update({ "data.statMods.parts": stat.parts });
    }
  }
}

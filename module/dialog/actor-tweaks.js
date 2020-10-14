import { S } from "../sanctuary.js";

export class GlogActorTweaks extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'sheet-tweaks'
        options.template = 
            'systems/glog/templates/actor/dialogs/tweaks-dialog.html';
        options.width = 380;
        return options;
    }

      /**
   * Add the Entity name into the window title
   * @type {String}
   */
  get title() {
    return `${this.object.name}: Tweaks`;
  }

    /**
   * Construct and return the data object used to render the HTML template for this form application.
   * @return {Object}
   */
  getData() {
    let data = this.object.data;
    if (this.object.data.type === 'character') {
      data.isCharacter = true;
    }
    data.user = game.user;
    data.config = CONFIG.G;
    return data;
  }

    /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject(event, formData) {
    event.preventDefault();
    // Update the actor
    
    const terms = formData.data;
    this.object.update(formData);

    
    // need to rework the formData object 
    // it's a flat thing
    // realy need to set it to `sheetConfig` or something 

    // Re-draw the updated sheet
    this.object.sheet.render(true);
  }


}
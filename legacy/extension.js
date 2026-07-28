/* extension.js
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Indicator = Me.imports.indicator;

class MultiTimezoneClockExtension {
    constructor() {
        this._indicator = null;
        this._settings = null;
        this._settingsChangedId = 0;
    }

    getSettings() {
        return this._settings;
    }

    openPreferences() {
        try {
            Main.extensionManager.openExtensionPrefs('multi-timezone-clock@shreyansh', '', {});
        } catch (error) {
            console.error('Failed to open preferences:', error);
        }
    }

    enable() {
        if (this._indicator)
            return;

        this._settings = ExtensionUtils.getSettings();
        this._indicator = new Indicator.MultiClockIndicator(this);

        try {
            this._indicator.enable();
        } catch (error) {
            this._indicator.destroy();
            this._indicator = null;
            this._settings = null;
            throw error;
        }

        this._settingsChangedId = this._settings.connect('changed::panel-position', () => {
            if (this._indicator) {
                this._indicator.disable();
                this._indicator = null;
            }

            this._indicator = new Indicator.MultiClockIndicator(this);

            try {
                this._indicator.enable();
            } catch (error) {
                this._indicator.destroy();
                this._indicator = null;
                throw error;
            }
        });
    }

    disable() {
        if (this._settings && this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }
        this._settings = null;

        if (!this._indicator)
            return;

        this._indicator.disable();
        this._indicator = null;
    }
}

let extensionInstance = null;

function init() {
    // Nothing needed at init time
}

function enable() {
    extensionInstance = new MultiTimezoneClockExtension();
    extensionInstance.enable();
}

function disable() {
    if (extensionInstance) {
        extensionInstance.disable();
        extensionInstance = null;
    }
}

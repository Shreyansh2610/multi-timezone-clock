/* extension.js
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {MultiClockIndicator} from './indicator.js';

export default class MultiTimezoneClockExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._indicator = new MultiClockIndicator(this);

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

            this._indicator = new MultiClockIndicator(this);

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

        if (this._indicator) {
            this._indicator.disable();
            this._indicator = null;
        }
    }

    openPreferences() {
        try {
            Main.extensionManager.openExtensionPrefs('multi-timezone-clock@shreyansh', '', {});
        } catch (error) {
            console.error('Failed to open preferences:', error);
        }
    }
}

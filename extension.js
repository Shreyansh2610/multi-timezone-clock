/* extension.js
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {MultiClockIndicator} from './indicator.js';

export default class MultiTimezoneClockExtension extends Extension {
    enable() {
        if (this._indicator)
            return;

        this._indicator = new MultiClockIndicator(this);

        try {
            this._indicator.enable();
        } catch (error) {
            this._indicator.destroy();
            this._indicator = null;

            throw error;
        }
    }

    disable() {
        if (!this._indicator)
            return;

        this._indicator.disable();
        this._indicator = null;
    }
}

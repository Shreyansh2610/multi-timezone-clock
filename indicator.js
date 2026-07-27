/* indicator.js
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import {WorldClockPopup} from './popup.js';
import * as Utils from './utils.js';

const EXTENSION_ID = 'multi-timezone-clock';
const DEFAULT_TIMEZONE = 'Asia/Kolkata';
const DEFAULT_REFRESH_INTERVAL = 1;
const VALID_PANEL_POSITIONS = ['left', 'center', 'right'];
const VALID_REFRESH_INTERVALS = [1, 5, 30, 60];

export const MultiClockIndicator = GObject.registerClass(
class MultiClockIndicator extends PanelMenu.Button {
    constructor(extension) {
        super(0.0, 'Multi Timezone Clock');

        this._extension = extension;
        this._settings = extension.getSettings();

        this._timerId = 0;
        this._settingsChangedId = 0;
        this._timezones = [];
        this._popup = new WorldClockPopup(extension, this._settings, this.menu);

        this._label = new St.Label({
            style_class: 'multi-clock-label clock-label',
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });

        this.add_child(this._label);
        this._loadTimezones();
    }

    enable() {
        Main.panel.addToStatusArea(
            EXTENSION_ID,
            this,
            1,
            this._getPanelPosition()
        );

        this._buildPopup();
        this._updateLabels();

        this._settingsChangedId = this._settings.connect('changed', () => {
            this._loadTimezones();
            this._buildPopup();
            this._updateLabels();
            this._restartTimer();
        });

        this._restartTimer();
    }

    disable() {
        this.destroy();
    }

    destroy() {
        this._stopTimer();
        this._disconnectSettings();

        if (this._popup) {
            this._popup.destroy();
            this._popup = null;
        }

        this._timezones = [];

        super.destroy();
    }

    _disconnectSettings() {
        if (!this._settingsChangedId)
            return;

        this._settings.disconnect(this._settingsChangedId);
        this._settingsChangedId = 0;
    }

    _loadTimezones() {
        let zones = [];

        try {
            zones = this._settings.get_strv('timezones');
        } catch (error) {
            zones = [];
        }

        this._timezones = zones
            .filter(zone => this._isValidTimezone(zone))
            .map(zone => ({
                zone,
                flag: Utils.getFlag(zone),
                name: Utils.getTimezoneName(zone),
            }));

        if (this._timezones.length > 0)
            return;

        this._timezones = [{
            zone: DEFAULT_TIMEZONE,
            flag: Utils.getFlag(DEFAULT_TIMEZONE),
            name: Utils.getTimezoneName(DEFAULT_TIMEZONE),
        }];
    }

    _isValidTimezone(zone) {
        if (typeof zone !== 'string' || zone.length === 0)
            return false;

        try {
            const timezone = GLib.TimeZone.new_identifier(zone);
            return timezone !== null;
        } catch (error) {
            return false;
        }
    }

    _restartTimer() {
        this._stopTimer();

        this._timerId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            this._getRefreshInterval(),
            () => {
                this._updateLabels();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _stopTimer() {
        if (!this._timerId)
            return;

        GLib.source_remove(this._timerId);
        this._timerId = 0;
    }

    _buildPopup() {
        this._popup.build(this._timezones);
    }

    _updateLabels() {
        this._label.set_text(this._formatPanelLabel());
        this._refreshPopupLabels();
    }

    _refreshPopupLabels() {
        if (!this._popup)
            return;

        this._popup.update();
    }

    _formatPanelLabel() {
        const labels = [];

        for (const timezone of this._timezones) {
            try {
                labels.push(Utils.formatPanel(
                    timezone.flag,
                    timezone.zone,
                    this._settings
                ));
            } catch (error) {
                labels.push(`${timezone.flag} --:--`);
            }
        }

        if (labels.length === 0)
            return '';

        if (this._getBoolean('compact-mode', false))
            return labels.join('  ');

        return labels.join(' │ ');
    }

    _getPanelPosition() {
        try {
            const position = this._settings.get_string('panel-position');

            if (VALID_PANEL_POSITIONS.includes(position))
                return position;
        } catch (error) {
            return 'center';
        }

        return 'center';
    }

    _getRefreshInterval() {
        let interval = DEFAULT_REFRESH_INTERVAL;

        try {
            interval = this._settings.get_int('refresh-interval');
        } catch (error) {
            interval = DEFAULT_REFRESH_INTERVAL;
        }

        if (!VALID_REFRESH_INTERVALS.includes(interval))
            return DEFAULT_REFRESH_INTERVAL;

        return interval;
    }

    _getBoolean(key, fallback) {
        try {
            return this._settings.get_boolean(key);
        } catch (error) {
            return fallback;
        }
    }
});

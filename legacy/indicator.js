/* indicator.js
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const {Clutter, GLib, GObject, St} = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Popup = Me.imports.popup;
const Utils = Me.imports.utils;

const EXTENSION_ID = 'multi-timezone-clock';
const DEFAULT_TIMEZONE = 'Asia/Kolkata';
const DEFAULT_REFRESH_INTERVAL = 1;
const VALID_PANEL_POSITIONS = ['left', 'center', 'right'];
const VALID_REFRESH_INTERVALS = [1, 5, 30, 60];

var MultiClockIndicator = GObject.registerClass({
    GTypeName: 'MultiClockIndicator',
}, class MultiClockIndicator extends PanelMenu.Button {
    constructor(extension) {
        super(0.0, 'Multi Timezone Clock');

        this._extension = extension;
        this._settings = extension.getSettings();

        this._timerId = 0;
        this._settingsChangedId = 0;
        this._timezones = [];
        this._popup = new Popup.WorldClockPopup(extension, this._settings, this.menu);

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

        const now = GLib.DateTime.new_now_local();
        const msec = now.get_microsecond() / 1000;
        const sec = now.get_second();
        const interval = this._getRefreshInterval();
        const intervalMs = interval * 1000;
        const msIntoInterval = (sec % interval) * 1000 + msec;
        const delayMs = intervalMs - msIntoInterval + 50;

        this._timerId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            delayMs,
            () => {
                this._updateLabels();
                this._restartTimer();
                return GLib.SOURCE_REMOVE;
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

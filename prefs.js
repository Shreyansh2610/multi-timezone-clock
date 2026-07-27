/* prefs.js
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const PANEL_POSITIONS = [
    ['left', 'Left'],
    ['center', 'Center'],
    ['right', 'Right'],
];

const REFRESH_INTERVALS = [
    [1, '1 second'],
    [5, '5 seconds'],
    [30, '30 seconds'],
    [60, '60 seconds'],
];

const TimezoneRow = GObject.registerClass(
class TimezoneRow extends Adw.ActionRow {
    constructor(page, timezone) {
        super({
            title: timezone,
            subtitle: page._getTimezoneOffset(timezone),
        });

        this._page = page;
        this.timezone = timezone;

        const upButton = new Gtk.Button({
            icon_name: 'go-up-symbolic',
            valign: Gtk.Align.CENTER,
            tooltip_text: 'Move up',
        });
        upButton.add_css_class('flat');
        upButton.connect('clicked', () => this._page.moveTimezone(this.timezone, -1));

        const downButton = new Gtk.Button({
            icon_name: 'go-down-symbolic',
            valign: Gtk.Align.CENTER,
            tooltip_text: 'Move down',
        });
        downButton.add_css_class('flat');
        downButton.connect('clicked', () => this._page.moveTimezone(this.timezone, 1));

        const removeButton = new Gtk.Button({
            icon_name: 'user-trash-symbolic',
            valign: Gtk.Align.CENTER,
            tooltip_text: 'Delete timezone',
        });
        removeButton.add_css_class('flat');
        removeButton.add_css_class('destructive-action');
        removeButton.connect('clicked', () => this._page.removeTimezone(this.timezone));

        this.add_suffix(upButton);
        this.add_suffix(downButton);
        this.add_suffix(removeButton);
    }
});

const TimezonesPage = GObject.registerClass(
class TimezonesPage extends Adw.PreferencesPage {
    constructor(settings) {
        super({
            title: 'Timezones',
            icon_name: 'preferences-system-time-symbolic',
        });

        this._settings = settings;
        this._rows = [];

        const addGroup = new Adw.PreferencesGroup({
            title: 'Add Timezone',
            description: 'Enter an IANA timezone identifier.',
        });

        const addBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
            margin_top: 6,
            margin_bottom: 6,
            margin_start: 12,
            margin_end: 12,
        });

        this._entry = new Gtk.Entry({
            hexpand: true,
            placeholder_text: 'Search timezone',
            secondary_icon_name: 'edit-find-symbolic',
        });
        this._entry.connect('activate', () => this._addTimezoneFromEntry());

        const addButton = new Gtk.Button({
            label: 'Add',
            icon_name: 'list-add-symbolic',
            valign: Gtk.Align.CENTER,
        });
        addButton.add_css_class('suggested-action');
        addButton.connect('clicked', () => this._addTimezoneFromEntry());

        addBox.append(this._entry);
        addBox.append(addButton);
        addGroup.add(addBox);
        this.add(addGroup);

        this._listGroup = new Adw.PreferencesGroup({
            title: 'Configured Timezones',
        });
        this.add(this._listGroup);

        this._changedId = this._settings.connect('changed::timezones', () => this._refreshRows());
        this._refreshRows();
    }

    destroy() {
        if (this._changedId) {
            this._settings.disconnect(this._changedId);
            this._changedId = 0;
        }
    }

    moveTimezone(timezone, direction) {
        const zones = this._settings.get_strv('timezones');
        const index = zones.indexOf(timezone);
        const target = index + direction;

        if (index < 0 || target < 0 || target >= zones.length)
            return;

        const moved = zones[index];
        zones[index] = zones[target];
        zones[target] = moved;
        this._settings.set_strv('timezones', zones);
    }

    removeTimezone(timezone) {
        const zones = this._settings.get_strv('timezones')
            .filter(zone => zone !== timezone);
        this._settings.set_strv('timezones', zones);
    }

    _addTimezoneFromEntry() {
        const timezone = this._entry.get_text().trim();

        if (!this._isValidTimezone(timezone)) {
            this._entry.add_css_class('error');
            return;
        }

        const zones = this._settings.get_strv('timezones');

        if (!zones.includes(timezone)) {
            zones.push(timezone);
            this._settings.set_strv('timezones', zones);
        }

        this._entry.remove_css_class('error');
        this._entry.set_text('');
    }

    _refreshRows() {
        for (const row of this._rows)
            this._listGroup.remove(row);

        this._rows = [];

        const zones = this._settings.get_strv('timezones');

        if (zones.length === 0) {
            const emptyRow = new Adw.ActionRow({
                title: 'No timezones configured',
                subtitle: 'Add a timezone to show it in the panel.',
            });
            emptyRow.set_sensitive(false);
            this._listGroup.add(emptyRow);
            this._rows.push(emptyRow);
            return;
        }

        for (const zone of zones) {
            const row = new TimezoneRow(this, zone);
            this._listGroup.add(row);
            this._rows.push(row);
        }
    }

    _isValidTimezone(timezone) {
        if (timezone.length === 0)
            return false;

        try {
            return GLib.TimeZone.new_identifier(timezone) !== null;
        } catch (error) {
            return false;
        }
    }

    _getTimezoneOffset(timezone) {
        try {
            const dateTime = GLib.DateTime.new_now(GLib.TimeZone.new_identifier(timezone));
            return dateTime.format('%:::z') ?? '';
        } catch (error) {
            return 'Invalid timezone';
        }
    }
});

export default class MultiTimezoneClockPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const timezonesPage = new TimezonesPage(settings);

        window.add(this._createGeneralPage(settings));
        window.add(this._createPanelPage(settings));
        window.add(timezonesPage);
        window.add(this._createAboutPage(settings));

        window.connect('close-request', () => {
            timezonesPage.destroy();
            return false;
        });
    }

    _createGeneralPage(settings) {
        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'preferences-system-symbolic',
        });

        const displayGroup = new Adw.PreferencesGroup({
            title: 'Display',
        });
        page.add(displayGroup);

        this._addSwitchRow(displayGroup, settings, 'show-date', 'Show Date');
        this._addSwitchRow(displayGroup, settings, 'show-weekday', 'Show Weekday');
        this._addSwitchRow(displayGroup, settings, 'show-seconds', 'Show Seconds');
        this._addSwitchRow(displayGroup, settings, 'show-flags', 'Show Flags');
        this._addSwitchRow(displayGroup, settings, 'show-timezone-name', 'Show Timezone Name');

        const formatGroup = new Adw.PreferencesGroup({
            title: 'Time Format',
        });
        page.add(formatGroup);

        const formatRow = new Adw.ComboRow({
            title: 'Clock Format',
            model: Gtk.StringList.new(['12 Hour', '24 Hour']),
            selected: settings.get_string('time-format') === '24' ? 1 : 0,
        });
        formatRow.connect('notify::selected', row => {
            settings.set_string('time-format', row.get_selected() === 1 ? '24' : '12');
        });
        formatGroup.add(formatRow);

        const popupGroup = new Adw.PreferencesGroup({
            title: 'Popup',
        });
        page.add(popupGroup);
        this._addSwitchRow(popupGroup, settings, 'popup-date', 'Popup Date');
        this._addSwitchRow(popupGroup, settings, 'popup-seconds', 'Popup Seconds');

        return page;
    }

    _createPanelPage(settings) {
        const page = new Adw.PreferencesPage({
            title: 'Panel',
            icon_name: 'view-pin-symbolic',
        });

        const layoutGroup = new Adw.PreferencesGroup({
            title: 'Layout',
        });
        page.add(layoutGroup);

        const positionRow = new Adw.ComboRow({
            title: 'Panel Position',
            model: Gtk.StringList.new(PANEL_POSITIONS.map(([, label]) => label)),
            selected: Math.max(0, PANEL_POSITIONS.findIndex(([value]) =>
                value === settings.get_string('panel-position'))),
        });
        positionRow.connect('notify::selected', row => {
            settings.set_string('panel-position', PANEL_POSITIONS[row.get_selected()][0]);
        });
        layoutGroup.add(positionRow);

        const refreshRow = new Adw.ComboRow({
            title: 'Refresh Interval',
            model: Gtk.StringList.new(REFRESH_INTERVALS.map(([, label]) => label)),
            selected: Math.max(0, REFRESH_INTERVALS.findIndex(([value]) =>
                value === settings.get_int('refresh-interval'))),
        });
        refreshRow.connect('notify::selected', row => {
            settings.set_int('refresh-interval', REFRESH_INTERVALS[row.get_selected()][0]);
        });
        layoutGroup.add(refreshRow);

        this._addSwitchRow(layoutGroup, settings, 'compact-mode', 'Compact Mode');

        return page;
    }

    _createAboutPage(settings) {
        const page = new Adw.PreferencesPage({
            title: 'About',
            icon_name: 'help-about-symbolic',
        });

        const infoGroup = new Adw.PreferencesGroup({
            title: 'Multi Timezone Clock',
        });
        page.add(infoGroup);

        infoGroup.add(new Adw.ActionRow({
            title: 'Extension Name',
            subtitle: 'Multi Timezone Clock',
        }));
        infoGroup.add(new Adw.ActionRow({
            title: 'Version',
            subtitle: '1',
        }));
        infoGroup.add(new Adw.ActionRow({
            title: 'Author',
            subtitle: 'Shreyansh',
        }));
        infoGroup.add(new Adw.ActionRow({
            title: 'GitHub',
            subtitle: 'https://github.com/shreyansh/multi-timezone-clock',
        }));
        infoGroup.add(new Adw.ActionRow({
            title: 'License',
            subtitle: 'GPL-2.0-or-later',
        }));

        const resetGroup = new Adw.PreferencesGroup({
            title: 'Reset',
        });
        page.add(resetGroup);

        const resetRow = new Adw.ActionRow({
            title: 'Reset Settings',
            subtitle: 'Restore all extension settings to defaults.',
        });
        const resetButton = new Gtk.Button({
            label: 'Reset',
            icon_name: 'edit-undo-symbolic',
            valign: Gtk.Align.CENTER,
        });
        resetButton.add_css_class('destructive-action');
        resetButton.connect('clicked', () => {
            for (const key of settings.settings_schema.list_keys())
                settings.reset(key);
        });
        resetRow.add_suffix(resetButton);
        resetGroup.add(resetRow);

        return page;
    }

    _addSwitchRow(group, settings, key, title) {
        const row = new Adw.SwitchRow({
            title,
            active: settings.get_boolean(key),
        });
        settings.bind(key, row, 'active', Gio.SettingsBindFlags.DEFAULT);
        group.add(row);
    }
}

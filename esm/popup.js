/* popup.js
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import St from 'gi://St';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Utils from './utils.js';

export class WorldClockPopup {
    constructor(extension, settings, menu) {
        this._extension = extension;
        this._settings = settings;
        this._menu = menu;
        this._rows = [];
        this._preferencesItem = null;
        this._preferencesActivateId = 0;
    }

    destroy() {
        this._disconnectPreferencesItem();
        this._rows = [];
        this._menu = null;
        this._settings = null;
        this._extension = null;
    }

    build(timezones) {
        this._disconnectPreferencesItem();
        this._menu.removeAll();
        this._rows = [];

        const titleItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
        });
        const titleLabel = new St.Label({
            text: '🌍 World Clocks',
            style_class: 'multi-clock-popup-title',
        });
        titleItem.add_child(titleLabel);
        this._menu.addMenuItem(titleItem);

        this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        for (const timezone of timezones) {
            const item = new PopupMenu.PopupBaseMenuItem({
                reactive: false,
                can_focus: false,
                style_class: 'multi-clock-popup-item',
            });
            const box = new St.BoxLayout({
                vertical: true,
                style_class: 'multi-clock-popup-clock',
            });

            const nameLabel = new St.Label({
                style_class: 'multi-clock-popup-name',
            });
            const weekdayLabel = new St.Label({
                style_class: 'multi-clock-popup-detail',
            });
            const dateLabel = new St.Label({
                style_class: 'multi-clock-popup-detail',
            });
            const timeLabel = new St.Label({
                style_class: 'multi-clock-popup-time',
            });
            const offsetLabel = new St.Label({
                style_class: 'multi-clock-popup-offset',
            });

            box.add_child(nameLabel);
            box.add_child(weekdayLabel);
            box.add_child(dateLabel);
            box.add_child(timeLabel);
            box.add_child(offsetLabel);
            item.add_child(box);

            this._rows.push({
                timezone,
                nameLabel,
                weekdayLabel,
                dateLabel,
                timeLabel,
                offsetLabel,
            });

            this._menu.addMenuItem(item);
            this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }

        this._preferencesItem = new PopupMenu.PopupMenuItem('⚙ Preferences');
        this._preferencesActivateId = this._preferencesItem.connect('activate', () => {
            try {
                this._extension.openPreferences();
            } catch (error) {
                this._menu.close();
            }
        });
        this._menu.addMenuItem(this._preferencesItem);

        this.update();
    }

    update() {
        for (const row of this._rows) {
            const lines = Utils.formatPopup(row.timezone.zone, this._settings);

            row.nameLabel.set_text(lines.name);
            row.weekdayLabel.set_text(lines.weekday);
            row.dateLabel.set_text(lines.date);
            row.timeLabel.set_text(lines.time);
            row.offsetLabel.set_text(lines.offset);

            row.dateLabel.visible = lines.date.length > 0;
            row.offsetLabel.visible = lines.offset.length > 0;
        }
    }

    _disconnectPreferencesItem() {
        if (!this._preferencesItem || !this._preferencesActivateId)
            return;

        this._preferencesItem.disconnect(this._preferencesActivateId);
        this._preferencesItem = null;
        this._preferencesActivateId = 0;
    }
}

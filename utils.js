/* utils.js
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GLib from 'gi://GLib';

const DEFAULT_TIMEZONE = 'Asia/Kolkata';

const FLAGS = {
    'Asia/Kolkata': '🇮🇳',
    'America/Chicago': '🇺🇸',
    'America/New_York': '🇺🇸',
    'Europe/London': '🇬🇧',
    'Europe/Paris': '🇫🇷',
    'Europe/Berlin': '🇩🇪',
    'Asia/Tokyo': '🇯🇵',
    'Asia/Dubai': '🇦🇪',
    'Australia/Sydney': '🇦🇺',
};

const NAMES = {
    'Asia/Kolkata': 'India',
    'America/Chicago': 'Chicago',
    'America/New_York': 'New York',
    'Europe/London': 'London',
    'Europe/Paris': 'Paris',
    'Europe/Berlin': 'Berlin',
    'Asia/Tokyo': 'Tokyo',
    'Asia/Dubai': 'Dubai',
    'Australia/Sydney': 'Sydney',
};

function getBoolean(settings, key, fallback) {
    try {
        return settings.get_boolean(key);
    } catch (error) {
        return fallback;
    }
}

function getString(settings, key, fallback) {
    try {
        return settings.get_string(key);
    } catch (error) {
        return fallback;
    }
}

function formatWithFallback(dateTime, format, fallback) {
    if (!dateTime)
        return fallback;

    const value = dateTime.format(format);
    return value ?? fallback;
}

export function getDateTime(zone = DEFAULT_TIMEZONE) {
    try {
        const timezone = GLib.TimeZone.new_identifier(zone);

        if (!timezone)
            return null;

        return GLib.DateTime.new_now(timezone);
    } catch (error) {
        return null;
    }
}

export function getTime(zone, settings = null, popup = false) {
    const dateTime = getDateTime(zone);

    if (!dateTime)
        return '--:--';

    const timeFormat = settings ? getString(settings, 'time-format', '12') : '12';
    const showSeconds = settings
        ? getBoolean(settings, popup ? 'popup-seconds' : 'show-seconds', false)
        : false;

    if (timeFormat === '24')
        return formatWithFallback(dateTime, showSeconds ? '%H:%M:%S' : '%H:%M', '--:--');

    return formatWithFallback(dateTime, showSeconds ? '%I:%M:%S %p' : '%I:%M %p', '--:--');
}

export function getDate(zone, longFormat = false) {
    const dateTime = getDateTime(zone);
    return formatWithFallback(dateTime, longFormat ? '%d %B %Y' : '%a %d %b', '');
}

export function getWeekday(zone) {
    const dateTime = getDateTime(zone);
    return formatWithFallback(dateTime, '%A', '');
}

export function getFlag(zone) {
    return FLAGS[zone] ?? '🌍';
}

export function getTimezoneName(zone) {
    return NAMES[zone] ?? zone;
}

export function formatPanel(flag, zone, settings = null) {
    const parts = [];
    const showFlags = settings ? getBoolean(settings, 'show-flags', true) : true;
    const showTimezoneName = settings
        ? getBoolean(settings, 'show-timezone-name', false)
        : false;
    const showWeekday = settings ? getBoolean(settings, 'show-weekday', true) : true;
    const showDate = settings ? getBoolean(settings, 'show-date', true) : true;

    if (showFlags)
        parts.push(flag);

    if (showTimezoneName)
        parts.push(getTimezoneName(zone));

    if (showWeekday) {
        const dateTime = getDateTime(zone);
        parts.push(formatWithFallback(dateTime, '%a', ''));
    }

    if (showDate) {
        const dateTime = getDateTime(zone);
        parts.push(formatWithFallback(dateTime, '%d %b', ''));
    }

    parts.push(getTime(zone, settings, false));

    return parts.filter(part => part.length > 0).join(' ');
}

export function formatPopup(zone, settings = null) {
    const showFlags = settings ? getBoolean(settings, 'show-flags', true) : true;
    const popupDate = settings ? getBoolean(settings, 'popup-date', true) : true;
    const flag = getFlag(zone);
    const name = getTimezoneName(zone);

    return {
        name: showFlags ? `${flag} ${name}` : name,
        weekday: getWeekday(zone),
        date: popupDate ? getDate(zone, true) : '',
        time: getTime(zone, settings, true),
        offset: getOffset(zone),
    };
}

export function getOffset(zone) {
    const dateTime = getDateTime(zone);
    return formatWithFallback(dateTime, '%:::z', '');
}

export function isValidTimezone(zone) {
    return getDateTime(zone) !== null;
}

# Multi Timezone Clock

Multi Timezone Clock is a GNOME Shell 50 extension that displays multiple world clocks in the top panel and provides a popup with detailed date, weekday, time, and UTC offset information.

## Installation

Install the extension directory at:

```sh
~/.local/share/gnome-shell/extensions/multi-timezone-clock@shreyansh
```

The folder name must match the UUID:

```text
multi-timezone-clock@shreyansh
```

## Folder Structure

```text
multi-timezone-clock@shreyansh/
├── metadata.json
├── extension.js
├── indicator.js
├── popup.js
├── utils.js
├── prefs.js
├── stylesheet.css
├── README.md
└── schemas/
    ├── org.gnome.shell.extensions.multiclock.gschema.xml
    └── gschemas.compiled
```

## Compilation

Compile the GSettings schema after editing the schema XML:

```sh
glib-compile-schemas schemas
```

## Enable

```sh
gnome-extensions enable multi-timezone-clock@shreyansh
```

## Disable

```sh
gnome-extensions disable multi-timezone-clock@shreyansh
```

## Reload

On Wayland, log out and log back in after changing extension code.

On X11, restart GNOME Shell with `Alt` + `F2`, enter `r`, and press `Enter`.

## Debugging

Follow GNOME Shell logs with:

```sh
journalctl -f -o cat /usr/bin/gnome-shell
```

Open preferences from Extensions or with:

```sh
gnome-extensions prefs multi-timezone-clock@shreyansh
```

## Packaging

Create a distributable archive from the parent directory:

```sh
gnome-extensions pack multi-timezone-clock@shreyansh
```

Make sure `schemas/gschemas.compiled` exists before packaging.

## Roadmap

- Add timezone autocomplete from the system timezone database.
- Add drag-and-drop timezone reordering.
- Add per-timezone custom display names.
- Add optional UTC offset display in the panel.

## Contributing

Keep code compatible with GNOME Shell 50, GJS ES modules, GTK4, and LibAdwaita. Avoid deprecated APIs and keep runtime updates limited to label text changes.

## License

GPL-2.0-or-later

#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Target installation directory
TARGET_DIR="$HOME/.local/share/gnome-shell/extensions/multi-timezone-clock@shreyansh"

echo "Creating installation directory: $TARGET_DIR"
mkdir -p "$TARGET_DIR"

# Detect GNOME Shell version
if command -v gnome-shell >/dev/null 2>&1; then
    GNOME_VERSION=$(gnome-shell --version | cut -d' ' -f3)
else
    # Fallback to checking via package manager or assume latest if not found
    GNOME_VERSION="46"
fi

# Extract major version
MAJOR_VERSION=$(echo "$GNOME_VERSION" | cut -d'.' -f1)

# Check if major version is numeric
if ! [[ "$MAJOR_VERSION" =~ ^[0-9]+$ ]]; then
    # Older GNOME versions (e.g. 3.36) might return 3
    MAJOR_VERSION=3
fi

echo "Detected GNOME Shell version: $GNOME_VERSION (Major: $MAJOR_VERSION)"

if [ "$MAJOR_VERSION" -ge 45 ]; then
    echo "Installing ESM version for GNOME Shell 45+ to $TARGET_DIR..."
    cp "$DIR/esm/extension.js" "$TARGET_DIR/extension.js"
    cp "$DIR/esm/indicator.js" "$TARGET_DIR/indicator.js"
    cp "$DIR/esm/popup.js" "$TARGET_DIR/popup.js"
    cp "$DIR/esm/utils.js" "$TARGET_DIR/utils.js"
    cp "$DIR/esm/prefs.js" "$TARGET_DIR/prefs.js"
    cp "$DIR/esm/metadata.json" "$TARGET_DIR/metadata.json"
else
    echo "Installing legacy version for GNOME Shell < 45 to $TARGET_DIR..."
    cp "$DIR/legacy/extension.js" "$TARGET_DIR/extension.js"
    cp "$DIR/legacy/indicator.js" "$TARGET_DIR/indicator.js"
    cp "$DIR/legacy/popup.js" "$TARGET_DIR/popup.js"
    cp "$DIR/legacy/utils.js" "$TARGET_DIR/utils.js"
    cp "$DIR/legacy/prefs.js" "$TARGET_DIR/prefs.js"
    cp "$DIR/legacy/metadata.json" "$TARGET_DIR/metadata.json"
fi

# Copy shared assets safely if source and target directories are different
ABS_DIR=$(readlink -f "$DIR")
ABS_TARGET=$(readlink -f "$TARGET_DIR")

if [ "$ABS_DIR" != "$ABS_TARGET" ]; then
    echo "Copying stylesheet and schemas..."
    cp "$DIR/stylesheet.css" "$TARGET_DIR/stylesheet.css"
    mkdir -p "$TARGET_DIR/schemas"
    cp "$DIR/schemas/"*.xml "$TARGET_DIR/schemas/"
fi

# Compile schemas in target directory
if command -v glib-compile-schemas >/dev/null 2>&1; then
    echo "Compiling GSettings schemas in target directory..."
    glib-compile-schemas "$TARGET_DIR/schemas"
fi

echo "Installation complete! Please reload GNOME Shell or restart your system."

#!/bin/bash

# Rebuild Bookminder Plugin Container
# This script rebuilds a specific plugin container by name

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if plugin name was provided
if [ -z "$1" ]; then
    echo "Error: No plugin name provided"
    echo ""
    echo "Usage: $0 <plugin-name>"
    echo ""
    echo "Available plugins:"
    echo "  - calibre"
    echo "  - gutenberg"
    echo "  - sendtokindle"
    echo ""
    echo "Example: $0 calibre"
    exit 1
fi

PLUGIN_NAME="$1"
PLUGIN_DIR="$SCRIPT_DIR/plugin-$PLUGIN_NAME"

# Check if plugin directory exists
if [ ! -d "$PLUGIN_DIR" ]; then
    echo "Error: Plugin directory not found: $PLUGIN_DIR"
    echo ""
    echo "Available plugins:"
    echo "  - calibre"
    echo "  - gutenberg"
    echo "  - sendtokindle"
    exit 1
fi

echo "========================================="
echo "Rebuilding plugin-$PLUGIN_NAME"
echo "========================================="
echo ""

# Stop the container
echo "→ Stopping plugin-$PLUGIN_NAME..."
cd "$PLUGIN_DIR"
docker compose down
echo "  ✓ Container stopped"
echo ""

# Rebuild the container
echo "→ Rebuilding plugin-$PLUGIN_NAME..."
docker compose build --no-cache
echo "  ✓ Container rebuilt"
echo ""

# Start the container
echo "→ Starting plugin-$PLUGIN_NAME..."
docker compose up -d
echo "  ✓ Container started"
echo ""

echo "========================================="
echo "plugin-$PLUGIN_NAME rebuilt successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Check plugin logs:"
echo "     docker compose -f $PLUGIN_DIR/docker-compose.yaml logs -f"
echo ""
echo "  2. Verify registration (wait ~10-30 seconds):"
echo "     curl http://localhost:3010/plugins/all"
echo ""
echo "  3. View container status:"
echo "     docker ps | grep bookminder-plugin-$PLUGIN_NAME"
echo ""

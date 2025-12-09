#!/bin/bash

# Stop All Bookminder Plugins
# This script stops all plugin containers

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "Stopping Bookminder Plugins"
echo "========================================="
echo ""

# Stop plugin-calibre
echo "→ Stopping plugin-calibre..."
cd "$SCRIPT_DIR/plugin-calibre"
docker compose down
echo "  ✓ plugin-calibre stopped"
echo ""

# Stop plugin-gutenberg
echo "→ Stopping plugin-gutenberg..."
cd "$SCRIPT_DIR/plugin-gutenberg"
docker compose down
echo "  ✓ plugin-gutenberg stopped"
echo ""

# Stop plugin-sendtokindle
echo "→ Stopping plugin-sendtokindle..."
cd "$SCRIPT_DIR/plugin-sendtokindle"
docker compose down
echo "  ✓ plugin-sendtokindle stopped"
echo ""

echo "========================================="
echo "All plugins stopped successfully!"
echo "========================================="
echo ""
echo "Note: The bookminder_network_plugins network is still active."
echo "To remove it, run: docker network rm bookminder_network_plugins"
echo ""

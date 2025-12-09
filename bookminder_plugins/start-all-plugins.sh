#!/bin/bash

# Start All Bookminder Plugins
# This script creates the plugin network and starts all plugin containers

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "Starting Bookminder Plugins"
echo "========================================="
echo ""

# Create the plugin network if it doesn't exist
echo "→ Creating Docker network 'bookminder_network_plugins'..."
if docker network inspect bookminder_network_plugins >/dev/null 2>&1; then
    echo "  ✓ Network already exists"
else
    docker network create bookminder_network_plugins
    echo "  ✓ Network created"
fi
echo ""

# Start plugin-calibre
echo "→ Starting plugin-calibre (Metadata Extraction)..."
cd "$SCRIPT_DIR/plugin-calibre"
docker compose up -d
echo "  ✓ plugin-calibre started"
echo ""

# Start plugin-gutenberg
echo "→ Starting plugin-gutenberg (Gutenberg Search)..."
cd "$SCRIPT_DIR/plugin-gutenberg"
docker compose up -d
echo "  ✓ plugin-gutenberg started"
echo ""

# Start plugin-sendtokindle
echo "→ Starting plugin-sendtokindle (Send to Kindle)..."
cd "$SCRIPT_DIR/plugin-sendtokindle"
docker compose up -d
echo "  ✓ plugin-sendtokindle started"
echo ""

echo "========================================="
echo "All plugins started successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Check plugin logs:"
echo "     docker compose -f plugin-calibre/docker-compose.yaml logs -f"
echo ""
echo "  2. Verify registration (wait ~10-30 seconds):"
echo "     curl http://localhost:3010/plugins/all"
echo ""
echo "  3. View all plugin containers:"
echo "     docker ps | grep bookminder-plugin"
echo ""

# Bookminder Plugins

This directory contains independent plugin services that extend Bookminder functionality. Each plugin is a standalone containerized service that registers itself with the main Bookminder backend.

## Plugin Architecture

### How Plugins Work

1. **Auto-Discovery**: Plugins automatically register themselves with the Bookminder backend on startup
2. **Authentication**: Each plugin has a unique `PUBLIC_UUID` and `PLUGIN_AUTH_TOKEN` pair
3. **Registration Loop**: Plugins continuously attempt to register (every 10-30 seconds) until successful
4. **Entrypoints**: Plugins expose various endpoints for different functionality types

### Plugin Types & Entrypoints

Plugins can provide multiple entrypoints:

- **`file-metadata`**: Extract metadata and covers from ebook files (used during book upload processing)
- **`search`**: Provide book search functionality
- **`settings`**: Plugin-specific configuration UI
- **`book-details`**: UI components that appear on book detail pages
- **Custom actions**: Any HTTP endpoints for specific operations

### Authorization Flow

```
Plugin Container                    Bookminder Backend
      |                                      |
      |-- POST /plugins/register ---------->|
      |   (Basic Auth: PUBLIC_UUID:TOKEN)   |
      |                                      |
      |<----- 200 OK or 401 Unauthorized ---|
      |                                      |
      |   (Retry every 10s if failed)       |
```

The backend maintains:
- **`ALLOWED_PLUGINS`**: JSON map of authorized `{PUBLIC_UUID: TOKEN}` pairs in environment
- **In-memory plugin registry** (LokiJS): Stores registered plugin metadata, entrypoints, and connection details

### Networking

All plugins must:
1. Be on the `bookminder_network_plugins` Docker network
2. Use container names for inter-service communication
3. Expose their service on the configured `PLUGIN_CONTAINER_PORT`

## Available Plugins

### 1. plugin-calibre (Metadata Extraction)

**Purpose**: Extracts ebook metadata and cover images using Calibre's `ebook-meta` tool

**UUID**: `985f95c0-fe2d-4213-8240-redacted`  
**Token**: `7fced399-8388-43f4-89d2-redacted`  
**Port**: 5000

**Entrypoints**:
- `/get-file-metadata` (POST): Extract metadata from uploaded ebook files
- `/convert` (POST): Convert ebook formats

**Used For**: Primary metadata extraction during book uploads

### 2. plugin-gutenberg (Search)

**Purpose**: Search Project Gutenberg catalog and download public domain books

**UUID**: `d1393b2e-5985-4c4b-958a-redacted`  
**Token**: `a91977cc-44f5-4ebb-996f-redacted`  
**Port**: 5019

**Entrypoints**:
- Search and download functionality from Project Gutenberg

### 3. plugin-sendtokindle

**Purpose**: Send books to Kindle devices via email

**UUID**: `3d092020-aa5c-4824-9bc2-redacted`  
**Token**: `93366bbf-40f4-4d50-9a60-redacted`  
**Port**: 5000

**Entrypoints**:
- Send book files to Kindle email addresses

## Quick Start

### Management Scripts

The `bookminder_plugins` directory provides three convenience scripts for managing plugins:

- **`start-all-plugins.sh`** - Start all plugin containers
- **`stop-all-plugins.sh`** - Stop all plugin containers  
- **`rebuild-plugin.sh <plugin-name>`** - Rebuild a specific plugin (e.g., `./rebuild-plugin.sh calibre`)

These scripts handle the Docker commands for you and ensure all plugins are managed consistently.

### 1. Create the Plugin Network

Before starting any plugins, ensure the Docker network exists:

```bash
docker network create bookminder_network_plugins
```

### 2. Start All Plugins

From the `bookminder_plugins` directory:

```bash
# Start all plugins using the provided script
./start-all-plugins.sh

# Or start individually using docker compose
cd plugin-calibre && docker compose up -d
cd plugin-gutenberg && docker compose up -d
cd plugin-sendtokindle && docker compose up -d
```

### 3. Stop All Plugins

```bash
# Stop all plugins using the provided script
./stop-all-plugins.sh
```

### 4. Rebuild a Plugin

If you make changes to a plugin and need to rebuild it:

```bash
# Rebuild a specific plugin (e.g., calibre, gutenberg, sendtokindle)
./rebuild-plugin.sh calibre
```

### 5. Verify Registration

Check the Bookminder backend logs to confirm plugin registration:

```bash
docker compose -f ../bundle_docker/docker-compose.yaml logs -f bookminder | grep -i "plugin\|register"
```

You should see log entries like:
```
PLUGIN REGISTER CALLED
pluginData: { name: 'Calibre', public_uuid: '985f95c0-fe2d-4213-8240-redacted', ... }
```

### 6. Check Registered Plugins

Query the backend API to see all registered plugins:

```bash
curl http://localhost:3010/plugins/all
```

## Environment Variables

### Required for All Plugins

Every plugin compose file must include:

```yaml
environment:
  - BOOKMINDER_CONTAINER_NAME=bookminder
  - BOOKMINDER_CONTAINER_PORT=3010
  - PLUGIN_CONTAINER_NAME=<unique-plugin-container-name>
  - PLUGIN_CONTAINER_PORT=<plugin-port>
  - PLUGIN_CONTAINER_HOST=0.0.0.0
  
  - PUBLIC_UUID=<plugin-public-uuid>
  - PLUGIN_AUTH_TOKEN=<plugin-secret-token>
  
  - REGISTRATION_INTERVAL=10
  - REGISTRATION_RETRY_INTERVAL=10

networks:
  - bookminder_network_plugins
```

### Bookminder Backend Configuration

In `bundle_docker/docker-compose.yaml`, ensure:

```yaml
environment:
  ALLOWED_PLUGINS: '{"<PUBLIC_UUID>":"<TOKEN>", ...}'
  DEFAULT_FILE_METADATA_PLUGIN_UUID: "985f95c0-fe2d-4213-8240-redacted"
```

The `DEFAULT_FILE_METADATA_PLUGIN_UUID` tells the backend which plugin to use for processing uploaded book files.

## Adding a New Plugin

### 1. Create Plugin Structure

```
bookminder_plugins/
  plugin-myname/
    Dockerfile
    docker-compose.yaml
    myname/
      main.py          # Your plugin server
      requirements.txt
```

### 2. Generate UUIDs

```bash
# Generate a new PUBLIC_UUID
uuidgen

# Generate a new PLUGIN_AUTH_TOKEN
uuidgen
```

### 3. Implement Registration

Your plugin must:
1. POST to `http://bookminder:3010/plugins/register` with Basic Auth (`PUBLIC_UUID:TOKEN`)
2. Send plugin metadata in the request body:

```json
{
  "name": "My Plugin",
  "description": "Plugin description",
  "public_uuid": "<your-public-uuid>",
  "private_uuid": "<generated-at-runtime>",
  "container_port": "5000",
  "container_name": "bookminder-plugin-myname",
  "entrypoints": [
    {
      "type": "search",
      "description": "Search books",
      "url": "/search",
      "method": "POST"
    }
  ],
  "last_modified_ts": 1234567890
}
```

### 4. Add to ALLOWED_PLUGINS

Update `bundle_docker/docker-compose.yaml`:

```yaml
environment:
  ALLOWED_PLUGINS: '{"<existing>":"<tokens>","<new-uuid>":"<new-token>"}'
```

### 5. Start and Test

```bash
cd plugin-myname
docker compose up -d
docker compose logs -f
```

Check for successful registration in both plugin and backend logs.

## Troubleshooting

### Plugin won't register

1. **Check network**: Ensure both plugin and backend are on `bookminder_network_plugins`
   ```bash
   docker network inspect bookminder_network_plugins
   ```

2. **Verify UUIDs match**: `PUBLIC_UUID` in plugin compose must exist in backend's `ALLOWED_PLUGINS`

3. **Check backend is running**: Plugin will retry every 10s until backend is available

4. **Review plugin logs**:
   ```bash
   docker compose logs bookminder-plugin-calibre
   ```

### Plugin registered but not processing files

1. **Check `DEFAULT_FILE_METADATA_PLUGIN_UUID`**: Must match the Calibre plugin UUID (`985f95c0-fe2d-4213-8240-redacted`)
2. **Verify entrypoint type**: File processing requires `"type": "file-metadata"`
3. **Check interval job logs**: The backend runs a job every 5s to process pending files

### Authentication errors

- Ensure `PLUGIN_AUTH_TOKEN` in plugin matches the token in backend's `ALLOWED_PLUGINS` JSON
- Basic Auth must be formatted as `Base64(PUBLIC_UUID:TOKEN)`

## Plugin Development Tips

- Use the Calibre plugin as a reference implementation
- Plugins can be written in any language (Python, Node.js, Go, etc.)
- Keep registration logic in a background thread/task
- Return proper HTTP status codes (200 for success, 401 for auth errors)
- Use environment variables for all configuration
- Test registration independently before integrating with Bookminder

## Backend Plugin Routes

- `GET  /plugins/all` - List all registered plugins (excludes private_uuid)
- `POST /plugins/register` - Plugin registration endpoint (requires auth)
- `GET  /plugins/settings` - Get user-specific plugin settings
- `POST /plugins/settings` - Save user-specific plugin settings
- `POST /plugins/action` - Proxy action to a registered plugin

## Data Flow: File Upload Processing

```
1. User uploads book file
   ↓
2. Backend saves to /files/upload, inserts into files_to_process table
   ↓
3. Interval job (every 5s) finds pending files
   ↓
4. Job looks up DEFAULT_FILE_METADATA_PLUGIN_UUID
   ↓
5. Job sends file to plugin's /get-file-metadata endpoint
   ↓
6. Plugin extracts metadata and cover using Calibre
   ↓
7. Plugin returns JSON: { metadata: {...}, cover: "base64..." }
   ↓
8. Backend creates Book instance and saves to database
   ↓
9. Book appears in user's library
```

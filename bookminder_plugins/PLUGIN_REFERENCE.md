# Plugin Quick Reference

This is a quick reference for plugin UUIDs, tokens, and ports.

## Plugin Registry

| Plugin | Public UUID | Auth Token | Port | Container Name |
|--------|-------------|------------|------|----------------|
| **Calibre** (Metadata) | `985f95c0-fe2d-4213-8240-redacted` | `7fced399-8388-43f4-89d2-redacted` | 5000 | `bookminder-plugin-calibre` |
| **Gutenberg** (Search) | `d1393b2e-5985-4c4b-958a-redacted` | `a91977cc-44f5-4ebb-996f-redacted` | 5019 | `bookminder-plugin-gutenberg` |
| **Send to Kindle** | `3d092020-aa5c-4824-9bc2-redacted` | `93366bbf-40f4-4d50-9a60-redacted` | 5000 | `bookminder-plugin-sendtokindle` |

## Common Commands

### Start all plugins
```bash
cd bookminder_plugins
./start-all-plugins.sh
```

### Stop all plugins
```bash
cd bookminder_plugins
./stop-all-plugins.sh
```

### Check plugin status
```bash
# List running plugin containers
docker ps | grep bookminder-plugin

# Check specific plugin logs
docker compose -f bookminder_plugins/plugin-calibre/docker-compose.yaml logs -f
docker compose -f bookminder_plugins/plugin-gutenberg/docker-compose.yaml logs -f
docker compose -f bookminder_plugins/plugin-sendtokindle/docker-compose.yaml logs -f
```

### Verify registration
```bash
# Check which plugins are registered with the backend
curl http://localhost:3010/plugins/all | jq
```

### Test plugin connectivity
```bash
# From inside a plugin container
docker exec bookminder-plugin-calibre ping -c 1 bookminder

# Check network membership
docker network inspect bookminder_network_plugins
```

## Plugin Registration Flow

1. Plugin container starts
2. Background thread/task begins registration loop
3. POST to `http://bookminder:3010/plugins/register`
   - Basic Auth: `{PUBLIC_UUID}:{PLUGIN_AUTH_TOKEN}`
   - Body: Plugin metadata (name, entrypoints, etc.)
4. Backend validates token against `ALLOWED_PLUGINS` env var
5. Backend stores plugin in `pluginsMem` (in-memory LokiJS collection)
6. Plugin retries every 10s if registration fails

## File Processing Flow (Calibre Plugin)

1. User uploads book → Backend saves to `/files/upload`
2. Backend inserts entry into `files_to_process` table
3. Interval job (5s) polls table for pending files
4. Job looks up `DEFAULT_FILE_METADATA_PLUGIN_UUID` (Calibre)
5. Job POSTs file to Calibre's `/get-file-metadata` endpoint
6. Calibre runs `ebook-meta` and parses OPF metadata
7. Calibre returns `{ metadata: {...}, cover: "base64..." }`
8. Backend creates Book instance and saves to DB
9. Book appears in user's library

## Troubleshooting

### Plugin won't start
```bash
# Check if network exists
docker network inspect bookminder_network_plugins

# Create it if missing
docker network create bookminder_network_plugins

# Rebuild plugin image
cd bookminder_plugins/plugin-calibre
docker compose build --no-cache
docker compose up -d
```

### Plugin won't register
```bash
# Check backend ALLOWED_PLUGINS env var
docker compose -f bundle_docker/docker-compose.yaml exec bookminder env | grep ALLOWED_PLUGINS

# Check plugin UUID/token in compose file
grep -E 'PUBLIC_UUID|PLUGIN_AUTH_TOKEN' bookminder_plugins/plugin-calibre/docker-compose.yaml

# Watch registration attempts in plugin logs
docker compose -f bookminder_plugins/plugin-calibre/docker-compose.yaml logs -f | grep -i register
```

### Files not processing
```bash
# Check if Calibre plugin is registered
curl http://localhost:3010/plugins/all | jq '.[] | select(.public_uuid == "985f95c0-fe2d-4213-8240-redacted")'

# Check files_to_process table
docker compose -f bundle_docker/docker-compose.yaml exec bookminder sqlite3 /app/databases/bookminder.sqlite "SELECT * FROM files_to_process;"

# Watch interval job logs
docker compose -f bundle_docker/docker-compose.yaml logs -f bookminder | grep -i "processing file\|metadata"
```

## Adding a New Plugin

1. **Generate credentials**
   ```bash
   PUBLIC_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]')
   AUTH_TOKEN=$(uuidgen | tr '[:upper:]' '[:lower:]')
   echo "PUBLIC_UUID: $PUBLIC_UUID"
   echo "AUTH_TOKEN: $AUTH_TOKEN"
   ```

2. **Update main compose**
   Add to `bundle_docker/docker-compose.yaml` → `ALLOWED_PLUGINS`:
   ```yaml
   ALLOWED_PLUGINS: "{\"existing\":\"tokens\",\"$PUBLIC_UUID\":\"$AUTH_TOKEN\"}"
   ```

3. **Create plugin compose**
   ```yaml
   services:
     your-plugin:
       environment:
         - PUBLIC_UUID=$PUBLIC_UUID
         - PLUGIN_AUTH_TOKEN=$AUTH_TOKEN
         - BOOKMINDER_CONTAINER_NAME=bookminder
         - BOOKMINDER_CONTAINER_PORT=3010
       networks:
         - bookminder_network_plugins
   ```

4. **Implement registration in your plugin code**
   - POST to `http://bookminder:3010/plugins/register`
   - Include Basic Auth header
   - Send plugin metadata

5. **Add to startup script**
   Edit `start-all-plugins.sh` and `stop-all-plugins.sh`

6. **Update this reference document**

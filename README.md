# Bookminder

Bookminder is an open-source e-book library manager, similar to Plex or Jellyfin, with Calibre-like functionality and a fully extensible plugin system powered by Docker.

🌐 **Live Demo:** https://demo.bookminder.io

Originally developed as my Final Project for the Level 5 Professional Diploma in Web Application Development, this project was dormant for years. I recently revived it with updates to run a live demo featuring first-come, first-served time-based access.

While built under tight time constraints, Bookminder demonstrates a working plugin architecture—the Send to Kindle plugin, for example, allows sending books directly to your Kindle device when configured with SMTP credentials and Amazon account whitelisting, some other cool features, and a decently polishe interface (for the most part).

## Project Structure

- **bookminder_server/** - Backend API (Node.js/Express)
- **bookminder_vite/** - Frontend UI (Vue.js/Vite)
- **bookminder_plugins/** - Plugin system for extending functionality
- **bundle_docker/** - Docker deployment configuration

## Quick Start with Docker

### Prerequisites

- Docker and Docker Compose
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bookminder
   ```

2. **Create required data directories**
   ```bash
   cd bundle_docker
   sudo mkdir -p bookminder-data/bookminder-data/{global,user,meta,db}
   sudo chmod -R 777 bookminder-data/bookminder-data
   ```

3. **Configure environment**
   
   Copy and edit the environment file:
   ```bash
   cp .env.local .env.local.custom
   # Edit .env.local.custom if needed
   ```

   Key environment variables:
   - `ADMIN_USERNAME` - Default admin username (default: `admin`)
   - `ADMIN_PASSWORD` - Default admin password (default: `admin`)
   - `RESET_DB` - Set to `true` to reset database on startup
   - `CREATE_DEMO_DATA` - Set to `true` to populate with demo data

4. **Build and start the containers**
   ```bash
   sudo docker compose up --build
   ```

5. **Access the application**
   - Frontend: http://localhost:5183/frontend
   - Backend API: http://localhost:3010
   - Default login: `admin` / `admin`

### First Run

On first startup, the system will automatically:
- Create the database schema
- Create an admin user with credentials from environment variables
- Set up roles and permissions (Owner, Admin, User)
- Optionally create demo data if `CREATE_DEMO_DATA=true`


## Demo Data (Project Gutenberg)

Generate and seed public-domain books from Project Gutenberg. The workflow downloads EPUBs and covers to a staging area, then distributes them into the final library structure.

### Quick Setup

From the `bundle_docker/` directory, run these three commands in order:

```bash
# 1. Generate books (downloads to staging area: bookminder_server/demo/assets)
docker compose exec bookminder sh -lc \
   'cd /opt/bookminder/bookminder_server && GUTENBERG_DEMO_COUNT=240 GUTENBERG_LANGS=es,en,sv VERBOSE=1 npm run generate-gutenberg-demo'

# 2. Seed database and move files to final structure (bookminder-data/bookminder-data/)
docker compose exec bookminder sh -lc \
   'cd /opt/bookminder/bookminder_server && npm run seed-generated-demo'

# 3. Fetch author profile images from Wikimedia Commons
docker compose exec bookminder sh -lc \
   'cd /opt/bookminder/bookminder_server && npm run seed-authors-images'
```

### Customization

**Book count and languages:**
- `GUTENBERG_DEMO_COUNT` - Number of books to download (default: 200)
- `GUTENBERG_LANGS` - Comma-separated language codes (default: `en`)
- `VERBOSE=1` - Show detailed download progress

**Example with defaults:**
```bash
docker compose exec bookminder sh -lc \
   'cd /opt/bookminder/bookminder_server && npm run generate-gutenberg-demo'
```

### How It Works

1. **Generation**: Downloads books from Project Gutenberg API to `bookminder_server/demo/assets/global/gutenberg/pg####/` (mounted as `/opt/demo-data` in container)
2. **Seeding**: Moves files from staging to final locations:
   - Global libraries → `bookminder-data/bookminder-data/global/<LibraryName>/pg####/`
   - User libraries → `bookminder-data/bookminder-data/user/<username>/<LibraryName>/pg####/`
3. **Author Images**: Downloads author photos from Wikipedia/Wikimedia to `bookminder-data/bookminder-data/meta/authors/`

Books are randomly distributed across 5 global libraries and 5 user libraries for both `admin` and `demo` users.

### Resetting the Database

To start fresh with new demo data:

1. Set `RESET_DB=true` in `bundle_docker/.env.local`

2. Recreate the container (**Note:** `restart` is not sufficient, environment variables require full recreation):
   ```bash
   docker compose down
   docker compose up -d
   ```

3. **Important:** Set `RESET_DB=false` in `.env.local` after the container starts to prevent accidental deletion

4. Run the demo generation commands above


To start fresh with new demo data:

1. Set `RESET_DB=true` in `bundle_docker/.env.local`

2. Recreate the container (**Note:** `restart` is not sufficient, environment variables require full recreation):
   ```bash
   docker compose down
   docker compose up -d
   ```

3. **Important:** Set `RESET_DB=false` in `.env.local` after the container starts to prevent accidental deletion

4. Run the demo generation commands above

## Development

### Running Locally (Without Docker)

#### Backend
```bash
cd bookminder_server
npm install
node server.js
```

#### Frontend
```bash
cd bookminder_vite
npm install
npm run dev
```

## Environment Variables

### Backend (bookminder_server)
- `HOST` - Server host (default: `0.0.0.0`)
- `PORT` - Server port (default: `3010`)
- `ALLOWED_ORIGINS` - CORS allowed origins
- `DB_PATH` - Database file path
- `DB_NAME` - Database filename
- `ADMIN_USERNAME` - Initial admin username
- `ADMIN_PASSWORD` - Initial admin password
- `RESET_DB` - Reset database on startup (`true`/`false`)
- `CREATE_DEMO_DATA` - Create demo data on init (`true`/`false`)

### Frontend (bookminder_vite)
- `VITE_BACKEND_URL` - Backend API URL
- `VITE_HOST` - Dev server host
- `VITE_PORT` - Dev server port
- `VITE_BASE` - Base path for the app
- `VITE_HMR_HOST` - Hot module replacement host
- `VITE_HMR_PORT` - Hot module replacement port
- `VITE_HMR_PROTOCOL` - HMR protocol (`ws` for local, `wss` for production)

## Plugins

The plugin system allows extending Bookminder's functionality. See `bookminder_plugins/` for available plugins.

Each plugin has its own Docker Compose configuration and can be run independently or integrated with the main application.

## Troubleshooting

### Database I/O Errors

If you encounter SQLite I/O errors:
```bash
sudo mkdir -p bundle_docker/bookminder-data/bookminder-data/db
sudo chmod 777 bundle_docker/bookminder-data/bookminder-data/db
```

### CORS Errors

Ensure `ALLOWED_ORIGINS` matches your frontend URL:
- Local: `http://localhost:5183`
- Production: Your domain URL

### Permission Issues

If you encounter permission errors with Docker volumes:
```bash
sudo chown -R $USER:$USER bundle_docker/bookminder-data
```

## License

[Add your license here]

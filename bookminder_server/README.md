# Bookminder

## How to start testing it locally

These steps cold-launch the stack and seed meaningful demo data in a fresh environment.

1) Stop containers and clear any prior demo data (optional)

```
docker compose down
# Manually delete any persisted demo data under your volumes/bind mounts if present
```

2) Enable first-run database setup and demo seeding

Edit your environment file (for docker compose) and set:

```
RESET_DB=true
CREATE_DEMO_DATA=true
```

3) Start the stack

```
docker compose up -d
```

4) Disable DB reset after first boot

Set `RESET_DB=false` in your env file so subsequent restarts do not wipe the DB.

5) Restart containers once to ensure the database is ready

```
docker compose down && docker compose up -d
```

6) Generate a fresh Project Gutenberg demo dataset inside the server container

```
sudo docker compose exec bookminder sh -lc 'cd /opt/bookminder/bookminder_server && GUTENBERG_DEMO_COUNT=40 GUTENBERG_LANGS="es,en,sv" VERBOSE=1 npm run generate-gutenberg-demo'
```

7) Seed author images (portraits/placeholders)

```
sudo docker compose exec bookminder sh -lc 'cd /opt/bookminder/bookminder_server && npm run seed-authors-images'
```

Notes:
- The generator writes JSONs and assets under `/opt/bookminder/bookminder_server/demo/generated` and `/opt/demo-data` (inside the container). The server prefers generated JSONs automatically.
- Demo seeding creates global libraries for both admin and demo; personal libraries differ between users. The demo user gets limited visibility on global libraries (first 3 by default), and explicit permission to edit user libraries so they can manage their own.
- If networking is restricted in the container, author image seeding will still succeed using placeholders.


### Count lines of code

To ignore folders, feed the contents of .clocignore directly to --exclude-dir. For example,

`cloc --exclude-dir=$(tr '\n' ',' < .clocignore) .`

NOTE: Requires having `cloc`, `bash`, and `tr` available.

## Demo assets (Project Gutenberg)

To seed demo libraries with sample EPUBs and covers, first populate the demo assets directory.

Steps:
- Ensure the docker compose mounts `bookminder_server/demo/assets` into `/opt/demo-data` (already configured in `bundle_docker/docker-compose.yaml`).
- Install server deps (inside the container build or locally): this repo adds `fs-extra` and `jimp` for the fetch script.
- Run the fetcher:

Option A: Use tracked demo list (fast):

```
npm run fetch-demo-assets --prefix ./bookminder_server
```

Option B: Generate a fresh random dataset (200 by default) via Gutendex:

```
npm run generate-gutenberg-demo --prefix ./bookminder_server
# Customize:
# GUTENBERG_DEMO_COUNT=240 GUTENBERG_LANGS=es,en,sv VERBOSE=1 npm run generate-gutenberg-demo --prefix ./bookminder_server
```

Optional: set a custom destination directory with `DEMO_ASSETS_DIR=/absolute/path`.

The fast fetcher (Option A) downloads files for entries in `demo/books.json`.
The generator (Option B) creates new JSONs under `demo/generated/` and downloads their assets; `createDemoData.js` prefers those generated files automatically.

After assets are present, set `CREATE_DEMO_DATA=true` and start the stack. On first run (when no libraries exist), demo libraries and books will be created automatically.

### Seeding generated dataset on-demand (no reset)

If your database is already initialized and you want to seed the generated dataset without resetting:

```
npm run seed-generated-demo --prefix ./bookminder_server
```

Notes:
- Seeding prefers `demo/generated/*.json` and falls back to tracked JSONs.
- Books are randomly distributed across global libraries and both users (admin and demo).
- Assets must exist under `bookminder_server/demo/assets` (mounted to `/opt/demo-data`).

### Author image seeding

Enrich authors with portraits from open-license sources when available, falling back to a local placeholder.

- What it does:
	- Queries the `authors` table
	- Tries to fetch a thumbnail from Wikipedia REST (`/page/summary/<AuthorName>`) when available
	- Saves images under `META_LIBRARY_DATA_PATH` as `meta/authors/<authorId>/photo.jpg`
	- Upserts `authors_covers` with `cover_url` and `base_path`
	- Falls back to a generated placeholder `meta/placeholders/author.png` if no image is found

- Run:
	```
	npm run seed-authors-images --prefix ./bookminder_server
	```

- Serving:
	- The server exposes meta assets at `/assets/meta`
	- Clients receive cover URLs like `meta/authors/<id>/photo.jpg`, or `meta/placeholders/author.png`

- Notes:
	- If outbound networking is restricted inside the container, the script completes using placeholders.
	- The placeholder is a simple silhouette generated on first run.
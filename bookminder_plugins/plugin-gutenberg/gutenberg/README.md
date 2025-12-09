# Project Gutenberg Plugin

This plugin provides search functionality for books from Project Gutenberg.

## Prerequisites

Before running this plugin, you must manually download the Project Gutenberg catalog file.

### Download the Catalog

1. Download the catalog file from Project Gutenberg:
   - URL: https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv.gz
   - Or visit: https://www.gutenberg.org/ebooks/offline_catalogs.html

2. Save the file to: `bookminder_plugins/plugin-gutenberg/gutenberg/data/pg_catalog.csv.gz`

   ```bash
   # Create the data directory if it doesn't exist
   mkdir -p bookminder_plugins/plugin-gutenberg/gutenberg/data/
   
   # Download the catalog
   curl -o bookminder_plugins/plugin-gutenberg/gutenberg/data/pg_catalog.csv.gz \
     https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv.gz
   ```

3. The file should be approximately 20MB in size.

## Running the Plugin

Once the catalog file is in place, you can start the plugin using Docker Compose:

```bash
cd bookminder_plugins/plugin-gutenberg
docker-compose up -d
```

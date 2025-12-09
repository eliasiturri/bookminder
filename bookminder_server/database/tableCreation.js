const {db} = require('./database.js');

function createTables() {
    console.log("Creating tables");

    // create a table named "repositories", if it does not exist, with columns "id", "name", "url", "last_checked_ts", and manifest (text)
    //db.exec('CREATE TABLE IF NOT EXISTS repositories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, url TEXT, last_checked_ts INTEGER, manifest TEXT)');

    // create a table named "status", if it does not exist, with columns "id", "status" (text), "provider_id" (references providers.id), "book_id" (references books.id)
    //db.exec('CREATE TABLE IF NOT EXISTS status (id INTEGER PRIMARY KEY AUTOINCREMENT, status TEXT, provider_id INTEGER, book_id INTEGER)');

    // TABLE "users" with index on username
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, email TEXT, role TEXT, uuid TEXT, can_login BOOLEAN)        
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');

    // TABLE "settings" with index on name
    /*db.exec(`
        CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, fallback_value TEXT)
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_settings_name ON settings(name)');*/

    // TABLE "user_settings" with indexes on user_id and setting_id
    /*db.exec(`CREATE TABLE IF NOT EXISTS user_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, setting_id INTEGER, value TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(setting_id) REFERENCES settings(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_user_settings_setting_id ON user_settings(setting_id)');*/

    // TABLE "user_settings" with indexes on user_id and setting_id
    db.exec(`CREATE TABLE IF NOT EXISTS user_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, settings TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)');

    // TABLE "roles" with index on name
    db.exec(`
        CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, can_be_deleted BOOLEAN, is_default BOOLEAN DEFAULT 0)
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name)');

    // TABLE "users_roles" with indexes on user_id and role_id
    db.exec(`
        CREATE TABLE IF NOT EXISTS users_roles (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, role_id INTEGER, is_default BOOLEAN,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(role_id) REFERENCES roles(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_users_roles_user_id ON users_roles(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_users_roles_role_id ON users_roles(role_id)');

   // TABLE "users_actions" with indexes on user_id and action_id
    db.exec(`
        CREATE TABLE IF NOT EXISTS users_actions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, action_id INTEGER, enabled BOOLEAN,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(action_id) REFERENCES actions(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_users_actions_user_id ON users_actions(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_users_actions_action_id ON users_actions(action_id)');

    // TABLE "actions" with index on name
    db.exec(`
        CREATE TABLE IF NOT EXISTS actions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, can_be_deleted BOOLEAN, is_suggested BOOLEAN)
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_actions_name ON actions(name)');

    // TABLE "roles_actions" with indexes on role_id and action_id
    db.exec(`
        CREATE TABLE IF NOT EXISTS roles_actions (id INTEGER PRIMARY KEY AUTOINCREMENT, role_id INTEGER, action_id INTEGER, enabled BOOLEAN, can_be_deleted BOOLEAN,
        FOREIGN KEY(role_id) REFERENCES roles(id),
        FOREIGN KEY(action_id) REFERENCES actions(id))
    `);


    // TABLE "books" with index on title
    db.exec(`
        CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, title_sort TEXT, timestamp INTEGER, pubdate TEXT, series_index TEXT, 
        author_sort TEXT, path TEXT, uuid TEXT, has_cover BOOLEAN, last_modified INTEGER, url TEXT, cover_url TEXT)
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_title ON books(title)');

    // TABLE "authors", with index on name
    db.exec(`
        CREATE TABLE IF NOT EXISTS authors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, sort TEXT, link TEXT, updated INTEGER, created INTEGER)
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name)');

    // TABLE "books_authors" with indexes on book_id and author_id
    db.exec(`
        CREATE TABLE IF NOT EXISTS books_authors (id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER, author_id INTEGER, 
        FOREIGN KEY(book_id) REFERENCES books(id), 
        FOREIGN KEY(author_id) REFERENCES authors(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_authors_book_id ON books_authors(book_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_authors_author_id ON books_authors(author_id)');

    // TABLE "authors_covers" with index on author_id
    db.exec(`
        CREATE TABLE IF NOT EXISTS authors_covers (id INTEGER PRIMARY KEY AUTOINCREMENT, author_id INTEGER, cover_url TEXT, base_path TEXT,
        FOREIGN KEY(author_id) REFERENCES authors(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_authors_covers_author_id ON authors_covers(author_id)');
    // Ensure upsert capability on author_id
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS uniq_authors_covers_author_id ON authors_covers(author_id)');

    // TABLE "languages" with index on name
    db.exec(`
        CREATE TABLE IF NOT EXISTS languages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_languages_name ON languages(name)');

    // TABLE "books_languages" with indexes on book_id and language_id
    db.exec(`
        CREATE TABLE IF NOT EXISTS books_languages (id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER, language_id INTEGER,
        FOREIGN KEY(book_id) REFERENCES books(id),
        FOREIGN KEY(language_id) REFERENCES languages(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_languages_book_id ON books_languages(book_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_languages_language_id ON books_languages(language_id)');

    // TABLE "identifiers" with index on name
    db.exec(`
        CREATE TABLE IF NOT EXISTS identifiers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_identifiers_name ON identifiers(name)');

    // TABLE "books_identifiers" with indexes on book_id and identifier_id
    db.exec(`
        CREATE TABLE IF NOT EXISTS books_identifiers (id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER, identifier_id INTEGER, value TEXT,
        FOREIGN KEY(book_id) REFERENCES books(id),
        FOREIGN KEY(identifier_id) REFERENCES identifiers(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_identifiers_book_id ON books_identifiers(book_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_identifiers_identifier_id ON books_identifiers(identifier_id)');

    // TABLE "publishers" with index on publisher
    db.exec(`
        CREATE TABLE IF NOT EXISTS publishers (id INTEGER PRIMARY KEY AUTOINCREMENT, publisher TEXT)
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_publishers_publisher ON publishers(publisher)');

    // TABLE "books_publishers" with indexes on book_id and publisher_id    
    db.exec(`
        CREATE TABLE IF NOT EXISTS books_publishers (id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER, publisher_id INTEGER,
        FOREIGN KEY(book_id) REFERENCES books(id),
        FOREIGN KEY(publisher_id) REFERENCES publishers(id))        
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_publishers_book_id ON books_publishers(book_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_publishers_publisher_id ON books_publishers(publisher_id)');

    // TABLE "formats"
    db.exec(`
        CREATE TABLE IF NOT EXISTS formats (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, extension TEXT)
    `);

    // TABLE "books_formats" with indexes on book_id and format_id
    db.exec(`
        CREATE TABLE IF NOT EXISTS books_formats (id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER, format_id INTEGER, path TEXT, pubdate TEXT,
        FOREIGN KEY(book_id) REFERENCES books(id),
        FOREIGN KEY(format_id) REFERENCES formats(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_formats_book_id ON books_formats(book_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_formats_format_id ON books_formats(format_id)');

    // TABLE "books_reading" with indexes on book_id and user_id
    db.exec(`
        CREATE TABLE IF NOT EXISTS books_reading (id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER, user_id INTEGER, read_status TEXT, progress TEXT,
        FOREIGN KEY(book_id) REFERENCES books(id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE (book_id, user_id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_reading_book_id ON books_reading(book_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_reading_user_id ON books_reading(user_id)');

    // TABLE "books_covers" with index on book_id
    /*db.exec(`
        CREATE TABLE IF NOT EXISTS books_covers (id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER, cover_url TEXT, provider_url TEXT,
        FOREIGN KEY(book_id) REFERENCES books(id))        
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_covers_book_id ON books_covers(book_id)');*/

    // TABLE "libraries"
    db.exec(`
        CREATE TABLE IF NOT EXISTS libraries (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid TEXT, type TEXT, name TEXT, description TEXT, image_path TEXT, path TEXT)
    `);

    // TABLE "libraries_users" with indexes on library_id and user_id
    db.exec(`
        CREATE TABLE IF NOT EXISTS libraries_users (id INTEGER PRIMARY KEY AUTOINCREMENT, library_id INTEGER, user_id INTEGER, see_enabled BOOLEAN, add_enabled BOOLEAN, delete_enabled BOOLEAN,
        FOREIGN KEY(library_id) REFERENCES libraries(id),
        FOREIGN KEY(user_id) REFERENCES users(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_libraries_users_library_id ON libraries_users(library_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_libraries_users_user_id ON libraries_users(user_id)');

    // TABLE "libraries_folders" with index on library_id, path
    db.exec(`
        CREATE TABLE IF NOT EXISTS libraries_folders (id INTEGER PRIMARY KEY AUTOINCREMENT, library_id INTEGER, path TEXT, base_path TEXT,
        FOREIGN KEY(library_id) REFERENCES libraries(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_libraries_folders_library_id ON libraries_folders(library_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_libraries_folders_path ON libraries_folders(path)');

    // TABLE "books_libraries" with indexes on book_id and library_id
    db.exec(`
        CREATE TABLE IF NOT EXISTS books_libraries (id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER, library_id INTEGER, folder_id INTEGER, path TEXT, added INTEGER, updated INTEGER,
        FOREIGN KEY(book_id) REFERENCES books(id),
        FOREIGN KEY(library_id) REFERENCES libraries(id),
        FOREIGN KEY(folder_id) REFERENCES libraries_folders(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_libraries_book_id ON books_libraries(book_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_books_libraries_library_id ON books_libraries(library_id)');





    // TABLE "last_logins" with index on user_id
    db.exec(`
        CREATE TABLE IF NOT EXISTS last_logins (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, timestamp INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_last_logins_user_id ON last_logins(user_id)');

    // TABLE "files_to_process"
    db.exec(`
        CREATE TABLE IF NOT EXISTS files_to_process (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, library_id INTEGER, folder_id INTEGER, filename TEXT, folder_path TEXT, path TEXT, status TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(library_id) REFERENCES libraries(id),
            FOREIGN KEY(folder_id) REFERENCES libraries_folders(id))
    `);

    // TABLE "access_urls" with index on user_id, token
    db.exec(`
        CREATE TABLE IF NOT EXISTS access_urls (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, token TEXT, timestamp INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_access_urls_user_id ON access_urls(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_access_urls_token ON access_urls(token)');

    // TABLE "plugin_data" with index on user_id, public_uuid
    db.exec(`
        CREATE TABLE IF NOT EXISTS plugin_data (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, public_uuid TEXT, data TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id))
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_plugin_data_user_id ON plugin_data(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_plugin_data_public_uuid ON plugin_data(public_uuid)');

};


module.exports = {
    createTables
};
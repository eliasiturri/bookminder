const insertLibrariesSql = `INSERT INTO libraries (type, image_path, name, description, uuid) VALUES (?, ?, ?, ?, ?);`;
const insertLibrariesFoldersSql = `INSERT INTO libraries_folders (library_id, path, base_path) VALUES (?, ?, ?);`;

const selectLibraryIdByUuidSql = `SELECT id FROM libraries WHERE uuid = ?;`;
const updateLibraryByUuidSql = `UPDATE libraries SET name = ?, description = ? WHERE uuid = ?;`;

const insertLibraryFoldersSql = `INSERT INTO libraries_folders (library_id, path, base_path) VALUES (?, ?, ?);`;
const deleteLibraryByIdSql = `DELETE FROM libraries WHERE id = ?;`;

let getGlobalOrUserLibrariesNoUsernameSql = `
    SELECT l.id, l.name, l.description, l.uuid, 
    CONCAT('meta/libraries/', l.id, '/', l.path) AS image_path, 
    json_group_array(lf.path) as folders,
    (SELECT COUNT(DISTINCT bl.book_id) FROM books_libraries bl WHERE bl.library_id = l.id) as book_count
    FROM libraries as l LEFT JOIN libraries_folders as lf ON l.id = lf.library_id 
    WHERE l.type = ? GROUP BY l.id;
    `;    

let getGlobalOrUserLibrariesByUsernameSql = ` 
    SELECT 
        l.id AS library_id, 
        l.name AS library_name, 
        l.description AS library_description, 
        CONCAT('meta/libraries/', l.id, '/', l.path) AS image_path, 
        COALESCE(lu.see_enabled, 1) AS see_enabled, 
        COALESCE(lu.add_enabled, 1) AS add_enabled, 
        COALESCE(lu.delete_enabled, 0) AS delete_enabled,
        (SELECT COUNT(lf.id) FROM libraries_folders AS lf WHERE lf.library_id = l.id) AS folder_count 
    FROM libraries AS l 
    LEFT JOIN users AS u ON u.username = ?
    LEFT JOIN libraries_users AS lu ON lu.user_id = u.id AND lu.library_id = l.id
    WHERE l.type = ?;
`;

getGlobalOrUserLibrariesByUsernameSql = `
SELECT 
    l.id AS library_id, 
    l.name AS library_name, 
    l.description AS library_description, 
    CONCAT('meta/libraries/', l.id, '/', l.path) AS image_path, 
    COALESCE(lu.see_enabled, 1) AS see_enabled, 
    COALESCE(lu.add_enabled, 1) AS add_enabled, 
    COALESCE(lu.delete_enabled, 0) AS delete_enabled,
    (SELECT COUNT(lf.id) FROM libraries_folders AS lf WHERE lf.library_id = l.id) AS folder_count 
FROM libraries AS l 
LEFT JOIN users AS u ON u.username = ?  -- Find the user based on username
LEFT JOIN libraries_users AS lu 
    ON lu.user_id = u.id AND lu.library_id = l.id  -- Join with existing permissions (may be NULL for new users)
WHERE 
    l.type = ?;  -- Filter by library type (show all libraries of this type, even if user has no explicit permissions)
`;

let getGlobalOrUserLibrariesByUserIdSql = `
SELECT 
    l.id AS library_id, 
    l.uuid,
    l.name AS library_name, 
    l.description AS library_description, 
    CONCAT('meta/libraries/', l.id, '/', l.path) AS image_path, 
    COALESCE(lu.see_enabled, 1) AS see_enabled, 
    COALESCE(lu.add_enabled, 1) AS add_enabled, 
    COALESCE(lu.delete_enabled, 0) AS delete_enabled,
    json_group_array(lf.path) as folders,
    (SELECT COUNT(DISTINCT bl.book_id) FROM books_libraries bl WHERE bl.library_id = l.id) as book_count,
    (SELECT COUNT(lf.id) FROM libraries_folders AS lf WHERE lf.library_id = l.id) AS folder_count 
FROM libraries AS l 
LEFT JOIN users AS u ON u.id = ?  -- Find the user based on username
LEFT JOIN libraries_users AS lu 
    ON lu.user_id = u.id AND lu.library_id = l.id  -- Make sure we only look at libraries the user is associated with
LEFT JOIN libraries_folders AS lf ON l.id = lf.library_id
WHERE 
    l.type = ?  -- Filter by library type
    AND lu.user_id IS NOT NULL  -- Ensure that the user is associated with the library (no NULLs from LEFT JOIN)
GROUP BY l.id;
`;

const selectAllLibrariesByUserIdSql = `
    SELECT l.id AS library_id, l.name AS library_name, 
    CONCAT('meta/libraries/', l.id, '/', l.path) AS image_path, 
    IFNULL(lu.see_enabled, 1) AS see_enabled, IFNULL(lu.add_enabled, 1) AS add_enabled, IFNULL(lu.delete_enabled, 0) AS delete_enabled
    FROM libraries AS l 
    LEFT JOIN libraries_users AS lu ON lu.library_id = l.id AND lu.user_id = ?
    WHERE lu.user_id IS NOT NULL AND lu.see_enabled IS NOT 0
    `;

let selectRecentlyAddedBooksByUsernameAndUserId  = `
        SELECT l.id AS library_id, l.name AS library_name, lf.base_path AS base_path, json_group_array(json_object('id', b.id, 'title', b.title, 'author', 
        (SELECT a.name FROM authors AS a LEFT JOIN books_authors AS ba ON ba.author_id = a.id WHERE ba.book_id = b.id LIMIT 1)
        , 'added', bl.added, 'cover_url', 
        CASE WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', b.cover_url) ELSE CONCAT('user', '/', ?, '/', l.name, '/', b.cover_url) END))
        AS books FROM books AS b
        INNER JOIN books_libraries AS bl ON b.id = bl.book_id
        LEFT JOIN libraries AS l ON l.id = bl.library_id
        LEFT JOIN libraries_folders AS lf ON l.id = lf.library_id
        LEFT JOIN libraries_users AS lu ON lu.user_id = ?
        GROUP BY l.id  
        ORDER BY bl.added DESC
        LIMIT 16;
    `;


// current version
selectRecentlyAddedBooksByUsernameAndUserId = `
SELECT 
    l.id AS library_id, 
    l.name AS library_name, 
    lf.base_path AS base_path, 
    json_group_array(
        DISTINCT json_object(
            'id', b.id, 
            'title', b.title, 
            'author', (
                SELECT a.name 
                FROM authors AS a 
                INNER JOIN books_authors AS ba ON ba.author_id = a.id 
                WHERE ba.book_id = b.id LIMIT 1
            ), 
            'added', bl.added, 
            'cover_url', 
            CASE 
                WHEN b.cover_url LIKE 'global/%' OR b.cover_url LIKE 'user/%' OR b.cover_url LIKE 'meta/%' 
                    THEN b.cover_url 
                WHEN lf.base_path LIKE '%global' 
                    THEN CONCAT('global', '/', l.name, '/', b.cover_url) 
                ELSE CONCAT('user', '/', ?, '/', l.name, '/', b.cover_url) 
            END
        )
    ) AS books 
FROM 
    books AS b
INNER JOIN 
    books_libraries AS bl ON b.id = bl.book_id
LEFT JOIN 
    libraries AS l ON l.id = bl.library_id
LEFT JOIN 
    (SELECT DISTINCT library_id, base_path, path FROM libraries_folders) AS lf ON l.id = lf.library_id
LEFT JOIN 
    libraries_users AS lu ON lu.library_id = l.id AND lu.user_id = ?
WHERE lu.see_enabled IS NOT 0
GROUP BY 
    l.id, lf.base_path  
ORDER BY 
    bl.added DESC
LIMIT 16;
`;

// yet another version

selectRecentlyAddedBooksByUsernameAndUserId = `
-- Recently added across both global and user libraries the user can see
SELECT 
    l.id AS library_id,
    l.name AS library_name,
    lf.base_path AS base_path,
    json_group_array(
        DISTINCT json_object(
            'id', b.id,
            'title', b.title,
            'author', (
                SELECT a.name 
                FROM authors AS a 
                INNER JOIN books_authors AS ba ON ba.author_id = a.id 
                WHERE ba.book_id = b.id LIMIT 1
            ),
            'added', bl.added,
            'cover_url', CASE 
                WHEN b.cover_url LIKE 'global/%' OR b.cover_url LIKE 'user/%' OR b.cover_url LIKE 'meta/%' THEN b.cover_url
                WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', b.cover_url)
                ELSE CONCAT('user', '/', ?, '/', l.name, '/', b.cover_url)
            END,
            'formats', (
                SELECT json_group_array(
                    json_object('id', f.id, 'name', f.name)
                )
                FROM books_formats AS bf
                LEFT JOIN formats AS f ON bf.format_id = f.id
                WHERE bf.book_id = b.id
            )
        )
    ) AS books,
    MAX(COALESCE(bl.added, b.timestamp, 0)) AS latest_added
FROM books AS b
INNER JOIN books_libraries AS bl ON b.id = bl.book_id
INNER JOIN libraries AS l ON l.id = bl.library_id
LEFT JOIN (
    SELECT DISTINCT library_id, base_path, path FROM libraries_folders
) AS lf ON lf.library_id = l.id
LEFT JOIN libraries_users AS lu ON lu.library_id = l.id AND lu.user_id = ?
WHERE (l.type = 'global' OR (lu.user_id = ? AND COALESCE(lu.see_enabled, 0) != 0))
GROUP BY l.id, lf.base_path
ORDER BY latest_added DESC;
`;

const selectReadingBooksByUsernameAndUserId = `
    SELECT json_group_array(
        json_object(
            'id', b.id,
            'title', b.title,
            'author', (
                SELECT a.name
                FROM authors AS a
                INNER JOIN books_authors AS ba ON ba.author_id = a.id
                WHERE ba.book_id = b.id
                LIMIT 1
            ),
            'library_id', bl.library_id,
            'added', NULL,
            'cover_url', CASE 
                WHEN b.cover_url LIKE 'global/%' OR b.cover_url LIKE 'user/%' OR b.cover_url LIKE 'meta/%' THEN b.cover_url
                WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', b.cover_url) 
                ELSE CONCAT('user', '/', ?, '/', l.name, '/', b.cover_url) 
            END,
            'base_path', lf.base_path,
            'formats', (
                SELECT json_group_array(
                    json_object(
                        'id', f.id,
                        'name', f.name
                    )
                )
                FROM books_formats AS bf
                LEFT JOIN formats AS f ON bf.format_id = f.id
                WHERE bf.book_id = b.id
            )
        )
    ) AS books
    FROM (
        SELECT br.book_id, br.rowid AS rorder
        FROM books_reading AS br
        WHERE br.user_id = ? AND br.read_status = 'reading'
        ORDER BY br.rowid DESC
        LIMIT 16
    ) AS recent
    INNER JOIN books AS b ON b.id = recent.book_id
    LEFT JOIN books_libraries AS bl ON b.id = bl.book_id
    LEFT JOIN libraries AS l ON l.id = bl.library_id
    LEFT JOIN (
        SELECT DISTINCT library_id, base_path, path 
        FROM libraries_folders
    ) AS lf ON l.id = lf.library_id
    LEFT JOIN libraries_users AS lu ON lu.library_id = l.id AND lu.user_id = ?
    WHERE lu.see_enabled IS NOT 0
    ORDER BY recent.rorder DESC;
`;

let selectAllBooksByUsernameAndUserIdAndLibraryIdSql = `
    SELECT l.id AS library_id, 
    l.name AS library_name, 
    lf.base_path AS base_path, 
    b.id AS book_id, 
    b.title AS title, 
    (SELECT a.name 
        FROM authors AS a 
        LEFT JOIN books_authors AS ba ON ba.author_id = a.id 
        WHERE ba.book_id = b.id 
        LIMIT 1) AS author,  -- Return one author for each book (first one)
    json_group_array(DISTINCT ba.author_id) AS author_ids,  -- Aggregate unique author_ids for the book
    CASE WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', b.cover_url) ELSE CONCAT('user', '/', ?, '/', l.name, '/', b.cover_url) END AS cover_url
    FROM books AS b
    -- Join to get authors for each book (many-to-many relationship via books_authors)
    LEFT JOIN books_authors AS ba ON b.id = ba.book_id
    -- Join to get the libraries where the books belong
    INNER JOIN books_libraries AS bl ON b.id = bl.book_id
    -- Join to get the library information
    LEFT JOIN libraries AS l ON l.id = bl.library_id
    -- Join to get the folder information (if available)
    LEFT JOIN libraries_folders AS lf ON l.id = lf.library_id
    -- Join to get user permissions 
    LEFT JOIN libraries_users AS lu ON lu.user_id = ?
    -- Ensure user has 'see_enabled' permission for the library
    WHERE lu.see_enabled is not 0 AND l.id = ?
    GROUP BY b.id
    `;

// current version
selectAllBooksByUsernameAndUserIdAndLibraryIdSql = `
    SELECT l.id AS library_id, 
    l.name AS library_name, 
    lf.base_path AS base_path, 
    b.id AS book_id, 
    b.title AS title, 
    (SELECT a.name 
        FROM authors AS a 
        LEFT JOIN books_authors AS ba ON ba.author_id = a.id 
        WHERE ba.book_id = b.id 
        LIMIT 1) AS author,  -- Return one author for each book (first one)
    json_group_array(DISTINCT ba.author_id) AS author_ids,  -- Aggregate unique author_ids for the book
    CASE 
        WHEN b.cover_url LIKE 'global/%' OR b.cover_url LIKE 'user/%' OR b.cover_url LIKE 'meta/%' THEN b.cover_url 
        WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', b.cover_url) 
        ELSE CONCAT('user', '/', ?, '/', l.name, '/', b.cover_url) 
    END AS cover_url,
    json_group_array(
        CASE
            WHEN f.name IS NOT NULL THEN json_object(
                'id', f.id,
                'name', f.name,
                'path',     CASE WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', CASE WHEN bf.path IS NOT NULL AND bf.path != '' THEN CONCAT(bf.path, '/') ELSE '' END, b.path) ELSE CONCAT('user', '/', ?, '/', l.name, '/', CASE WHEN bf.path IS NOT NULL AND bf.path != '' THEN CONCAT(bf.path, '/') ELSE '' END, b.path) END,
                'path_legacy', CASE WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', bf.path) ELSE CONCAT('user', '/', ?, '/', l.name, '/', bf.path) END,
                'pubdate', bf.pubdate
            )
            ELSE NULL
        END
    ) AS formats   
    FROM books AS b
    -- Join to get authors for each book (many-to-many relationship via books_authors)
    LEFT JOIN books_authors AS ba ON b.id = ba.book_id
    -- Join to get the libraries where the books belong
    INNER JOIN books_libraries AS bl ON b.id = bl.book_id
    -- Join to get the library information
    LEFT JOIN libraries AS l ON l.id = bl.library_id
    -- Join to get the folder information (if available)
    LEFT JOIN libraries_folders AS lf ON l.id = lf.library_id
    -- Join to get user permissions 
    LEFT JOIN libraries_users AS lu ON lu.user_id = ?
    LEFT JOIN books_formats AS bf ON bf.book_id = b.id
    LEFT JOIN formats AS f ON bf.format_id = f.id        
    -- Ensure user has 'see_enabled' permission for the library
    WHERE lu.see_enabled is not 0 AND l.id = ?
    GROUP BY b.id;
    `;

let selectAllBooksByUsernameAndUserIdSql = `
    SELECT l.id AS library_id, 
    l.name AS library_name, 
    lf.base_path AS base_path, 
    b.id AS book_id, 
    b.title AS title, 
    (SELECT a.name 
        FROM authors AS a 
        LEFT JOIN books_authors AS ba ON ba.author_id = a.id 
        WHERE ba.book_id = b.id 
        LIMIT 1) AS author,  -- Return one author for each book (first one)
    json_group_array(DISTINCT ba.author_id) AS author_ids,  -- Aggregate unique author_ids for the book
    CASE 
        WHEN b.cover_url LIKE 'global/%' OR b.cover_url LIKE 'user/%' OR b.cover_url LIKE 'meta/%' THEN b.cover_url 
        WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', b.cover_url) 
        ELSE CONCAT('user', '/', ?, '/', l.name, '/', b.cover_url) 
    END AS cover_url
    FROM books AS b
    -- Join to get authors for each book (many-to-many relationship via books_authors)
    LEFT JOIN books_authors AS ba ON b.id = ba.book_id
    -- Join to get the libraries where the books belong
    INNER JOIN books_libraries AS bl ON b.id = bl.book_id
    -- Join to get the library information
    LEFT JOIN libraries AS l ON l.id = bl.library_id
    -- Join to get the folder information (if available)
    LEFT JOIN libraries_folders AS lf ON l.id = lf.library_id
    -- Join to get user permissions 
    LEFT JOIN libraries_users AS lu ON lu.user_id = ?
    -- Ensure user has 'see_enabled' permission for the library
    WHERE lu.see_enabled is not 0
    GROUP BY b.id;
    `;
// current version
selectAllBooksByUsernameAndUserIdSql = `
    SELECT l.id AS library_id, 
    l.name AS library_name, 
    lf.base_path AS base_path, 
    b.id AS book_id, 
    b.title AS title, 
    (SELECT a.name 
        FROM authors AS a 
        LEFT JOIN books_authors AS ba ON ba.author_id = a.id 
        WHERE ba.book_id = b.id 
        LIMIT 1) AS author,  -- Return one author for each book (first one)
    json_group_array(DISTINCT ba.author_id) AS author_ids,  -- Aggregate unique author_ids for the book
    CASE WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', b.cover_url) ELSE CONCAT('user', '/', ?, '/', l.name, '/', b.cover_url) END AS cover_url,
    json_group_array(
        CASE
            WHEN f.name IS NOT NULL THEN json_object(
                'id', f.id,
                'name', f.name,
                'path',     CASE WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', CASE WHEN bf.path IS NOT NULL AND bf.path != '' THEN CONCAT(bf.path, '/') ELSE '' END, b.path) ELSE CONCAT('user', '/', ?, '/', l.name, '/', CASE WHEN bf.path IS NOT NULL AND bf.path != '' THEN CONCAT(bf.path, '/') ELSE '' END, b.path) END,
                'path_legacy', CASE WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', bf.path) ELSE CONCAT('user', '/', ?, '/', l.name, '/', bf.path) END,
                'pubdate', bf.pubdate
            )
            ELSE NULL
        END
    ) AS formats    
    FROM books AS b
    -- Join to get authors for each book (many-to-many relationship via books_authors)
    LEFT JOIN books_authors AS ba ON b.id = ba.book_id
    -- Join to get the libraries where the books belong
    INNER JOIN books_libraries AS bl ON b.id = bl.book_id
    -- Join to get the library information
    LEFT JOIN libraries AS l ON l.id = bl.library_id
    -- Join to get the folder information (if available)
    LEFT JOIN libraries_folders AS lf ON l.id = lf.library_id
    -- Join to get user permissions 
    LEFT JOIN libraries_users AS lu ON lu.user_id = ?
    LEFT JOIN books_formats AS bf ON bf.book_id = b.id
    LEFT JOIN formats AS f ON bf.format_id = f.id    
    -- Ensure user has 'see_enabled' permission for the library
    WHERE lu.see_enabled is not 0
    GROUP BY b.id;
    `;

const selectAllAuthorsSql = `
    SELECT a.id, a.name, ac.base_path,
    CASE 
        WHEN ac.cover_url IS NULL THEN 'meta/placeholders/author.png' 
        WHEN ac.cover_url LIKE 'meta/%' THEN ac.cover_url 
        ELSE CONCAT('meta/', ac.cover_url) 
    END AS cover_url
    FROM authors AS a
    LEFT JOIN authors_covers as ac ON a.id = ac.author_id
    LEFT JOIN books_authors AS ba ON a.id = ba.author_id
    LEFT JOIN libraries_users AS lu ON lu.user_id = ?
    GROUP BY a.id;
    `;
//TODO: THE PATH FOR EACH BOOK FORMAT IS NOT SAVED WHEN SAVING THE BOOK
let selectBookDetailsSql = `
    SELECT 
    b.title, 
    b.title_sort, 
    b.timestamp, 
    b.pubdate, 
    b.has_cover, 
    b.description, 
    CASE 
        WHEN b.cover_url LIKE 'global/%' OR b.cover_url LIKE 'user/%' OR b.cover_url LIKE 'meta/%' THEN b.cover_url
        WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', b.cover_url) 
        ELSE CONCAT('user', '/', ?, '/', l.name, '/', b.cover_url) 
    END AS cover_url,
    lf.base_path AS base_path,
    json_group_array(
        CASE
            WHEN a.id IS NOT NULL THEN json_object(
                'id', a.id,
                'name', a.name,
                'sort', a.sort,
                'cover_url', CASE 
                    WHEN ac.cover_url IS NULL THEN 'meta/placeholders/author.png' 
                    WHEN ac.cover_url LIKE 'meta/%' THEN ac.cover_url 
                    ELSE CONCAT('meta/', ac.cover_url) END,
                'base_path', ac.base_path
            )
            ELSE NULL
        END
    ) AS authors,
    json_group_array(
        CASE
            WHEN i.name IS NOT NULL THEN json_object(
                'key', i.name,
                'value', bi.value
            )
            ELSE NULL
        END
    ) AS identifiers,
    json_group_array(
        CASE
            WHEN f.name IS NOT NULL THEN json_object(
                'id', f.id,
                'name', f.name,
                'path',     CASE WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', CASE WHEN bf.path IS NOT NULL AND bf.path != '' THEN CONCAT(bf.path, '/') ELSE '' END, b.path) ELSE CONCAT('user', '/', ?, '/', l.name, '/', CASE WHEN bf.path IS NOT NULL AND bf.path != '' THEN CONCAT(bf.path, '/') ELSE '' END, b.path) END,
                'path_legacy', CASE WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', bf.path) ELSE CONCAT('user', '/', ?, '/', l.name, '/', bf.path) END,
                'pubdate', bf.pubdate
            )
            ELSE NULL
        END
    ) AS formats
    FROM books AS b
    INNER JOIN books_libraries AS bl ON b.id = bl.book_id
    LEFT JOIN libraries AS l ON l.id = ?
    LEFT JOIN libraries_folders AS lf ON lf.id = bl.folder_id
    LEFT JOIN libraries_users AS lu ON lu.user_id = ?
    LEFT JOIN books_authors AS ba ON ba.book_id = b.id
    LEFT JOIN authors AS a ON ba.author_id = a.id
    LEFT JOIN authors_covers AS ac ON a.id = ac.author_id
    LEFT JOIN books_identifiers AS bi ON bi.book_id = b.id
    LEFT JOIN identifiers AS i ON bi.identifier_id = i.id
    LEFT JOIN books_formats AS bf ON bf.book_id = b.id
    LEFT JOIN formats AS f ON bf.format_id = f.id
    WHERE b.id = ?
    GROUP BY b.id, lf.base_path;
    `;

// last version

selectBookDetailsSql = `
SELECT 
    b.title, 
    b.title_sort, 
    b.timestamp, 
    b.pubdate, 
    b.has_cover, 
    b.description, 
    CASE 
        WHEN b.cover_url LIKE 'global/%' OR b.cover_url LIKE 'user/%' OR b.cover_url LIKE 'meta/%' THEN b.cover_url 
        WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', b.cover_url) 
        ELSE CONCAT('user', '/', ?, '/', l.name, '/', b.cover_url) 
    END AS cover_url,
    lf.base_path AS base_path,
    json_group_array(
        DISTINCT CASE
            WHEN a.id IS NOT NULL THEN json_object(
                'id', a.id,
                'name', a.name,
                'sort', a.sort,
                'cover_url', CASE 
                    WHEN ac.cover_url IS NULL THEN 'meta/placeholders/author.png' 
                    WHEN ac.cover_url LIKE 'meta/%' THEN ac.cover_url 
                    ELSE CONCAT('meta/', ac.cover_url) END,
                'base_path', ac.base_path
            )
            ELSE NULL
        END
    ) AS authors,
    json_group_array(
        DISTINCT CASE
            WHEN i.name IS NOT NULL THEN json_object(
                'key', i.name,
                'value', bi.value
            )
            ELSE NULL
        END
    ) AS identifiers,
    json_group_array(
        DISTINCT CASE
            WHEN f.name IS NOT NULL THEN json_object(
                'id', f.id,
                'name', f.name,
                'path', CASE 
                        WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', CASE WHEN bf.path IS NOT NULL AND bf.path != '' THEN CONCAT(bf.path, '/') ELSE '' END, b.path) 
                        ELSE CONCAT('user', '/', ?, '/', l.name, '/', CASE WHEN bf.path IS NOT NULL AND bf.path != '' THEN CONCAT(bf.path, '/') ELSE '' END, b.path) 
                    END,
                'path_legacy', CASE 
                        WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', bf.path) 
                        ELSE CONCAT('user', '/', ?, '/', l.name, '/', bf.path) 
                    END,
                'pubdate', bf.pubdate
            )
            ELSE NULL
        END
    ) AS formats
FROM books AS b
INNER JOIN books_libraries AS bl ON b.id = bl.book_id
LEFT JOIN libraries AS l ON l.id = ?
LEFT JOIN libraries_folders AS lf ON l.id = lf.library_id
LEFT JOIN libraries_users AS lu ON lu.user_id = ?
LEFT JOIN books_authors AS ba ON ba.book_id = b.id
LEFT JOIN authors AS a ON ba.author_id = a.id
LEFT JOIN authors_covers AS ac ON a.id = ac.author_id
LEFT JOIN books_identifiers AS bi ON bi.book_id = b.id
LEFT JOIN identifiers AS i ON bi.identifier_id = i.id
LEFT JOIN books_formats AS bf ON bf.book_id = b.id
LEFT JOIN formats AS f ON bf.format_id = f.id
WHERE b.id = ?
GROUP BY b.id, lf.base_path;
`;

let selectBookUrlSql = `
    SELECT bp.progress,
    CASE WHEN lf.base_path LIKE '%global' THEN CONCAT('global', '/', l.name, '/', b.path) ELSE CONCAT('user', '/', ?, '/', l.name, '/', b.path) END AS path
    FROM books AS b 
    LEFT JOIN books_reading AS bp ON b.id = bp.book_id
    INNER JOIN books_libraries AS bl ON b.id = bl.book_id
    -- Join to get the library information
    LEFT JOIN libraries AS l ON l.id = bl.library_id
    -- Join to get the folder information (if available)
    LEFT JOIN libraries_folders AS lf ON l.id = lf.library_id
    WHERE b.id = ?; 
    `;

// current working version - fixed to handle empty lf.path
selectBookUrlSql = `
    SELECT bp.progress,
    CASE WHEN lf.base_path LIKE '%global' 
         THEN CONCAT('global', '/', l.name, '/', COALESCE(bf.path, ''), CASE WHEN bf.path IS NOT NULL AND bf.path != '' THEN '/' ELSE '' END, b.path) 
         ELSE CONCAT('user', '/', ?, '/', l.name, '/', COALESCE(bf.path, ''), CASE WHEN bf.path IS NOT NULL AND bf.path != '' THEN '/' ELSE '' END, b.path) END AS path
    FROM books AS b 
    LEFT JOIN books_formats AS bf ON bf.book_id = b.id AND bf.format_id = ?
    LEFT JOIN books_reading AS bp ON b.id = bp.book_id
    INNER JOIN books_libraries AS bl ON b.id = bl.book_id
    LEFT JOIN libraries AS l ON l.id = bl.library_id
    LEFT JOIN libraries_folders AS lf ON lf.library_id = l.id
    WHERE b.id = ?
    `;

const selectBookProgressSql = `
    INSERT INTO books_reading (user_id, book_id, read_status, progress)
    VALUES (?, ?, 'reading', ?)
    ON CONFLICT(book_id, user_id)
    DO UPDATE SET progress = ?, read_status = 'reading';
    `;

const selectLibrariesUsersByLibraryNameAndUsernameSql = `
    SELECT id FROM libraries_users WHERE library_id = (SELECT id FROM libraries WHERE name = ?) AND user_id = (SELECT id FROM users WHERE username = ?);
    `;

const insertIntoLibrariesUsersByLibraryNameAndUserIdAndSeeEnabledDeleteEnabledSql = `
    INSERT INTO libraries_users (library_id, user_id, see_enabled, add_enabled, delete_enabled) VALUES ((SELECT id FROM libraries WHERE name = ?), (SELECT id FROM users WHERE username = ?), ?, ?, ?);
    `;

const updateLibrariesUsersSeeEnabledDeleteEnabledByLibraryNameAndUserNameSql = `
    UPDATE libraries_users SET see_enabled = ?, add_enabled = ?, delete_enabled = ? WHERE library_id = (SELECT id FROM libraries WHERE name = ?) AND user_id = (SELECT id FROM users WHERE username = ?);
    `;

let selectMyLibrariesNyUserIdSql = `
    SELECT l.id, 
        l.name, 
        l.type, 
        CONCAT('meta/libraries/', l.id, '/', l.path) AS image_path, 
        lu.see_enabled, 
        lu.add_enabled, 
        lu.delete_enabled, 
        COALESCE(json_group_array(lf.path), '[]') AS paths,  -- Ensure empty array if no paths
        (SELECT COUNT(lf.id) 
            FROM libraries_folders AS lf 
            WHERE lf.library_id = l.id) AS folder_count 
    FROM libraries AS l 
    LEFT JOIN libraries_folders AS lf ON lf.library_id = l.id    
    LEFT JOIN libraries_users AS lu ON lu.user_id = ?
    GROUP BY l.id, l.name, l.type, l.image_path, lu.see_enabled, lu.add_enabled, lu.delete_enabled;
    `;

// last verions

selectMyLibrariesNyUserIdSql = `
SELECT DISTINCT l.id, 
       l.name, 
       l.type, 
       CONCAT('meta/libraries/', l.id, '/', l.path) AS image_path, 
       lu.see_enabled, 
       lu.add_enabled, 
       lu.delete_enabled, 
       COALESCE(json_group_array(DISTINCT lf.path), '[]') AS paths,  -- Ensure distinct paths to avoid duplication
       (SELECT COUNT(DISTINCT lf.id)  -- Count distinct folders
          FROM libraries_folders AS lf 
          WHERE lf.library_id = l.id) AS folder_count 
FROM libraries AS l 
LEFT JOIN libraries_folders AS lf ON lf.library_id = l.id    
LEFT JOIN libraries_users AS lu ON lu.library_id = l.id
WHERE lu.user_id = ?  AND lu.see_enabled IS NOT 0
GROUP BY l.id, l.name, l.type, l.image_path, lu.see_enabled, lu.add_enabled, lu.delete_enabled;
`;

module.exports = {
    insertLibrariesSql,
    insertLibrariesFoldersSql,
    selectLibraryIdByUuidSql,
    updateLibraryByUuidSql,
    insertLibraryFoldersSql,
    deleteLibraryByIdSql,
    getGlobalOrUserLibrariesNoUsernameSql,
    getGlobalOrUserLibrariesByUsernameSql,
    getGlobalOrUserLibrariesByUserIdSql,
    selectAllLibrariesByUserIdSql,
    selectRecentlyAddedBooksByUsernameAndUserId,
    selectReadingBooksByUsernameAndUserId,
    selectAllBooksByUsernameAndUserIdAndLibraryIdSql,
    selectAllBooksByUsernameAndUserIdSql,
    selectAllAuthorsSql,
    selectBookDetailsSql,
    selectBookUrlSql,
    selectBookProgressSql,
    selectLibrariesUsersByLibraryNameAndUsernameSql,
    insertIntoLibrariesUsersByLibraryNameAndUserIdAndSeeEnabledDeleteEnabledSql,
    updateLibrariesUsersSeeEnabledDeleteEnabledByLibraryNameAndUserNameSql,
    selectMyLibrariesNyUserIdSql
};
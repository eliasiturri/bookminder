var express = require('express');
var router = express.Router();
var db = require('../database/database.js');

// TODO (PLUGINS) refactor all this and deal with it with its plugin



/* GET home page. */
router.get('/allData', async function(req, res, next) {
    // query the table "repositories" and get columns "name", "url", "last_checked_ts" and "added_ts"
    let sql = `SELECT id, name, url, last_checked_ts, added_ts FROM repositories`;
    let results = await new Promise((resolve, reject) => {

        db.prepare(sql).all([], (err, rows) => {
            if (err) {
                console.log(err);
                reject(false);
            } else {
                resolve(rows);
            }
        });
    });
    let response = {
        repositories: results
    };
    res.json(response);
});

/*router.get('/all', (req, res) => {
    console.log("pluginsData", pluginsData)
    console.log("mainPlugins", mainPlugins)
    res.send({ plugins: mainPlugins })
});*/

router.get('/repositories', (req, res) => {
    // return the repositories from the table repositories, but only columns id, name, url, last_checked_ts

    db.preapre('SELECT id, name, url, last_checked_ts FROM repositories', (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error getting repositories');
        }

        res.send({ repositories: rows });
    });

});

async function findAuthorIdsByName(name) {
    // search in the database for the name in the table authors
    let sql = `SELECT id FROM authors WHERE name = ?`;

    let results = db.prepare(sql).all(name);

    return results.map(row => row.id);
}

async function findProviderIdByUrl(url) {
    // search in the database for the url in the table providers
    let sql = `SELECT id FROM providers WHERE url = ?`;

    let results = db.prepare(sql).all(url);



    return results.map(row => row.id);
}

async function findBookIdsByNameAndAuthor(provider_url, title, author) {
    // search in the database for the title in the table books and name in the table authors, related by the table "books_authors" with the columns "book_id" and "author_id" and match also de provider url from the table "providers" related by the table "books_providers" with the columns "book_id" and "provider_id"
    let sql = `SELECT b.id, b.title, a.name as author, p.url as provider_url FROM books b
    JOIN books_authors ba ON b.id = ba.book_id
    JOIN authors a ON ba.author_id = a.id
    JOIN books_providers bp ON b.id = bp.book_id
    JOIN providers p ON bp.provider_id = p.id
    WHERE b.title = ? AND a.name = ?`;

    console.log(title, author);

    let results = db.prepare(sql).all(title, author);
    

    let answer = {
        bookminder_book_id: null,
        provider_book_id: null,
        remaining_ids: []
    }

    // if there is a result with provider_url = "https://bookminder.io", add the bookminder_book_id to the answer.
    // if there is a result with provider_url = provider_url, add the provider_book_id to the answer.
    // if there are other results, add the book_id to the remaining_ids
    results.forEach(row => {
        console.log("ROW IS", row)
        if (row.provider_url === 'https://bookminder.io') {
            answer.bookminder_book_id = row.id;
        } else if (row.provider_url === provider_url) {
            answer.provider_book_id = row.id;
        } else {
            answer.remaining_ids.push(row.id);
        }
    });

    console.log("FIND BOOKS ANSWER IS", answer)

    return answer;
}

router.post('/getExistingStatusBatch', async (req, res) => {
    let urls = req.body.urls;
    let urlsString = urls.map(url => `'${url}'`).join(',');

    let stmt = db.prepare(`SELECT url, 
	(SELECT status FROM books AS books LEFT JOIN books_same_as AS same ON books.id = same.same_as) AS status
FROM books WHERE url IN (${urlsString})`);
    let books = stmt.all();

    res.send(books);
});


router.post('/changeBookStatus', async (req, res) => {
    // get the parameters from the post request "title", "author", "cover_url", "description", "link", "rating", "rating_count", "provider_url"
    const { title, author, cover_url, description, link, rating, rating_count, status_value, provider_url } = req.body;

    // find the book by name and author and provider_url
    let bookIds = await findBookIdsByNameAndAuthor(provider_url, title, author);
    let authorIds = await findAuthorIdsByName(author);

    let authorId = "";
    if (authorIds.length === 0) {
        let result = db.prepare(`INSERT INTO authors (name) VALUES (?)`).run(author);
        authorId = result.lastInsertRowid;
    } else {
        authorId = authorIds[0];
    }

    // if there is a book with provider_url = "https://bookminder.io", or with provider_url = provider_url, update the book status field in the table books

    // get the timestamp as unix epoch in the variable timestamp
    let timestamp = Math.floor(Date.now() / 1000);
    let hasCover = cover_url ? 1 : 0;

    let bookminderBookId = bookIds.bookminder_book_id ? bookIds.bookminder_book_id : null;

    if (bookIds.bookminder_book_id) {
        console.log("bookminder book exists. updating status")
        let bookId = bookIds.bookminder_book_id;
        let sql = `UPDATE books SET status = ?, last_modified = ? WHERE id = ?`;
        db.prepare(sql).run(status_value, timestamp, bookId);
    } else {
        console.log("bookminder book does not exist. inserting new book")
        let providerId = await findProviderIdByUrl('https://bookminder.io');

        let book_result = db.prepare(`INSERT INTO books (title, has_cover, last_modified, status, url) VALUES (?, ?, ?, ?, ?)`).run(title, hasCover, timestamp, status_value, "bookminder_link");
        let bookId = book_result.lastInsertRowid;
        bookminderBookId = bookId;
        if (hasCover) {
            db.prepare(`INSERT INTO books_covers (book_id, cover_url, provider_id) VALUES (?, ?, ?)`).run(bookId, cover_url, providerId);
        }
        result = db.prepare(`INSERT INTO books_authors (book_id, author_id) VALUES (?, ?)`).run(bookId, authorId);
        result = db.prepare(`INSERT INTO books_providers (book_id, provider_id) VALUES (?, ?)`).run(bookId, providerId);

        // insert the description as well in the table "descriptions with provideroid, bookId and description"
        result = db.prepare(`INSERT INTO descriptions (book_id, provider_id, description) VALUES (?, ?, ?)`).run(bookId, providerId, description);
        
    } 
    if (!bookIds.provider_book_id) {
        console.log("provider book does not exist. inserting new book")
        let providerId = await findProviderIdByUrl(provider_url);
        let book_result = db.prepare(`INSERT INTO books (title, has_cover, last_modified, url) VALUES (?, ?, ?, ?)`).run(title, hasCover, timestamp, link);
        let bookId = book_result.lastInsertRowid;
        if (hasCover) {
            db.prepare(`INSERT INTO books_covers (book_id, cover_url, provider_id) VALUES (?, ?, ?)`).run(bookId, cover_url, providerId);
        }
        result = db.prepare(`INSERT INTO books_authors (book_id, author_id) VALUES (?, ?)`).run(bookId, authorId);
        result = db.prepare(`INSERT INTO books_providers (book_id, provider_id) VALUES (?, ?)`).run(bookId, providerId);

        // insert the description as well in the table "descriptions with provideroid, bookId and description"
        result = db.prepare(`INSERT INTO descriptions (book_id, provider_id, description) VALUES (?, ?, ?)`).run(bookId, providerId, description);

        // insert or ignore in "books_same_as" the bookminder_book_id as book_id and the book_id as same_as
        result = db.prepare(`INSERT OR IGNORE INTO books_same_as (book_id, same_as) VALUES (?, ?)`).run(bookminderBookId, bookId);
    }

    res.send('Book status changed');
});


router.post('/addRepository', (req, res) => {
    // get the parameters from the post request "name", "url"
    const { name, url } = req.body;

    // if url does not end with "manifest.json", return an error
    if (!url.endsWith('manifest.json')) {
        return res.status(400).send('Invalid repository url');
    }

    // download the manifest.json file from the url, which should contain the plugin information
    axios.get(url)
        .then(response => {
            // insert the repository in the table repositories

            var result = db.prepare(`INSERT INTO repositories (name, url, manifest) VALUES (?, ?, ?)`).run(name, url, JSON.stringify(response.data));
            if (result.changes === 0) {
                return res.status(500).send('Error inserting repository');
            } else {
                return res.send('Repository inserted');
            }
            
        })
        .catch(error => {
            console.error(error);
            return res.status(500).send('Error getting repository manifest');
        });
});



module.exports = router;
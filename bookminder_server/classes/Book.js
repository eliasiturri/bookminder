const {db} = require('../database/database.js');

class Book {
    constructor(metadata, library_id=null, title=null, authors=null, subjects=null, description=null, 
        identifiers=null, language=null, publisher=null, published=null, cover_url=null, file_path=null, format_path=null, folder_id=null) {
        this.metadata = metadata;
        this.library_id = library_id;
        this.title = title ? title : metadata ? metadata.title : "Unknown";
        this.authors = authors ? authors : metadata ? metadata.authors : "Unknown";
        this.subjects = subjects ? subjects : metadata ? metadata.subjects : [];
        this.description = description ? description : metadata ? metadata.description : "";
        this.identifiers = identifiers ? identifiers : metadata ? metadata.identifiers : null;
        this.language = language ? language : metadata ? metadata.language : "Unknown";
        this.publisher = publisher ? publisher : metadata ? metadata.publisher : "Unknown";
        this.published = published ? published : metadata ? metadata.published : "";
        this.cover_url = cover_url;
        this.has_cover = cover_url ? 1 : 0;
        // books.path (file name within format folder)
        this.path = file_path ? file_path : metadata ? (metadata.path || metadata.book_path) : null;
        // books_formats.path (format folder)
        this.format_path = format_path || null;
        this.folder_id = folder_id;
        this.extension = this.path ? this.path.split('.').pop() : null;
    }

    saveToDatabase() {
        try {
            const transaction = db.transaction(() => {
                let bookId = this.saveBook();
                this.saveBookLibrary(bookId);
                this.saveAuthors(bookId);
                this.saveIdentifiers(bookId);
                this.saveLanguage(bookId);
                this.savePublisher(bookId);
                this.saveFormat(bookId);
            })();
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    saveBook() {
        //console.log("METADATA", this.metadata)
        //console.log("BOOK DATA", this.title, this.description, this.has_cover, this.cover_url, this.path)
        let sql = `INSERT INTO books (title, description, has_cover, cover_url, path) VALUES (?, ?, ?, ?, ?);`;
        let insertResult = db.prepare(sql).run(this.title, this.description, this.has_cover, this.cover_url, this.path);
        return insertResult.lastInsertRowid;
    }

    saveBookLibrary(bookId) {
        let sql = `INSERT INTO books_libraries (book_id, library_id, folder_id, path, added) VALUES (?, ?, ?, ?, ?);`;
        db.prepare(sql).run(bookId, this.library_id, this.folder_id, this.path, Date.now());
    }

    saveAuthors(bookId) {
        this.authors.forEach(author => {
            let authorIdSql = `SELECT id FROM authors WHERE name = ?;`;
            let authorResult = db.prepare(authorIdSql).get(author);
            let authorId;
            if (authorResult) {
                authorId = authorResult.id;
            }
            else {
                let sql = `INSERT INTO authors (name) VALUES (?);`;
                authorId = db.prepare(sql).run(author).lastInsertRowid;
            }
            let sql = `INSERT INTO books_authors (book_id, author_id) VALUES (?, ?);`;
            db.prepare(sql).run(bookId, authorId);
        });
    }

    saveIdentifiers(bookId) {
        if (!this.identifiers) return;
        Object.keys(this.identifiers).forEach(key => {
            let identifier = this.identifiers[key];
            let identifierIdSql = `SELECT id FROM identifiers WHERE name = ?;`;
            let identifierResult = db.prepare(identifierIdSql).get(identifier);
            let identifierId;
            if (identifierResult) {
                identifierId = identifierResult.id;
            } else {
                let sql = `INSERT INTO identifiers (name) VALUES (?);`;
                identifierId = db.prepare(sql).run(identifier).lastInsertRowid;
            }
            let sql = `INSERT INTO books_identifiers (book_id, identifier_id, value) VALUES (?, ?, ?);`;
            db.prepare(sql).run(bookId, identifierId, key);
        });
    }

    saveLanguage(bookId) {
        let languageIdSql = `SELECT id FROM languages WHERE name = ?;`;
        let languageResult = db.prepare(languageIdSql).get(this.language);
        let languageId;
        if (languageResult) {
            languageId = languageResult.id;
        } else {
            let sql = `INSERT INTO languages (name) VALUES (?);`;
            languageId = db.prepare(sql).run(this.language).lastInsertRowid;
        }
        let sql = `INSERT INTO books_languages (book_id, language_id) VALUES (?, ?);`;
        db.prepare(sql).run(bookId, languageId);
    }

    savePublisher(bookId) {
        let publisherIdSql = `SELECT id FROM publishers WHERE publisher = ?;`;
        let publisherResult = db.prepare(publisherIdSql).get(this.publisher);
        let publisherId;
        if (publisherResult) {
            publisherId = publisherResult.id;
        } else {
            let sql = `INSERT INTO publishers (publisher) VALUES (?);`;
            publisherId = db.prepare(sql).run(this.publisher).lastInsertRowid;
        }
        let sql = `INSERT INTO books_publishers (book_id, publisher_id) VALUES (?, ?);`;
        db.prepare(sql).run(bookId, publisherId);
    }

    saveFormat(bookId) {
        let formatSql = `SELECT id FROM formats WHERE extension = ?;`;
        let formatResult = db.prepare(formatSql).get(this.extension);
        let formatId;
        if (formatResult) {
            formatId = formatResult.id;
        } else {
            let sql = `INSERT INTO formats (name, extension) VALUES (?, ?);`;
            formatId = db.prepare(sql).run(this.extension, this.extension).lastInsertRowid;
        }
        // books_formats.path stores the format folder (e.g., "pg12345")
        let sql = `INSERT INTO books_formats (book_id, format_id, path, pubdate) VALUES (?, ?, ?, ?);`;
        db.prepare(sql).run(bookId, formatId, this.format_path, this.published);
    }
}


module.exports = Book;
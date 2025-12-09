#!/usr/bin/env node

/**
 * Audit and fix book database entries
 * - Checks if files referenced in the database actually exist
 * - Removes database entries for missing files
 * - Reports on orphaned files (exist on disk but not in DB)
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.argv[2] || './bookminder-data/bookminder-data/db/db.sqlite3';
const GLOBAL_DATA = process.argv[3] || './bookminder-data/bookminder-data/global';
const USER_DATA = process.argv[4] || './bookminder-data/bookminder-data/user';

console.log('📚 Auditing book database against filesystem...');
console.log(`  DB: ${DB_PATH}`);
console.log(`  Global data: ${GLOBAL_DATA}`);
console.log(`  User data: ${USER_DATA}\n`);

if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database not found!');
    process.exit(1);
}

const db = new Database(DB_PATH);

// Get all books with their paths
const books = db.prepare(`
    SELECT 
        b.id as book_id,
        b.path as book_filename,
        bf.id as format_id,
        bf.path as format_folder,
        l.id as library_id,
        l.name as library_name,
        lf.base_path,
        lf.path as folder_path
    FROM books b
    JOIN books_formats bf ON b.id = bf.book_id
    JOIN books_libraries bl ON b.id = bl.book_id
    JOIN libraries l ON l.id = bl.library_id
    LEFT JOIN libraries_folders lf ON l.id = lf.library_id
    ORDER BY l.name, bf.path, b.path
`).all();

console.log(`📊 Found ${books.length} book entries in database\n`);

let missingCount = 0;
let foundCount = 0;
const entriesToDelete = [];

console.log('🔍 Checking each book...\n');

for (const book of books) {
    const isGlobal = book.base_path && book.base_path.includes('global');
    let bookPath;
    
    if (isGlobal) {
        bookPath = path.join(GLOBAL_DATA, book.library_name);
    } else {
        // For user libraries, find the username directory
        const userDataPath = USER_DATA;
        if (fs.existsSync(userDataPath)) {
            const usernames = fs.readdirSync(userDataPath).filter(f => {
                const fullPath = path.join(userDataPath, f);
                return fs.statSync(fullPath).isDirectory();
            });
            
            if (usernames.length > 0) {
                // Try each username until we find the library
                let found = false;
                for (const username of usernames) {
                    const testPath = path.join(userDataPath, username, book.library_name);
                    if (fs.existsSync(testPath)) {
                        bookPath = testPath;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    // Library directory doesn't exist at all
                    console.log(`⚠️  Library not found: ${book.library_name}`);
                    console.log(`    Book ID: ${book.book_id}, Format ID: ${book.format_id}`);
                    missingCount++;
                    entriesToDelete.push({
                        book_id: book.book_id,
                        format_id: book.format_id,
                        reason: 'library_not_found',
                        path: `user/???/${book.library_name}/${book.format_folder}/${book.book_filename}`
                    });
                    continue;
                }
            }
        }
    }

    if (!bookPath) {
        console.log(`⚠️  Could not determine path for book ID ${book.book_id}`);
        missingCount++;
        entriesToDelete.push({
            book_id: book.book_id,
            format_id: book.format_id,
            reason: 'path_undetermined',
            path: 'unknown'
        });
        continue;
    }

    // Check if the book file exists
    const fullBookPath = path.join(bookPath, book.format_folder || '', book.book_filename);
    
    if (fs.existsSync(fullBookPath)) {
        foundCount++;
        // Silently count valid entries
    } else {
        console.log(`❌ MISSING: ${book.library_name}/${book.format_folder || 'no-folder'}/${book.book_filename}`);
        console.log(`    Expected at: ${fullBookPath}`);
        console.log(`    Book ID: ${book.book_id}, Format ID: ${book.format_id}`);
        missingCount++;
        entriesToDelete.push({
            book_id: book.book_id,
            format_id: book.format_id,
            reason: 'file_not_found',
            path: fullBookPath
        });
    }
}

console.log(`\n📈 Summary:`);
console.log(`  ✅ Valid entries: ${foundCount}`);
console.log(`  ❌ Missing files: ${missingCount}`);

if (entriesToDelete.length > 0) {
    console.log(`\n🗑️  Entries to delete: ${entriesToDelete.length}`);
    console.log('\nDo you want to delete these entries? This will:');
    console.log('  1. Delete from books_formats table');
    console.log('  2. Delete from books table if no other formats exist');
    console.log('  3. Clean up related records (authors, identifiers, etc.)');
    
    // For non-interactive mode, check for --fix flag
    const shouldFix = process.argv.includes('--fix');
    
    if (shouldFix) {
        console.log('\n🔧 --fix flag detected, proceeding with cleanup...\n');
        
        const deleteFormatStmt = db.prepare('DELETE FROM books_formats WHERE id = ?');
        const checkOtherFormatsStmt = db.prepare('SELECT COUNT(*) as count FROM books_formats WHERE book_id = ?');
        const deleteBookStmt = db.prepare('DELETE FROM books WHERE id = ?');
        const deleteBookLibrariesStmt = db.prepare('DELETE FROM books_libraries WHERE book_id = ?');
        const deleteBookAuthorsStmt = db.prepare('DELETE FROM books_authors WHERE book_id = ?');
        const deleteBookIdentifiersStmt = db.prepare('DELETE FROM books_identifiers WHERE book_id = ?');
        const deleteBookReadingStmt = db.prepare('DELETE FROM books_reading WHERE book_id = ?');
        
        let deletedFormats = 0;
        let deletedBooks = 0;
        
        const transaction = db.transaction(() => {
            for (const entry of entriesToDelete) {
                // Delete the format
                deleteFormatStmt.run(entry.format_id);
                deletedFormats++;
                
                // Check if book has other formats
                const result = checkOtherFormatsStmt.get(entry.book_id);
                if (result.count === 0) {
                    // No other formats, delete the book and related records
                    deleteBookLibrariesStmt.run(entry.book_id);
                    deleteBookAuthorsStmt.run(entry.book_id);
                    deleteBookIdentifiersStmt.run(entry.book_id);
                    deleteBookReadingStmt.run(entry.book_id);
                    deleteBookStmt.run(entry.book_id);
                    deletedBooks++;
                    console.log(`  Deleted book ${entry.book_id} and all related records`);
                } else {
                    console.log(`  Deleted format ${entry.format_id} for book ${entry.book_id} (has other formats)`);
                }
            }
        });
        
        try {
            transaction();
            console.log(`\n✅ Cleanup complete!`);
            console.log(`  Deleted ${deletedFormats} format entries`);
            console.log(`  Deleted ${deletedBooks} book entries`);
        } catch (err) {
            console.error('\n❌ Error during cleanup:', err);
            process.exit(1);
        }
    } else {
        console.log('\n💡 Run with --fix flag to delete these entries:');
        console.log(`   node audit-and-fix-books.js [db-path] [global-data] [user-data] --fix`);
        console.log('\nExample entries that would be deleted:');
        entriesToDelete.slice(0, 5).forEach(entry => {
            console.log(`  - Book ID ${entry.book_id}, Format ID ${entry.format_id}`);
            console.log(`    Reason: ${entry.reason}`);
            console.log(`    Path: ${entry.path}`);
        });
        if (entriesToDelete.length > 5) {
            console.log(`  ... and ${entriesToDelete.length - 5} more`);
        }
    }
} else {
    console.log('\n✨ All database entries point to existing files!');
}

db.close();
console.log('\n✅ Done!');

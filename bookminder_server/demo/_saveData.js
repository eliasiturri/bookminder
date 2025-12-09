const {db} = require('../database/database.js');

function saveData() {
    let sql = `SELECT b.id as internal_id, b.title, json_group_array(DISTINCT a.name) as authors,
b."path" as book_path, b.has_cover,b.cover_url as cover_path, lang.name as language_name, f.name as format_name
FROM books b
LEFT JOIN books_libraries bl 
LEFT JOIN books_authors ba ON ba.book_id = b.id 
left join authors a on ba.author_id = a.id
left join books_languages bl2 on bl2.book_id = b.id 
left join languages lang on lang.id = bl2.language_id 
left join books_formats bf on bf.book_id= b.id 
left join formats f on f.id = bf.format_id 
left join books_publishers bp on bp.book_id = b.id 
left join publishers p on bp.publisher_id = p.id
WHERE bl.library_id = 1
group by b.id`;

    let books = db.prepare(sql).all();
    
    // save to a file with name books.json as a string on this same folder
    let fs = require('fs');
    fs.writeFileSync('books.json', JSON.stringify(books));

}

module.exports = saveData;
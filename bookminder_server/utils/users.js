const {db} = require('../database/database.js');
const bcrypt = require('bcrypt');

const createUser = async (username, password) => {
    console.log("Creating user", username, password);
    const hashedPassword = await bcrypt.hash(password, 10);
    let existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
        db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashedPassword, username);
        return true;
    }
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
    return true;
}

if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    createUser(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD)
    console.log("Admin user created")
}

module.exports = createUser;
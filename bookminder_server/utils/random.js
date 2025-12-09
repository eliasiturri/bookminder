const crypto = require('crypto');

function generateRandomString(n) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'; // URL-safe characters
    let randomString = '';

    const bytes = crypto.randomBytes(n);
    
    for (let i = 0; i < n; i++) {
        randomString += characters[bytes[i] % characters.length];
    }

    return randomString;
}

module.exports = {
    generateRandomString: generateRandomString
};
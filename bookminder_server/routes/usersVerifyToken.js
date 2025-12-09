const express = require('express');
const router = express.Router();
const {db} = require('../database/database.js');

const { v4: uuidv4 } = require('uuid');
const { generateRandomString } = require('../utils/random.js');

const bcrypt = require('bcrypt');

// activates the new user given the token and a password
router.post('/from-token', async (req, res) => {

    try {
        // gets the parameters from the POST request body
        const { token, password } = req.body;

        console.log("token:", token);
        console.log("password", password);

        if (!password.trim()) {
            res.status(400).send({ error: 'The password cannot be empty.' });
            return;
        }

        let tokenSql = `SELECT au.user_id FROM access_urls AS au WHERE token = ?;`;
        let tokenResult = db.prepare(tokenSql).get(token);

        if (!tokenResult) {
            res.status(400).send({ error: 'Invalid token.' });
            return;
        }

        let userId = tokenResult.user_id;

        console.log("userId:", userId);

        let sqlUserId = `SELECT id FROM users WHERE id = ?;`;
        let existingUser = db.prepare(sqlUserId).all(userId);

        if (!existingUser) {
            let message = 'No such user. ';
            res.status(400).send({ error: message});
            return;
        }

        const saltRounds = 10;
    
        bcrypt.hash(password, saltRounds, function(err, hash) {
            console.log("userId:", userId);
            let updateSql = `UPDATE users SET password = ?, can_login = 1 WHERE id = ?;`;
            db.prepare(updateSql).run(hash, userId);
            res.json({ message: 'User activated' });    
        });

    } catch (err) {
        console.log("Error:", err);
        res.json({ status: 500, error: err });
    }
});

router.post('/verify-access-token', async function(req, res, next) {
    
    const { token } = req.body;

    let sql = `SELECT au.user_id, au.timestamp, u.username FROM access_urls AS au LEFT JOIN users AS u ON au.user_id = u.id WHERE token = ?;`;

    try {
        let result = db.prepare(sql).get(token);

        if (!result) {
            console.log('Token not found');
            res.status(400).json({ error: 'Token not found' });
            res.end();
            return;
        }
    
        let username = result.username;
        let userId = result.user_id;
        let timestamp = result.timestamp;
    
        let expirationTime = 3000 * 60 * 60 * 1000; // 3000 * 1 hour
        let currentTime = new Date().getTime();
        let expirationDate = timestamp + expirationTime;
    
        if (currentTime > expirationDate) {
            res.status(401).json({ error: 'Token expired' });
        }
    
        let sessionUsername = req.session.username;
    
        if (sessionUsername) {
            req.session.regenerate(function(err) {
                req.session.userId = userId;
                req.session.username = username;
                req.session.save();
            })        
        } else {
            req.session.userId = userId;
            req.session.username = username;
            req.session.save();
        }
    
        res.json({ message: 'Welcome' });
    } catch (err) {
        console.log("Error:", err);
        res.status(401).json({ error: err });
    }
    
});

router.all('*', (req, res, next) => {
    res.status(404).send({ error: 'Invalid URL' });
});

module.exports = router;
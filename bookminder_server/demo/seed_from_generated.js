#!/usr/bin/env node

// Seed the database using the generated Gutenberg dataset without resetting the DB.
// - Uses ./generated/*.json if present
// - Creates/associates libraries, copies assets from /opt/demo-data into /opt/data/*
// - Seeds for admin and demo users

require('../utils/env.js');
const { db } = require('../database/database.js');
const createDemoData = require('./createDemoData.js');

async function getUserIdByUsername(username) {
  const row = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  return row ? row.id : null;
}

async function ensureDemoUser() {
  const demoUsername = process.env.DEMO_USERNAME || 'demo';
  const demoPassword = process.env.DEMO_PASSWORD || 'demo';
  let row = db.prepare('SELECT id FROM users WHERE username = ?').get(demoUsername);
  if (!row) {
    const createUser = require('../utils/users.js');
    await createUser(demoUsername, demoPassword);
    row = db.prepare('SELECT id FROM users WHERE username = ?').get(demoUsername);
  }
  return row.id;
}

async function main() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    let adminId = await getUserIdByUsername(adminUsername);
    if (!adminId) {
      // fallback: first user
      const first = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get();
      adminId = first ? first.id : null;
    }
    if (!adminId) throw new Error('No admin user found');

    const demoId = await ensureDemoUser();

    console.log(`[seed] Seeding global libraries for admin (id=${adminId}) using generated dataset...`);
    await createDemoData('global', adminId, { shuffle: true });

    console.log(`[seed] Seeding admin user libraries (id=${adminId})...`);
    await createDemoData('user', adminId, { userOffset: 80, shuffle: true });

    console.log(`[seed] Seeding demo user libraries (id=${demoId})...`);
    await createDemoData('user', demoId, { userOffset: 0, shuffle: true });

    // Associate global libraries to demo user
    try {
      const globals = db.prepare("SELECT id FROM libraries WHERE type = 'global'").all();
      globals.forEach(gl => {
        const exists = db.prepare('SELECT id FROM libraries_users WHERE library_id = ? AND user_id = ?').get(gl.id, demoId);
        if (!exists) db.prepare('INSERT INTO libraries_users (library_id, user_id, see_enabled, add_enabled, delete_enabled) VALUES (?, ?, 1, 1, 0)').run(gl.id, demoId);
      });
    } catch (e) {
      console.log('Failed to associate globals to demo:', e.message || e);
    }

    console.log('[seed] Completed seeding with generated dataset.');
    process.exit(0);
  } catch (e) {
    console.error('[seed] Failed:', e);
    process.exit(1);
  }
}

main();

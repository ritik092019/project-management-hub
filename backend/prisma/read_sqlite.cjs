const Database = require('../node_modules/better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'dev.db');
const db = new Database(dbPath);

try {
  const projects = db.prepare('SELECT * FROM projects').all();
  console.log(`FOUND ${projects.length} PROJECTS IN LOCAL SQLITE DB:`);
  console.log(JSON.stringify(projects, null, 2));
} catch (e) {
  console.error('Error reading SQLite:', e.message);
}

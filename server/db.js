import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Create path to data/database.sqlite in the root directory
const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');


let dbInstance = null;


export const initDB = async () => {
  if (dbInstance) return dbInstance;


  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });


  // Create tables if they don't exist
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );
  `);


  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      slug TEXT UNIQUE
    );
  `);


  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      discord_id TEXT,
      username TEXT,
      updated_at TEXT,
      project_id INTEGER,
      used_by TEXT,
      used_at TEXT,
      redeemed INTEGER DEFAULT 0,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );
  `);


  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      heading TEXT,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );
  `);


  return dbInstance;
};

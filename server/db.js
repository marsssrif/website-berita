import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import path from "path";
sqlite3.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DB_PATH = path.join(__dirname, "data.sqlite");
export function openDb(){ return new sqlite3.Database(DB_PATH); }
export function run(db, sql, params=[]){ return new Promise((res, rej)=>db.run(sql, params, function(err){ if(err) rej(err); else res(this); })); }
export function get(db, sql, params=[]){ return new Promise((res, rej)=>db.get(sql, params, (err,row)=>{ if(err) rej(err); else res(row); })); }
export function all(db, sql, params=[]){ return new Promise((res, rej)=>db.all(sql, params, (err,rows)=>{ if(err) rej(err); else res(rows); })); }

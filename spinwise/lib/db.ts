import fs from 'node:fs';
import path from 'node:path';

export type UserRow = { id: number; email: string; name: string; pass: string };
export type WheelRow = { id: string; userId: number; name: string; data: string; updatedAt: number };
export interface DB {
  userByEmail(email: string): Promise<UserRow | null>;
  userById(id: number): Promise<UserRow | null>;
  createUser(email: string, name: string, pass: string): Promise<UserRow>;
  listWheels(uid: number): Promise<WheelRow[]>;
  upsertWheel(w: WheelRow): Promise<void>;
  deleteWheel(uid: number, id: string): Promise<void>;
}

// ---- Local dev: JSON file ----
function fileDb(): DB {
  const file = path.join(process.cwd(), '.data', 'dev-db.json');
  type S = { seq: number; users: UserRow[]; wheels: WheelRow[] };
  const read = (): S => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return { seq: 0, users: [], wheels: [] }; } };
  const write = (s: S) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(s)); };
  return {
    async userByEmail(e) { return read().users.find((u) => u.email === e) ?? null; },
    async userById(id) { return read().users.find((u) => u.id === id) ?? null; },
    async createUser(email, name, pass) { const s = read(); const u = { id: ++s.seq, email, name, pass }; s.users.push(u); write(s); return u; },
    async listWheels(uid) { return read().wheels.filter((w) => w.userId === uid).sort((a, b) => b.updatedAt - a.updatedAt); },
    async upsertWheel(w) {
      const s = read(); const i = s.wheels.findIndex((x) => x.id === w.id);
      if (i === -1) s.wheels.push(w); else if (s.wheels[i].userId === w.userId) s.wheels[i] = w;
      write(s);
    },
    async deleteWheel(uid, id) { const s = read(); s.wheels = s.wheels.filter((w) => !(w.id === id && w.userId === uid)); write(s); },
  };
}

// ---- Production: MySQL (Hostinger) ----
async function mysqlDb(url: string): Promise<DB> {
  const mysql = await import('mysql2/promise');
  const pool = mysql.createPool(url);
  await pool.query('CREATE TABLE IF NOT EXISTS users(id INT AUTO_INCREMENT PRIMARY KEY,email VARCHAR(190) NOT NULL UNIQUE,name VARCHAR(80) NOT NULL,pass VARCHAR(255) NOT NULL,created_at BIGINT NOT NULL)');
  await pool.query('CREATE TABLE IF NOT EXISTS wheels(id VARCHAR(40) PRIMARY KEY,user_id INT NOT NULL,name VARCHAR(120) NOT NULL,data MEDIUMTEXT NOT NULL,updated_at BIGINT NOT NULL,INDEX(user_id))');
  const q = async (sql: string, args: unknown[] = []): Promise<any[]> => { const [r]: any = await pool.query(sql, args); return r; };
  return {
    async userByEmail(e) { return (await q('SELECT id,email,name,pass FROM users WHERE email=?', [e]))[0] ?? null; },
    async userById(id) { return (await q('SELECT id,email,name,pass FROM users WHERE id=?', [id]))[0] ?? null; },
    async createUser(email, name, pass) {
      const r: any = await q('INSERT INTO users(email,name,pass,created_at) VALUES(?,?,?,?)', [email, name, pass, Date.now()]);
      return { id: r.insertId, email, name, pass };
    },
    async listWheels(uid) {
      const rows = await q('SELECT id,user_id,name,data,updated_at FROM wheels WHERE user_id=? ORDER BY updated_at DESC', [uid]);
      return rows.map((r) => ({ id: r.id, userId: r.user_id, name: r.name, data: r.data, updatedAt: Number(r.updated_at) }));
    },
    async upsertWheel(w) {
      await q('INSERT INTO wheels(id,user_id,name,data,updated_at) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE name=IF(user_id=VALUES(user_id),VALUES(name),name),data=IF(user_id=VALUES(user_id),VALUES(data),data),updated_at=IF(user_id=VALUES(user_id),VALUES(updated_at),updated_at)',
        [w.id, w.userId, w.name, w.data, w.updatedAt]);
    },
    async deleteWheel(uid, id) { await q('DELETE FROM wheels WHERE id=? AND user_id=?', [id, uid]); },
  };
}

const g = globalThis as unknown as { __db?: Promise<DB> };
export function db(): Promise<DB> {
  if (!g.__db) g.__db = process.env.DATABASE_URL ? mysqlDb(process.env.DATABASE_URL) : Promise.resolve(fileDb());
  return g.__db;
}

import mysql, {
  type ExecuteValues,
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from 'mysql2/promise';

import { config } from '../config/index.js';

let pool: Pool | null = null;
let txConnection: PoolConnection | null = null;

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function parseDatabaseUrl(url: string): DatabaseConfig {
  const parsed = new URL(url);
  const database = parsed.pathname.replace(/^\//, '');
  if (!database) {
    throw new Error('DATABASE_URL must include database name');
  }

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
  };
}

function getPool(): Pool {
  if (!pool) {
    const dbConfig = parseDatabaseUrl(config.databaseUrl);
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      timezone: 'Z',
    });
  }
  return pool;
}

function getExecutor(): Pool | PoolConnection {
  return txConnection ?? getPool();
}

export async function connectMysql(): Promise<void> {
  const connection = await getPool().getConnection();
  connection.release();
}

export async function disconnectMysql(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function query<T extends RowDataPacket>(
  sql: string,
  params: ExecuteValues = [],
): Promise<T[]> {
  const [rows] = await getExecutor().query<T[]>(sql, params);
  return rows;
}

export async function queryOne<T extends RowDataPacket>(
  sql: string,
  params: ExecuteValues = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  params: ExecuteValues = [],
): Promise<ResultSetHeader> {
  const [result] = await getExecutor().execute<ResultSetHeader>(sql, params);
  return result;
}

export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  txConnection = connection;

  try {
    await connection.beginTransaction();
    const result = await fn();
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    txConnection = null;
    connection.release();
  }
}

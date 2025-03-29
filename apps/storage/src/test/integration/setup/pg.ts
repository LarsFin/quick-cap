/**
 * A file to help create ethereal isolated test databases per test to avoid
 * race conditions between tests.
 */

import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

/**
 * Creates a new test database with a unique name and returns the database url
 */
export const createTestDatabase = async (
  baseTestDbUrl: string
): Promise<string> => {
  const pool = createBaseDbPool(baseTestDbUrl);

  const dbName = `test_${uuidv4().replace(/-/g, "_")}`;

  // Create ethereal test database by cloning the base database
  await pool.query(`CREATE DATABASE ${dbName} WITH TEMPLATE base OWNER test`);

  // Close the pool after the database is created
  await pool.end();

  return dbNameToUrl(dbName, baseTestDbUrl);
};

const createBaseDbPool = (baseTestDbUrl: string): Pool => {
  const dbUrl = new URL(baseTestDbUrl);
  const user = dbUrl.username;
  const password = dbUrl.password;
  const host = dbUrl.hostname;
  const port = dbUrl.port;
  const database = dbUrl.pathname.slice(1);

  return new Pool({
    user,
    password,
    host,
    port: parseInt(port),
    database,
  });
};

const dbNameToUrl = (dbName: string, baseTestDbUrl: string): string => {
  const dbUrl = new URL(baseTestDbUrl);
  dbUrl.pathname = `/${dbName}`;
  return dbUrl.toString();
};

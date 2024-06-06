import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

var host: string = "localhost";
var user: string = "admin";
var password: string = "Sa2008";
var database: string = "DBSKINX";
if (process.env.NODE_ENV == "production") {
  host = process.env.DB_SERVER!;
  user = process.env.DB_USER!;
  password = process.env.DB_PASSWORD!;
  database = process.env.DB_NAME!;
}

const sqlConfig: sql.config = {
  server: host,
  user: user,
  password: password,
  database: database,
  options: {
    encrypt: true, // For Azure SQL Server
    trustServerCertificate: true, // Change to false for production
    requestTimeout: 300000, // เพิ่ม timeout เป็น 5 นาที
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export const sqlConnect = async () => {
  try {
    pool = await sql.connect(sqlConfig);
    console.log("Connected to SQL Server");
  } catch (err) {
    console.error("Failed to connect to SQL Server:", err);
    pool = null;
    throw err;
  }
};

export const getSqlPool = () => {
  if (!pool) {
    throw new Error("Pool was not created. Ensure the database is connected.");
  }
  return pool;
};

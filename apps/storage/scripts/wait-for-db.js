const { Pool } = require('pg');

const waitForDb = async (dbUrl, maxAttempts = 5) => {
  const pool = new Pool({
    connectionString: dbUrl,
    connectionTimeoutMillis: 1000,
  });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await pool.query('SELECT 1');
      console.log('Database is ready!');
      await pool.end();
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error('Database connection failed after maximum attempts');
        process.exit(1);
      }
      console.log(`Waiting for database to be ready... (attempt ${attempt}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// Get database URL from command line argument
const dbUrl = process.argv[2];
if (!dbUrl) {
  console.error('Please provide a database URL');
  process.exit(1);
}

waitForDb(dbUrl).catch(error => {
  console.error('Error waiting for database:', error);
  process.exit(1);
}); 

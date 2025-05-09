const { spawn } = require('child_process');
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://test:integration@localhost:5433/base';
const dockerComposeFile = 'docker-compose.integration.yml';

const runCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
};

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

const runIntegrationTests = async () => {
  let exitCode = 0;

  try {
    // Start test postgres instance
    console.log('Starting test postgres instance...');
    await runCommand('docker', ['compose', '-f', dockerComposeFile, 'up', '-d']);

    // Wait for database to be ready
    console.log('Waiting for database to be ready...');
    await waitForDb(databaseUrl);

    // Migrate test database
    console.log('Running database migrations...');
    process.env.DATABASE_URL = databaseUrl;
    await runCommand('npx', ['prisma', 'migrate', 'deploy']);

    // Seed test database
    console.log('Seeding test database...');
    await runCommand('npx', ['prisma', 'db', 'seed']);

    // Run tests
    console.log('Running integration tests...');
    await runCommand('npx', ['jest', '--config', 'jest.config.integration.js', '--runInBand', ...process.argv.slice(2)]);

    console.log('Integration tests completed successfully!');
  } catch (error) {
    console.error('Integration tests failed:', error);
    exitCode = 1;
  } finally {
    // Always clean up the docker containers
    try {
      await runCommand('docker', ['compose', '-f', dockerComposeFile, 'down']);
    } catch (cleanupError) {
      console.error('Failed to clean up docker containers:', cleanupError);
    }
  }

  process.exit(exitCode);
};

runIntegrationTests(); 

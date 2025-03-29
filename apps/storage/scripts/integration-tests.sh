#!/bin/bash

# start test postgres instance
docker compose -f docker-compose.integration.yml up -d

# wait for database to be ready
echo "Waiting for database to be ready..."
node scripts/wait-for-db.js "postgresql://test:integration@localhost:5433/base"

# migrate test database
DATABASE_URL=postgresql://test:integration@localhost:5433/base npx prisma migrate deploy

# run tests
npx jest --config jest.config.integration.js

# capture exit code
exit_code=$?

# stop test postgres instance
docker compose -f docker-compose.integration.yml down

# exit with the exit code of the tests
exit $exit_code

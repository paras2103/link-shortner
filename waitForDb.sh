#!/bin/bash
# wait-for-db.sh

# Define the database connection parameters
HOST=postgres-db
PORT=5432
TIMEOUT=60
INTERVAL=2

# Wait for the database to be available
echo "Waiting for PostgreSQL to be available on $HOST:$PORT"
for i in $(seq 1 $((TIMEOUT / INTERVAL))); do
  if nc -z $HOST $PORT; then
    echo "PostgreSQL is up and running."
    break
  fi
  echo "Waiting..."
  sleep $INTERVAL
done

if ! nc -z $HOST $PORT; then
  echo "Timeout while waiting for PostgreSQL"
  exit 1
fi

# Run the table creation script and then start the app
node ./scripts/createTableIdUrlMapping.js
node index.js

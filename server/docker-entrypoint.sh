#!/bin/sh
set -e

echo "[entrypoint] running database migrations..."
node dist/scripts/migrate.js

echo "[entrypoint] starting server..."
exec node dist/index.js
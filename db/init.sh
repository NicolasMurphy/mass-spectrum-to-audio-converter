#!/bin/bash
set -e

echo "🔄 Initializing mass spectrum database..."
echo "📊 Importing 6.3M records (15-20 minutes expected)"

# Create the user that the dump expects
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER mass_spectrum_db_user WITH SUPERUSER;
    SELECT 'Database and user ready for import';
EOSQL

echo "📥 Starting database import..."

# Start background progress messages
(
    sleep 180  # Wait 3 minutes before first message
    while true; do
        echo "⏳ Still importing... (this is normal, please wait)"
        sleep 180  # Every 3 minutes
    done
) &
PROGRESS_PID=$!

# Import the full database dump (ignore permission errors at the end) (band-aid solution since I forgot to remove permissions when dumping prod db)
echo "Importing full database dump (this may take a few minutes)..."
psql -v ON_ERROR_STOP=0 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" < /docker-entrypoint-initdb.d/mass_spectrum_db.sql

# Kill the progress messages
kill $PROGRESS_PID 2>/dev/null || true

echo "🎉 Database initialization complete!"
echo "Note: Some permission errors at the end are normal and can be ignored"

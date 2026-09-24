DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS repairs;
DROP TABLE IF EXISTS refuels;
DROP TABLE IF EXISTS cars;
DROP TABLE IF EXISTS accounts;

DROP FUNCTION IF EXISTS set_updated_at();

DROP TYPE IF EXISTS ticket_type;
DROP TYPE IF EXISTS repair_type;
DROP TYPE IF EXISTS refuel_fuel;
DROP TYPE IF EXISTS vehicle_fuel;

-- pgcrypto may be shared with other application migrations, so it remains
-- installed when this migration is rolled back.

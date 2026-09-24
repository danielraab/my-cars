CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE vehicle_fuel AS ENUM ('other', 'diesel', 'gasoline', 'electric');
CREATE TYPE refuel_fuel AS ENUM ('normal', 'special', 'other');
CREATE TYPE repair_type AS ENUM ('check', 'service', 'wearing_part', 'crash_repair');
CREATE TYPE ticket_type AS ENUM ('parking', 'velocity', 'other');

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE CHECK (email = lower(email) AND email = btrim(email) AND email <> ''),
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (btrim(type) <> ''),
    make TEXT NOT NULL CHECK (btrim(make) <> ''),
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    fuel vehicle_fuel NOT NULL,
    first_registration DATE NOT NULL,
    license_plate TEXT NOT NULL CHECK (btrim(license_plate) <> ''),
    fin TEXT CHECK (fin IS NULL OR btrim(fin) <> ''),
    is_active BOOLEAN NOT NULL DEFAULT true,
    purchase_date DATE,
    purchase_price NUMERIC CHECK (purchase_price IS NULL OR purchase_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refuels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    station TEXT NOT NULL CHECK (btrim(station) <> ''),
    odometer_reading BIGINT CHECK (odometer_reading IS NULL OR odometer_reading >= 0),
    fuel refuel_fuel NOT NULL,
    liters NUMERIC NOT NULL CHECK (liters > 0),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE repairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    station TEXT NOT NULL CHECK (btrim(station) <> ''),
    odometer_reading BIGINT CHECK (odometer_reading IS NULL OR odometer_reading >= 0),
    type repair_type NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    type ticket_type NOT NULL,
    location TEXT NOT NULL CHECK (btrim(location) <> ''),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_set_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER cars_set_updated_at
    BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER refuels_set_updated_at
    BEFORE UPDATE ON refuels
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER repairs_set_updated_at
    BEFORE UPDATE ON repairs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tickets_set_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX cars_account_created_at_id_idx ON cars (account_id, created_at, id);
CREATE INDEX refuels_car_date_id_idx ON refuels (car_id, date, id);
CREATE INDEX repairs_car_date_id_idx ON repairs (car_id, date, id);
CREATE INDEX tickets_car_date_id_idx ON tickets (car_id, date, id);

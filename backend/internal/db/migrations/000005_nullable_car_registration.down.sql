ALTER TABLE cars
    DROP CONSTRAINT cars_license_plate_not_blank,
    ADD CONSTRAINT cars_license_plate_check CHECK (btrim(license_plate) <> ''),
    ALTER COLUMN first_registration SET NOT NULL,
    ALTER COLUMN license_plate SET NOT NULL;

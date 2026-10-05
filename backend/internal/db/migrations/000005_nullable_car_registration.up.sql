ALTER TABLE cars
    ALTER COLUMN first_registration DROP NOT NULL,
    ALTER COLUMN license_plate DROP NOT NULL,
    DROP CONSTRAINT cars_license_plate_check,
    ADD CONSTRAINT cars_license_plate_not_blank CHECK (license_plate IS NULL OR btrim(license_plate) <> '');

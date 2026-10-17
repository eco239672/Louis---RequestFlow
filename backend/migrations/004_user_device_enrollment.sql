-- The administrator assigns names, roles, departments and phone numbers.
-- A device may only use the role assigned to the user linked to its phone number.
ALTER TABLE app_users
    ALTER COLUMN email DROP NOT NULL,
    ADD COLUMN phone_number varchar(30),
    ADD COLUMN device_id varchar(100),
    ADD COLUMN activated_at_utc timestamptz;

CREATE UNIQUE INDEX app_users_phone_number_unique
    ON app_users (phone_number)
    WHERE phone_number IS NOT NULL;

CREATE UNIQUE INDEX app_users_device_id_unique
    ON app_users (device_id)
    WHERE device_id IS NOT NULL;

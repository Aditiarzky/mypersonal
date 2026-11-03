ALTER TABLE profiles ADD COLUMN name VARCHAR(100) NOT NULL DEFAULT '';

UPDATE profiles
SET name = (SELECT users.name FROM users WHERE users.id = profiles.user_id)
WHERE name = '';

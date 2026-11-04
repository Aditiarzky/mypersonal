PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(1,'0001_initial_schema.sql','2026-11-02 03:23:52');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(2,'0002_project_images.sql','2026-11-03 07:46:54');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(3,'0003_experience_skills.sql','2026-11-03 07:46:54');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(4,'0004_profile_name.sql','2026-11-03 08:03:48');
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(60) NOT NULL
);
INSERT INTO "users" ("id","name","email","password") VALUES(1,'Admin','akusudahpunya7@gmail.com','pbkdf2$600000$j70UQdxHq9EKZDNA_pQopQ$pz8ol3dJty-6TB2NoynJ2A');
CREATE TABLE profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id INTEGER NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  bio TEXT NOT NULL,
  avatar_url TEXT,
  cv_url TEXT,
  location VARCHAR(100), name VARCHAR(100) NOT NULL DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE social_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  profile_id INTEGER NOT NULL,
  platform VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  thumbnail_url TEXT,
  demo_url TEXT,
  source_code_url TEXT,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
, images TEXT);
CREATE TABLE skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  icon_url TEXT
);
CREATE TABLE project_skills (
  project_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  PRIMARY KEY (project_id, skill_id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (skill_id) REFERENCES skills(id)
);
CREATE TABLE experiences (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  company_name VARCHAR(150) NOT NULL,
  role VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT
);
CREATE TABLE blogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE inbox_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  sender_name VARCHAR(100) NOT NULL,
  sender_email VARCHAR(150) NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE experience_skills (
  experience_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  PRIMARY KEY (experience_id, skill_id),
  FOREIGN KEY (experience_id) REFERENCES experiences(id),
  FOREIGN KEY (skill_id) REFERENCES skills(id)
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('d1_migrations',4);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('users',1);

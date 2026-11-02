## Personal Portfolio WEB

## Tech stack

- Sveltekit (front end)
- Hono (backend)
- Rest API JSON
- D1 SQLite Database CLoudflare

## Table

users:
• id integer primary key autoincrement not null PK
• name varchar(100) not null
• email varchar(150) not null Unique
• password varchar(60) not null
profiles:
• id integer primary key autoincrement not null PK
• user_id integer not null Unique FK(users.id)
• title varchar(100) not null
• bio text not null
• avatar_url text null
• cv_url text null
• location varchar(100) null
social_links:
• id integer primary key autoincrement not null PK
• profile_id integer not null FK(profiles.id)
• platform varchar(50) not null
• url text not null
projects:
• id integer primary key autoincrement not null PK
• title varchar(150) not null
• slug varchar(150) not null Unique
• description text not null
• thumbnail_url text null
• demo_url text null
• source_code_url text null
• order_position integer default 0
• created_at timestamp default current_timestamp
skills:
• id integer primary key autoincrement not null PK
• name varchar(50) not null
• category varchar(50) not null
• icon_url text null
project_skills:
• project_id integer not null FK(projects.id)
• skill_id integer not null FK(skills.id)
• Primary Key (project_id, skill_id)
experiences:
• id integer primary key autoincrement not null PK
• company_name varchar(150) not null
• role varchar(100) not null
• start_date date not null
• end_date date null
• description text null
blogs:
• id integer primary key autoincrement not null PK
• title varchar(255) not null
• slug varchar(255) not null Unique
• content text not null
• cover_image_url text null
• status varchar(20) default 'draft'
• created_at timestamp default current_timestamp
inbox_messages:
• id integer primary key autoincrement not null PK
• sender_name varchar(100) not null
• sender_email varchar(150) not null
• subject varchar(200) null
• message text not null
• created_at timestamp default current_timestamp

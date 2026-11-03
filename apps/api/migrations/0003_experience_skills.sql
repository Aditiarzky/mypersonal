CREATE TABLE experience_skills (
  experience_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  PRIMARY KEY (experience_id, skill_id),
  FOREIGN KEY (experience_id) REFERENCES experiences(id),
  FOREIGN KEY (skill_id) REFERENCES skills(id)
);

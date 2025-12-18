-- NEWS / EVENTS
CREATE TABLE news (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  summary VARCHAR(500) DEFAULT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  event_date DATE DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_news_category (category),
  KEY idx_news_event_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- NEWS IMAGES (multiple images per news item)
CREATE TABLE news_images (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  news_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_news_images_news_id (news_id),
  CONSTRAINT fk_news_images_news
    FOREIGN KEY (news_id) REFERENCES news(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- PUBLICATIONS
CREATE TABLE publications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type ENUM('Technical Paper','Research Report','Presentation','Other')
       NOT NULL DEFAULT 'Technical Paper',
  title VARCHAR(255) NOT NULL,
  highlight VARCHAR(255) DEFAULT NULL,
  pub_date DATE DEFAULT NULL,
  authors TEXT DEFAULT NULL,
  abstract TEXT NOT NULL,
  link VARCHAR(500) DEFAULT NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  pdf_path VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_publications_type (type),
  KEY idx_publications_pub_date (pub_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- PROJECTS
CREATE TABLE projects (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  period VARCHAR(20) NOT NULL,
  project_title VARCHAR(255) NOT NULL,
  client VARCHAR(255) DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  summary TEXT NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CAREER / JOBS
CREATE TABLE careers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  job_type VARCHAR(100),
  description TEXT,
  posted_on DATE
);

-- CONTACT MESSAGES (optional storage)
CREATE TABLE contact_messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  subject VARCHAR(255) DEFAULT NULL,
  message TEXT NOT NULL,
  source_page VARCHAR(100) DEFAULT NULL,
  status ENUM('new','in_progress','resolved') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  handled_by INT UNSIGNED DEFAULT NULL,
  handled_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_contact_status (status),
  KEY idx_contact_created_at (created_at),
  KEY idx_contact_handled_by (handled_by),
  CONSTRAINT fk_contact_handled_by
    FOREIGN KEY (handled_by) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- USERS (employees / admin)
CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('employee','admin') NOT NULL DEFAULT 'employee',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login DATETIME DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

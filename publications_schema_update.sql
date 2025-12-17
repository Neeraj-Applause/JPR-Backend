-- Updated Publications Table Schema
-- This includes the missing fields that are used in the application

ALTER TABLE publications 
ADD COLUMN highlight VARCHAR(500) NULL AFTER title,
ADD COLUMN pdf_path VARCHAR(500) NULL AFTER abstract,
ADD COLUMN is_published TINYINT(1) NOT NULL DEFAULT 1 AFTER pdf_path,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER is_published,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Remove the old link column if it exists (replaced by pdf_path)
-- ALTER TABLE publications DROP COLUMN link;

-- Complete schema should be:
/*
CREATE TABLE publications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  highlight VARCHAR(500) NULL,
  journal VARCHAR(255),
  pub_date DATE,
  authors TEXT,
  abstract TEXT,
  pdf_path VARCHAR(500) NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
*/
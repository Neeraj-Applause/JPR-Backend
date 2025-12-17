-- Run this in MySQL Workbench to create the news_images table
USE jpr_db;

-- Create news_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS news_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  news_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Check if table was created successfully
DESCRIBE news_images;

-- Show existing news to verify
SELECT id, title FROM news LIMIT 5;
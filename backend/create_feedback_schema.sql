-- Create database and schema for Feedback project
-- Run this with a user that can create databases (or create DB manually and run the CREATE TABLE part)

CREATE DATABASE IF NOT EXISTS `feedback` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `feedback`;

-- feedbacks table
CREATE TABLE IF NOT EXISTS `feedbacks` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `message` TEXT NOT NULL,
  `rating` TINYINT UNSIGNED DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes
CREATE INDEX IF NOT EXISTS `idx_feedbacks_rating` ON `feedbacks` (`rating`);
CREATE INDEX IF NOT EXISTS `idx_feedbacks_createdAt` ON `feedbacks` (`createdAt`);

-- Optional admin users table (for future auth)
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'admin',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lost & Found System v2 — Database Schema
-- Run this file in MySQL Workbench

CREATE DATABASE IF NOT EXISTS lost_found_db;
USE lost_found_db;

-- ── Table 1: Users ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Users (
    UserID    INT AUTO_INCREMENT PRIMARY KEY,
    Name      VARCHAR(100)  NOT NULL,
    Email     VARCHAR(100)  UNIQUE NOT NULL,
    Password  VARCHAR(255)  NOT NULL,
    Phone     VARCHAR(20)   DEFAULT NULL,
    Role      ENUM('User', 'Admin') DEFAULT 'User',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Table 2: Lost Items ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Lost_Items (
    ItemID       INT AUTO_INCREMENT PRIMARY KEY,
    UserID       INT          NOT NULL,
    ItemName     VARCHAR(100) NOT NULL,
    Category     VARCHAR(50)  NOT NULL,
    Description  TEXT         NOT NULL,
    DateLost     DATE         NOT NULL,
    LocationLost VARCHAR(200) NOT NULL,
    Status       ENUM('Active', 'Recovered') DEFAULT 'Active',
    CreatedAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- ── Table 3: Found Items ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Found_Items (
    ItemID        INT AUTO_INCREMENT PRIMARY KEY,
    UserID        INT          NOT NULL,
    ItemName      VARCHAR(100) NOT NULL,
    Category      VARCHAR(50)  NOT NULL,
    Description   TEXT         NOT NULL,
    DateFound     DATE         NOT NULL,
    LocationFound VARCHAR(200) NOT NULL,
    Status        ENUM('Active', 'Claimed') DEFAULT 'Active',
    CreatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- ── Seed: default admin ────────────────────────────────────────────────────
-- Password: password
INSERT INTO Users (Name, Email, Password, Phone, Role) VALUES
('Admin', 'admin@lostfound.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '03001234567', 'Admin');

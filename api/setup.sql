-- Run this in phpMyAdmin or MySQL CLI to set up the database

CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

CREATE TABLE IF NOT EXISTS inventory (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    itemID    VARCHAR(50)    NOT NULL UNIQUE,
    itemName  VARCHAR(150)   NOT NULL,
    category  VARCHAR(100)   NOT NULL,
    quantity  INT            NOT NULL DEFAULT 0,
    price     DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    supplier  VARCHAR(150)   NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

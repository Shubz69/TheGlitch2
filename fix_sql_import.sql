-- Fixed SQL import - removes problematic cleanup statements
-- Run this in MySQL Workbench after connecting to Railway MySQL

USE railway;

-- Create channel_model table
DROP TABLE IF EXISTS `channel_model`;
CREATE TABLE `channel_model` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL,
  `min_level` int DEFAULT NULL,
  `course_id` bigint DEFAULT NULL,
  `access_level` varchar(255) DEFAULT 'open',
  `hidden` tinyint(1) DEFAULT '0',
  `description` varchar(255) DEFAULT NULL,
  `system_channel` bit(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKm04jqn111q29b19iq65dycjnb` (`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Note: Run the actual SQL files but stop before the cleanup statements
-- Or use the Data Import tool and select "Continue on SQL errors"

-- Run this in MySQL Workbench after connecting to Railway MySQL

USE railway;

-- Create channel_model table
DROP TABLE IF EXISTS `channel_model`;
CREATE TABLE `channel_model` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL,
  `min_level` int DEFAULT NULL,
  `course_id` bigint DEFAULT NULL,
  `access_level` varchar(255) DEFAULT 'open',
  `hidden` tinyint(1) DEFAULT '0',
  `description` varchar(255) DEFAULT NULL,
  `system_channel` bit(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKm04jqn111q29b19iq65dycjnb` (`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Note: Run the actual SQL files but stop before the cleanup statements
-- Or use the Data Import tool and select "Continue on SQL errors"


/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.6.26-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: mycar
-- ------------------------------------------------------
-- Server version	10.6.26-MariaDB-ubu2204
-- Synthetic fixture: fake data in the shape of the real legacy dump.

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;

--
-- Table structure for table `Cars`
--

DROP TABLE IF EXISTS `Cars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Cars` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `carMake` varchar(255) DEFAULT NULL,
  `fuel` varchar(255) DEFAULT NULL,
  `firstRegistration` datetime DEFAULT NULL,
  `licensePlate` varchar(255) DEFAULT NULL,
  `fin` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `purchasePrice` float DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `UserId` bigint(20) unsigned DEFAULT NULL,
  `purchaseDate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `Cars_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Cars`
--

LOCK TABLES `Cars` WRITE;
/*!40000 ALTER TABLE `Cars` DISABLE KEYS */;
INSERT INTO `Cars` VALUES (1,'Golf','Car','VW','Diesel','2003-08-01 00:00:00',NULL,NULL,1,1000,'2023-01-15 23:48:10','2023-01-15 23:48:10',1,NULL),(2,'Octavia','Car','Skoda','Gasoline','2017-06-01 00:00:00','W-12345X','',0,11100.5,'2023-01-17 22:38:32','2023-02-07 14:46:56',1,'2021-10-01 00:00:00'),(3,'Ka','Car','Ford','Diesel',NULL,NULL,NULL,NULL,0,'2024-02-02 17:22:12','2024-02-02 17:22:12',2,NULL);
/*!40000 ALTER TABLE `Cars` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RefreshTokens`
--

DROP TABLE IF EXISTS `RefreshTokens`;
CREATE TABLE `RefreshTokens` (
  `refreshToken` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `validUntil` datetime NOT NULL,
  `initialLogin` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `UserId` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`refreshToken`),
  KEY `UserId` (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

LOCK TABLES `RefreshTokens` WRITE;
INSERT INTO `RefreshTokens` VALUES ('00000000-0000-0000-0000-000000000000','2024-01-01 00:00:00','2023-12-01 00:00:00','2023-12-01 00:00:00',1);
UNLOCK TABLES;

--
-- Table structure for table `Refuels`
--

DROP TABLE IF EXISTS `Refuels`;
CREATE TABLE `Refuels` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `station` varchar(255) NOT NULL,
  `odometerReading` bigint(20) unsigned DEFAULT NULL,
  `fuel` varchar(255) DEFAULT NULL,
  `liter` float DEFAULT NULL,
  `amount` float DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `CarId` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `CarId` (`CarId`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

LOCK TABLES `Refuels` WRITE;
INSERT INTO `Refuels` VALUES (1,'2023-01-16 11:00:00','O\'Neill\'s Fuel',120500,'Normal',45.2,72.31,'2023-01-16 11:05:00','2023-01-16 11:05:00',1),(2,'2023-02-03 12:00:00','Shell',NULL,'Special',30,55.9,'2023-02-03 12:01:00','2023-02-03 12:01:00',2),(3,'2024-02-03 08:30:00','Jet',5000,'Normal',20.5,33,'2024-02-03 08:31:00','2024-02-03 08:31:00',3);
UNLOCK TABLES;

--
-- Table structure for table `Repairs`
--

DROP TABLE IF EXISTS `Repairs`;
CREATE TABLE `Repairs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `station` varchar(255) NOT NULL,
  `odometerReading` bigint(20) unsigned DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `amount` float DEFAULT NULL,
  `description` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `CarId` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `CarId` (`CarId`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

LOCK TABLES `Repairs` WRITE;
INSERT INTO `Repairs` VALUES (1,'2023-03-01 00:00:00','Garage \"Max\"',121000,'Wearing part',250.4,'Brake pads\nfront and rear, C:\\parts','2023-03-01 09:00:00','2023-03-01 09:00:00',1),(2,'2023-05-10 00:00:00','Dealer',NULL,'Service',0,'','2023-05-10 10:00:00','2023-05-10 10:00:00',2);
UNLOCK TABLES;

--
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

LOCK TABLES `SequelizeMeta` WRITE;
INSERT INTO `SequelizeMeta` VALUES ('20221204230207-create-car.js'),('20230115205539-create-refuel.js');
UNLOCK TABLES;

--
-- Table structure for table `Tickets`
--

DROP TABLE IF EXISTS `Tickets`;
CREATE TABLE `Tickets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `amount` float DEFAULT 0,
  `description` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `CarId` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `CarId` (`CarId`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

LOCK TABLES `Tickets` WRITE;
INSERT INTO `Tickets` VALUES (1,'2023-04-01 14:20:00','Velocity','A1 km 12',70,NULL,'2023-04-02 08:00:00','2023-04-02 08:00:00',1),(2,'2024-03-01 10:00:00','Others','Vienna',15,'Toll sticker','2024-03-01 10:10:00','2024-03-01 10:10:00',3);
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
CREATE TABLE `Users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `firstname` varchar(255) DEFAULT '',
  `lastname` varchar(255) DEFAULT '',
  `specialToken` varchar(255) DEFAULT NULL,
  `isVerified` tinyint(1) NOT NULL,
  `hashedPassword` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

LOCK TABLES `Users` WRITE;
INSERT INTO `Users` VALUES (1,' Ada@Example.org ','Ada','Lovelace','SECRET-TOKEN-1',1,'$2b$10$SECRETHASHSECRETHASHSECRETHASHSECRETHASHSECRETHASH1','2023-01-15 23:40:00','2023-01-15 23:40:00'),(2,'grace@example.org',NULL,'','SECRET-TOKEN-2',1,'$2b$10$SECRETHASHSECRETHASHSECRETHASHSECRETHASHSECRETHASH2','2024-02-02 17:20:00','2024-02-02 17:21:00');
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

-- Dump completed on 2026-10-06  1:09:13

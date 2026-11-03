-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 116.193.129.229    Database: priomicro_core
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `mst_org_branch`
--

DROP TABLE IF EXISTS `mst_org_branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_org_branch` (
  `Branch_Id` smallint NOT NULL AUTO_INCREMENT,
  `Org_Id` smallint DEFAULT NULL,
  `Branch_Code` varchar(6) DEFAULT NULL,
  `Bsr_Code` varchar(25) DEFAULT NULL,
  `Branch_Name` varchar(100) DEFAULT NULL,
  `Branch_Address` varchar(200) DEFAULT NULL,
  `Branch_Mobile` varchar(50) DEFAULT NULL,
  `Branch_Mail` varchar(50) DEFAULT NULL,
  `Header_Text` longtext,
  `Is_Head` bit(1) DEFAULT b'0',
  `Is_Active` bit(1) DEFAULT b'1',
  PRIMARY KEY (`Branch_Id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 AVG_ROW_LENGTH=5461;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_org_branch`
--

LOCK TABLES `mst_org_branch` WRITE;
/*!40000 ALTER TABLE `mst_org_branch` DISABLE KEYS */;
INSERT INTO `mst_org_branch` VALUES (1,1,'HO0001',NULL,'Head Office','123 Main Road, Kolkata, West Bengal 700001','987654321','ho@basundhara.local','Basundhara Microfinance - Head Office',_binary '',_binary ''),(2,1,'BR0002',NULL,'Salt Lake Branch','Sector V, Salt Lake, Kolkata 700091','9876543211','saltlake@basundhara.local','Basundhara Microfinance - Salt Lake',_binary '\0',_binary ''),(3,1,'BR0003',NULL,'Howrah Main Branch','Howrah, West Bengal','9876543212','howrah@basundhara.local','Basundhara Microfinance - Howrah',_binary '\0',_binary ''),(4,1,'BR0004',NULL,'Auto Code Branch 2','Test','2525665','priority.info2023@gmail.com',NULL,_binary '\0',_binary '');
/*!40000 ALTER TABLE `mst_org_branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_org_register`
--

DROP TABLE IF EXISTS `mst_org_register`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_org_register` (
  `Org_Id` smallint NOT NULL AUTO_INCREMENT,
  `Org_DispNm` varchar(200) DEFAULT NULL,
  `Legal_Name` varchar(200) DEFAULT NULL,
  `Regd_Address` varchar(250) DEFAULT NULL,
  `HO_Address` varchar(250) DEFAULT NULL,
  `State_Cd` smallint DEFAULT NULL,
  `Phone` varchar(25) DEFAULT NULL,
  `Email` varchar(50) DEFAULT NULL,
  `Website` varchar(75) DEFAULT NULL,
  `CIN_No` varchar(50) DEFAULT NULL,
  `Regd_No` varchar(50) DEFAULT NULL,
  `GST_No` varchar(20) DEFAULT NULL,
  `PAN_No` varchar(15) DEFAULT NULL,
  `TAN_No` varchar(25) DEFAULT NULL,
  `Org_Logo` blob,
  `Org_Schema` varchar(100) DEFAULT NULL,
  `Is_Active` bit(1) DEFAULT NULL,
  PRIMARY KEY (`Org_Id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_org_register`
--

LOCK TABLES `mst_org_register` WRITE;
/*!40000 ALTER TABLE `mst_org_register` DISABLE KEYS */;
INSERT INTO `mst_org_register` VALUES (1,'Basundhara Microfinance','Basundhara Microfinance Pvt Ltd','123 Main Road, Kolkata','123 Main Road, Kolkata',28,'03312345678','info@basundhara.local','https://basundhara.local','U65999WB2020PTC123456','REG-BM-2020','19AAAAA0000A1Z5','AAAAA0000A','CALA12345B',NULL,'priomicro_basundhara',_binary '');
/*!40000 ALTER TABLE `mst_org_register` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_org_user`
--

DROP TABLE IF EXISTS `mst_org_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_org_user` (
  `User_Id` smallint NOT NULL AUTO_INCREMENT,
  `Org_Id` smallint NOT NULL,
  `User_Name` varchar(25) DEFAULT NULL,
  `User_Pass` varchar(150) DEFAULT NULL,
  `User_Phone` varchar(45) DEFAULT NULL,
  `Status` tinyint DEFAULT '1',
  `Created_by` smallint DEFAULT NULL,
  `Created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `mst_org_usercol` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`User_Id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3 AVG_ROW_LENGTH=16384;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_org_user`
--

LOCK TABLES `mst_org_user` WRITE;
/*!40000 ALTER TABLE `mst_org_user` DISABLE KEYS */;
INSERT INTO `mst_org_user` VALUES (1,1,'admin','$2y$12$eZXp60/wEVKwcZq33e0S0O981hNk7/rBM46rh5QwWxg/7kuyUrVwC','7741258963',1,1,'2026-09-18 15:28:09',NULL),(2,1,'demo.user','$2y$12$FYN5HzdEIHsneA4fgB7/jOdvnaiYqYdJlUkr6aZP9Q7G1bPk9j2Fq',NULL,1,1,'2026-09-18 15:28:09',NULL),(3,1,'branch.user','$2y$12$G4YCgy8GOGbAr9ziFNwqSenurM1AnqDXzcBIRQo42638XJHEWb1Tm',NULL,1,1,'2026-09-18 15:28:09',NULL),(4,1,'EMP-0006','$2y$12$1xlBPpxyWYXzAldk0Saq9esXiUyy3YUmttIh2YGKcpHsmaRLKm3VO',NULL,1,1,'2026-09-22 12:25:30',NULL),(6,1,'EMP-SCHEMA-OK','$2y$12$QA/NemVj6I7cC7T4gwZ13en3glfSkHxDS2GfkebyDVjHXKZgiNuN2',NULL,1,1,'2026-09-22 12:48:07',NULL),(7,1,'admin1','$2y$12$r5er9qTOSEU.FOnYxLm8IuktQYFzCHgv2rVrVjyVVFJ224sTn.l1a',NULL,1,1,'2026-09-22 12:48:07',NULL);
/*!40000 ALTER TABLE `mst_org_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_states`
--

DROP TABLE IF EXISTS `mst_states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_states` (
  `State_Cd` smallint NOT NULL AUTO_INCREMENT,
  `State_Name` varchar(75) DEFAULT NULL,
  PRIMARY KEY (`State_Cd`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb3 AVG_ROW_LENGTH=585;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_states`
--

LOCK TABLES `mst_states` WRITE;
/*!40000 ALTER TABLE `mst_states` DISABLE KEYS */;
INSERT INTO `mst_states` VALUES (1,'Andhra Pradesh'),(2,'Arunachal Pradesh'),(3,'Assam'),(4,'Bihar'),(5,'Chhattisgarh'),(6,'Goa'),(7,'Gujarat'),(8,'Haryana'),(9,'Himachal Pradesh'),(10,'Jharkhand'),(11,'Karnataka'),(12,'Kerala'),(13,'Madhya Pradesh'),(14,'Maharashtra'),(15,'Manipur'),(16,'Meghalaya'),(17,'Mizoram'),(18,'Nagaland'),(19,'Odisha'),(20,'Punjab'),(21,'Rajasthan'),(22,'Sikkim'),(23,'Tamil Nadu'),(24,'Telangana'),(25,'Tripura'),(26,'Uttar Pradesh'),(27,'Uttarakhand'),(28,'West Bengal');
/*!40000 ALTER TABLE `mst_states` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_user_login_lock`
--

DROP TABLE IF EXISTS `mst_user_login_lock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_user_login_lock` (
  `User_Id` smallint NOT NULL,
  `Fail_Count` smallint unsigned NOT NULL DEFAULT '0',
  `Locked_Until` datetime DEFAULT NULL,
  `Last_Fail_At` datetime DEFAULT NULL,
  `Last_Reset_Date` date DEFAULT NULL COMMENT 'Date when daily reset last applied',
  `Updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`User_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_user_login_lock`
--

LOCK TABLES `mst_user_login_lock` WRITE;
/*!40000 ALTER TABLE `mst_user_login_lock` DISABLE KEYS */;
INSERT INTO `mst_user_login_lock` VALUES (1,0,NULL,NULL,'2026-10-23','2026-10-23 14:06:33'),(7,0,NULL,NULL,'2026-09-25','2026-09-25 15:10:02');
/*!40000 ALTER TABLE `mst_user_login_lock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mst_user_password_history`
--

DROP TABLE IF EXISTS `mst_user_password_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_user_password_history` (
  `Id` int unsigned NOT NULL AUTO_INCREMENT,
  `User_Id` smallint NOT NULL,
  `Password_Hash` varchar(150) NOT NULL,
  `Created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  KEY `idx_pwd_hist_user` (`User_Id`,`Created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mst_user_password_history`
--

LOCK TABLES `mst_user_password_history` WRITE;
/*!40000 ALTER TABLE `mst_user_password_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `mst_user_password_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'priomicro_core'
--
/*!50003 DROP PROCEDURE IF EXISTS `USP_AUTH_GET_USER_BY_ID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_AUTH_GET_USER_BY_ID`(IN p_user_id SMALLINT)
BEGIN
    SELECT
        u.User_Id,
        u.Org_Id,
        u.User_Name,
        u.User_Pass,
        u.User_Phone,
        u.Status,
        u.Created_by,
        u.Created_at,
        o.Org_DispNm,
        o.Legal_Name,
        o.Org_Schema,
        o.Is_Active AS Org_Is_Active,
        b.Branch_Id,
        b.Branch_Code,
        b.Branch_Name,
        b.Is_Head,
        b.Is_Active AS Branch_Is_Active
    FROM mst_org_user u
    INNER JOIN mst_org_register o ON o.Org_Id = u.Org_Id
    LEFT JOIN mst_org_branch b
        ON b.Org_Id = u.Org_Id
       AND b.Is_Active = 1
       AND b.Branch_Id = (
            SELECT b2.Branch_Id
            FROM mst_org_branch b2
            WHERE b2.Org_Id = u.Org_Id
              AND b2.Is_Active = 1
            ORDER BY b2.Is_Head DESC, b2.Branch_Id ASC
            LIMIT 1
       )
    WHERE u.User_Id = p_user_id
      AND u.Status = 1
      AND o.Is_Active = 1
    LIMIT 1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_AUTH_GET_USER_FOR_LOGIN` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_AUTH_GET_USER_FOR_LOGIN`(IN p_login VARCHAR(100))
BEGIN
    SELECT
        u.User_Id,
        u.Org_Id,
        u.User_Name,
        u.User_Pass,
        u.User_Phone,
        u.Status,
        u.Created_by,
        u.Created_at,
        o.Org_DispNm,
        o.Legal_Name,
        o.Org_Schema,
        o.Is_Active AS Org_Is_Active,
        b.Branch_Id,
        b.Branch_Code,
        b.Branch_Name,
        b.Is_Head,
        b.Is_Active AS Branch_Is_Active
    FROM mst_org_user u
    INNER JOIN mst_org_register o ON o.Org_Id = u.Org_Id
    LEFT JOIN mst_org_branch b
        ON b.Org_Id = u.Org_Id
       AND b.Is_Active = 1
       AND b.Branch_Id = (
            SELECT b2.Branch_Id
            FROM mst_org_branch b2
            WHERE b2.Org_Id = u.Org_Id
              AND b2.Is_Active = 1
            ORDER BY b2.Is_Head DESC, b2.Branch_Id ASC
            LIMIT 1
       )
    WHERE u.User_Name = p_login
      AND u.Status = 1
      AND o.Is_Active = 1
    LIMIT 1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_AUTH_LOGIN_LOCK_CHECK` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_AUTH_LOGIN_LOCK_CHECK`(
    IN p_user_id SMALLINT,
    IN p_daily_reset_time TIME
)
BEGIN
    DECLARE v_fail SMALLINT UNSIGNED DEFAULT 0;
    DECLARE v_locked_until DATETIME DEFAULT NULL;
    DECLARE v_last_reset DATE DEFAULT NULL;
    DECLARE v_today DATE;
    DECLARE v_now DATETIME;
    DECLARE v_reset_today DATETIME;
    DECLARE v_changed TINYINT DEFAULT 0;

    SET v_now = NOW();
    SET v_today = CURDATE();
    SET v_reset_today = TIMESTAMP(v_today, IFNULL(p_daily_reset_time, '00:00:00'));

    SELECT Fail_Count, Locked_Until, Last_Reset_Date
      INTO v_fail, v_locked_until, v_last_reset
    FROM mst_user_login_lock
    WHERE User_Id = p_user_id
    LIMIT 1;

    IF v_fail IS NULL THEN
        SELECT
            p_user_id AS User_Id,
            0 AS Fail_Count,
            NULL AS Locked_Until,
            0 AS Is_Locked,
            0 AS Remaining_Minutes;
    ELSE
        IF v_now >= v_reset_today AND (v_last_reset IS NULL OR v_last_reset < v_today) THEN
            SET v_fail = 0;
            SET v_locked_until = NULL;
            SET v_last_reset = v_today;
            SET v_changed = 1;
        END IF;

        IF v_locked_until IS NOT NULL AND v_locked_until <= v_now THEN
            SET v_locked_until = NULL;
            SET v_fail = 0;
            SET v_changed = 1;
        END IF;

        IF v_changed = 1 THEN
            UPDATE mst_user_login_lock
            SET Fail_Count = v_fail,
                Locked_Until = v_locked_until,
                Last_Reset_Date = v_last_reset,
                Updated_at = v_now
            WHERE User_Id = p_user_id;
        END IF;

        SELECT
            p_user_id AS User_Id,
            v_fail AS Fail_Count,
            v_locked_until AS Locked_Until,
            IF(v_locked_until IS NOT NULL AND v_locked_until > v_now, 1, 0) AS Is_Locked,
            IF(v_locked_until IS NOT NULL AND v_locked_until > v_now,
               GREATEST(0, TIMESTAMPDIFF(MINUTE, v_now, v_locked_until)), 0) AS Remaining_Minutes;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_AUTH_LOGIN_LOCK_CLEAR` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_AUTH_LOGIN_LOCK_CLEAR`(IN p_user_id SMALLINT)
BEGIN
    INSERT INTO mst_user_login_lock (User_Id, Fail_Count, Locked_Until, Last_Fail_At, Last_Reset_Date)
    VALUES (p_user_id, 0, NULL, NULL, CURDATE())
    ON DUPLICATE KEY UPDATE
        Fail_Count = 0,
        Locked_Until = NULL,
        Last_Fail_At = NULL,
        Last_Reset_Date = CURDATE(),
        Updated_at = NOW();

    SELECT p_user_id AS User_Id, 0 AS Fail_Count, NULL AS Locked_Until, 0 AS Is_Locked;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_AUTH_LOGIN_LOCK_FAIL` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_AUTH_LOGIN_LOCK_FAIL`(
    IN p_user_id SMALLINT,
    IN p_max_attempts SMALLINT UNSIGNED,
    IN p_lock_minutes SMALLINT UNSIGNED,
    IN p_daily_reset_time TIME
)
BEGIN
    DECLARE v_fail SMALLINT UNSIGNED DEFAULT 0;
    DECLARE v_locked_until DATETIME DEFAULT NULL;
    DECLARE v_last_reset DATE DEFAULT NULL;
    DECLARE v_today DATE;
    DECLARE v_now DATETIME;
    DECLARE v_reset_today DATETIME;

    SET v_now = NOW();
    SET v_today = CURDATE();
    SET v_reset_today = TIMESTAMP(v_today, IFNULL(p_daily_reset_time, '00:00:00'));

    SELECT Fail_Count, Locked_Until, Last_Reset_Date
      INTO v_fail, v_locked_until, v_last_reset
    FROM mst_user_login_lock
    WHERE User_Id = p_user_id
    LIMIT 1;

    IF v_fail IS NULL THEN
        SET v_fail = 0;
        SET v_locked_until = NULL;
        SET v_last_reset = NULL;
    END IF;

    
    IF v_now >= v_reset_today AND (v_last_reset IS NULL OR v_last_reset < v_today) THEN
        SET v_fail = 0;
        SET v_locked_until = NULL;
        SET v_last_reset = v_today;
    END IF;

    
    IF v_locked_until IS NOT NULL AND v_locked_until > v_now THEN
        SELECT
            p_user_id AS User_Id,
            v_fail AS Fail_Count,
            v_locked_until AS Locked_Until,
            1 AS Is_Locked,
            GREATEST(0, TIMESTAMPDIFF(MINUTE, v_now, v_locked_until)) AS Remaining_Minutes;
    ELSE
        IF v_locked_until IS NOT NULL AND v_locked_until <= v_now THEN
            SET v_locked_until = NULL;
            SET v_fail = 0;
        END IF;

        SET v_fail = v_fail + 1;

        IF v_fail >= IFNULL(p_max_attempts, 5) THEN
            SET v_locked_until = DATE_ADD(v_now, INTERVAL IFNULL(p_lock_minutes, 15) MINUTE);
        END IF;

        INSERT INTO mst_user_login_lock (User_Id, Fail_Count, Locked_Until, Last_Fail_At, Last_Reset_Date)
        VALUES (p_user_id, v_fail, v_locked_until, v_now, IFNULL(v_last_reset, v_today))
        ON DUPLICATE KEY UPDATE
            Fail_Count = v_fail,
            Locked_Until = v_locked_until,
            Last_Fail_At = v_now,
            Last_Reset_Date = IFNULL(v_last_reset, v_today),
            Updated_at = v_now;

        SELECT
            p_user_id AS User_Id,
            v_fail AS Fail_Count,
            v_locked_until AS Locked_Until,
            IF(v_locked_until IS NOT NULL AND v_locked_until > v_now, 1, 0) AS Is_Locked,
            IF(v_locked_until IS NOT NULL AND v_locked_until > v_now,
               GREATEST(0, TIMESTAMPDIFF(MINUTE, v_now, v_locked_until)), 0) AS Remaining_Minutes;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_AUTH_LOGIN_LOCK_GET` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_AUTH_LOGIN_LOCK_GET`(IN p_user_id SMALLINT)
BEGIN
    SELECT
        User_Id,
        Fail_Count,
        Locked_Until,
        Last_Fail_At,
        Last_Reset_Date,
        Updated_at
    FROM mst_user_login_lock
    WHERE User_Id = p_user_id
    LIMIT 1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_AUTH_UPDATE_LOGIN_STATUS` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_AUTH_UPDATE_LOGIN_STATUS`(
    IN p_user_id SMALLINT,
    IN p_status VARCHAR(10)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists
    FROM mst_org_user
    WHERE User_Id = p_user_id
      AND Status = 1;

    IF v_exists = 0 THEN
        SELECT 'ERROR' AS status, p_user_id AS user_id, 'User not found or inactive' AS message;
    ELSE
        SELECT 'SUCCESS' AS status, p_user_id AS user_id, 'OK' AS message;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_BRANCH_ADD_EDIT` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_BRANCH_ADD_EDIT`(
    IN p_action VARCHAR(10),
    IN p_branch_id SMALLINT,
    IN p_org_id SMALLINT,
    IN p_branch_code VARCHAR(6),
    IN p_branch_name VARCHAR(100),
    IN p_branch_address VARCHAR(200),
    IN p_branch_mobile VARCHAR(50),
    IN p_branch_mail VARCHAR(50),
    IN p_header_text LONGTEXT,
    IN p_is_head TINYINT,
    IN p_is_active TINYINT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_org_ok INT DEFAULT 0;
    DECLARE v_dup INT DEFAULT 0;
    DECLARE v_code VARCHAR(6);
    DECLARE v_name VARCHAR(100);
    DECLARE v_new_id SMALLINT DEFAULT NULL;
    DECLARE v_is_head TINYINT DEFAULT 0;
    DECLARE v_is_active TINYINT DEFAULT 1;
    DECLARE v_org_id SMALLINT DEFAULT NULL;

    SET v_code = NULLIF(TRIM(p_branch_code), '');
    SET v_name = NULLIF(TRIM(p_branch_name), '');
    SET v_is_head = IFNULL(p_is_head, 0);
    SET v_is_active = IFNULL(p_is_active, 1);

    IF UPPER(p_action) = 'ADD' THEN
        IF p_org_id IS NULL THEN
            SELECT 'ERROR' AS status, NULL AS branch_id, 'Organization is required' AS message;
        ELSEIF v_code IS NULL THEN
            SELECT 'ERROR' AS status, NULL AS branch_id, 'Branch code is required' AS message;
        ELSEIF CHAR_LENGTH(v_code) > 6 THEN
            SELECT 'ERROR' AS status, NULL AS branch_id, 'Branch code max length is 6' AS message;
        ELSEIF v_name IS NULL THEN
            SELECT 'ERROR' AS status, NULL AS branch_id, 'Branch name is required' AS message;
        ELSE
            SELECT COUNT(*) INTO v_org_ok
            FROM mst_org_register
            WHERE Org_Id = p_org_id
              AND CAST(Is_Active AS UNSIGNED) = 1;

            IF v_org_ok = 0 THEN
                SELECT 'ERROR' AS status, NULL AS branch_id, 'Organization not found or inactive' AS message;
            ELSE
                SELECT COUNT(*) INTO v_dup
                FROM mst_org_branch
                WHERE Org_Id = p_org_id
                  AND UPPER(Branch_Code) = UPPER(v_code);

                IF v_dup > 0 THEN
                    SELECT 'ERROR' AS status, NULL AS branch_id, 'Branch code already exists' AS message;
                ELSE
                    IF v_is_head = 1 THEN
                        UPDATE mst_org_branch
                        SET Is_Head = 0
                        WHERE Org_Id = p_org_id;
                    END IF;

                    INSERT INTO mst_org_branch (
                        Org_Id, Branch_Code, Branch_Name, Branch_Address,
                        Branch_Mobile, Branch_Mail, Header_Text, Is_Head, Is_Active
                    ) VALUES (
                        p_org_id,
                        v_code,
                        v_name,
                        NULLIF(TRIM(p_branch_address), ''),
                        NULLIF(TRIM(p_branch_mobile), ''),
                        NULLIF(TRIM(p_branch_mail), ''),
                        NULLIF(TRIM(p_header_text), ''),
                        v_is_head,
                        v_is_active
                    );

                    SET v_new_id = LAST_INSERT_ID();
                    SELECT 'SUCCESS' AS status, v_new_id AS branch_id, 'Branch created successfully' AS message;
                END IF;
            END IF;
        END IF;

    ELSEIF UPPER(p_action) = 'EDIT' THEN
        SELECT Org_Id INTO v_org_id
        FROM mst_org_branch
        WHERE Branch_Id = p_branch_id
          AND (p_org_id IS NULL OR Org_Id = p_org_id)
        LIMIT 1;

        IF v_org_id IS NULL THEN
            SELECT 'ERROR' AS status, p_branch_id AS branch_id, 'Branch not found' AS message;
        ELSEIF v_code IS NULL THEN
            SELECT 'ERROR' AS status, p_branch_id AS branch_id, 'Branch code is required' AS message;
        ELSEIF CHAR_LENGTH(v_code) > 6 THEN
            SELECT 'ERROR' AS status, p_branch_id AS branch_id, 'Branch code max length is 6' AS message;
        ELSEIF v_name IS NULL THEN
            SELECT 'ERROR' AS status, p_branch_id AS branch_id, 'Branch name is required' AS message;
        ELSE
            SELECT COUNT(*) INTO v_dup
            FROM mst_org_branch
            WHERE Org_Id = v_org_id
              AND UPPER(Branch_Code) = UPPER(v_code)
              AND Branch_Id <> p_branch_id;

            IF v_dup > 0 THEN
                SELECT 'ERROR' AS status, p_branch_id AS branch_id, 'Branch code already exists' AS message;
            ELSE
                IF v_is_head = 1 THEN
                    UPDATE mst_org_branch
                    SET Is_Head = 0
                    WHERE Org_Id = v_org_id
                      AND Branch_Id <> p_branch_id;
                END IF;

                UPDATE mst_org_branch
                SET
                    Branch_Code = v_code,
                    Branch_Name = v_name,
                    Branch_Address = NULLIF(TRIM(p_branch_address), ''),
                    Branch_Mobile = NULLIF(TRIM(p_branch_mobile), ''),
                    Branch_Mail = NULLIF(TRIM(p_branch_mail), ''),
                    Header_Text = NULLIF(TRIM(p_header_text), ''),
                    Is_Head = v_is_head,
                    Is_Active = v_is_active
                WHERE Branch_Id = p_branch_id;

                SELECT 'SUCCESS' AS status, p_branch_id AS branch_id, 'Branch updated successfully' AS message;
            END IF;
        END IF;

    ELSE
        SELECT 'ERROR' AS status, p_branch_id AS branch_id, 'Invalid action. Use ADD or EDIT' AS message;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_BRANCH_LIST` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_BRANCH_LIST`(
    IN p_org_id SMALLINT,
    IN p_branch_id SMALLINT,
    IN p_keyword VARCHAR(100),
    IN p_is_head TINYINT,
    IN p_is_active TINYINT,
    IN p_page INT,
    IN p_per_page INT
)
BEGIN
    DECLARE v_page INT DEFAULT 1;
    DECLARE v_per_page INT DEFAULT 50;
    DECLARE v_offset INT DEFAULT 0;
    DECLARE v_total INT DEFAULT 0;

    SET v_page = GREATEST(IFNULL(p_page, 1), 1);
    SET v_per_page = LEAST(GREATEST(IFNULL(p_per_page, 50), 1), 200);
    SET v_offset = (v_page - 1) * v_per_page;

    SELECT COUNT(*) INTO v_total
    FROM mst_org_branch b
    WHERE (p_org_id IS NULL OR b.Org_Id = p_org_id)
      AND (p_branch_id IS NULL OR b.Branch_Id = p_branch_id)
      AND (
          p_keyword IS NULL
          OR p_keyword = ''
          OR b.Branch_Name LIKE CONCAT('%', p_keyword, '%')
          OR b.Branch_Code LIKE CONCAT('%', p_keyword, '%')
          OR b.Branch_Address LIKE CONCAT('%', p_keyword, '%')
      )
      AND (p_is_head IS NULL OR CAST(b.Is_Head AS UNSIGNED) = p_is_head)
      AND (p_is_active IS NULL OR CAST(b.Is_Active AS UNSIGNED) = p_is_active);

    SELECT
        v_total AS total,
        v_page AS page,
        v_per_page AS per_page,
        CASE
            WHEN v_total = 0 THEN 1
            ELSE CEIL(v_total / v_per_page)
        END AS last_page;

    SELECT
        b.Branch_Id,
        b.Org_Id,
        b.Branch_Code,
        b.Branch_Name,
        b.Branch_Address,
        b.Branch_Mobile,
        b.Branch_Mail,
        b.Header_Text,
        CAST(b.Is_Head AS UNSIGNED) AS Is_Head,
        CAST(b.Is_Active AS UNSIGNED) AS Is_Active
    FROM mst_org_branch b
    WHERE (p_org_id IS NULL OR b.Org_Id = p_org_id)
      AND (p_branch_id IS NULL OR b.Branch_Id = p_branch_id)
      AND (
          p_keyword IS NULL
          OR p_keyword = ''
          OR b.Branch_Name LIKE CONCAT('%', p_keyword, '%')
          OR b.Branch_Code LIKE CONCAT('%', p_keyword, '%')
          OR b.Branch_Address LIKE CONCAT('%', p_keyword, '%')
      )
      AND (p_is_head IS NULL OR CAST(b.Is_Head AS UNSIGNED) = p_is_head)
      AND (p_is_active IS NULL OR CAST(b.Is_Active AS UNSIGNED) = p_is_active)
    ORDER BY CAST(b.Is_Head AS UNSIGNED) DESC, b.Branch_Name ASC
    LIMIT v_per_page OFFSET v_offset;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_ORG_GET` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_ORG_GET`(
    IN p_org_id SMALLINT
)
BEGIN
    SELECT
        o.Org_Id,
        o.Org_DispNm,
        o.Legal_Name,
        o.Regd_Address,
        o.HO_Address,
        o.State_Cd,
        s.State_Name,
        o.Phone,
        o.Email,
        o.Website,
        o.CIN_No,
        o.Regd_No,
        o.GST_No,
        o.PAN_No,
        o.TAN_No,
        CASE
            WHEN o.Org_Logo IS NULL THEN NULL
            ELSE TO_BASE64(o.Org_Logo)
        END AS Org_Logo,
        o.Org_Schema,
        CAST(o.Is_Active AS UNSIGNED) AS Is_Active
    FROM mst_org_register o
    LEFT JOIN mst_states s ON s.State_Cd = o.State_Cd
    WHERE o.Org_Id = p_org_id
    LIMIT 1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_ORG_UPDATE` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_ORG_UPDATE`(
    IN p_org_id SMALLINT,
    IN p_org_disp_nm VARCHAR(200),
    IN p_legal_name VARCHAR(200),
    IN p_regd_address VARCHAR(250),
    IN p_ho_address VARCHAR(250),
    IN p_state_cd SMALLINT,
    IN p_phone VARCHAR(25),
    IN p_email VARCHAR(50),
    IN p_website VARCHAR(75),
    IN p_cin_no VARCHAR(50),
    IN p_regd_no VARCHAR(50),
    IN p_gst_no VARCHAR(20),
    IN p_pan_no VARCHAR(15),
    IN p_tan_no VARCHAR(25),
    IN p_org_logo LONGTEXT,
    IN p_is_active TINYINT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_state_ok INT DEFAULT 1;
    DECLARE v_disp VARCHAR(200);

    SET v_disp = NULLIF(TRIM(p_org_disp_nm), '');

    SELECT COUNT(*) INTO v_exists
    FROM mst_org_register
    WHERE Org_Id = p_org_id;

    IF v_exists = 0 THEN
        SELECT 'ERROR' AS status, p_org_id AS org_id, 'Organization not found' AS message;
    ELSEIF v_disp IS NULL THEN
        SELECT 'ERROR' AS status, p_org_id AS org_id, 'Organization display name is required' AS message;
    ELSE
        IF p_state_cd IS NOT NULL THEN
            SELECT COUNT(*) INTO v_state_ok
            FROM mst_states
            WHERE State_Cd = p_state_cd;
        END IF;

        IF p_state_cd IS NOT NULL AND v_state_ok = 0 THEN
            SELECT 'ERROR' AS status, p_org_id AS org_id, 'Invalid state code' AS message;
        ELSE
            UPDATE mst_org_register
            SET
                Org_DispNm = v_disp,
                Legal_Name = NULLIF(TRIM(p_legal_name), ''),
                Regd_Address = NULLIF(TRIM(p_regd_address), ''),
                HO_Address = NULLIF(TRIM(p_ho_address), ''),
                State_Cd = p_state_cd,
                Phone = NULLIF(TRIM(p_phone), ''),
                Email = NULLIF(TRIM(p_email), ''),
                Website = NULLIF(TRIM(p_website), ''),
                CIN_No = NULLIF(TRIM(p_cin_no), ''),
                Regd_No = NULLIF(TRIM(p_regd_no), ''),
                GST_No = NULLIF(TRIM(p_gst_no), ''),
                PAN_No = NULLIF(TRIM(p_pan_no), ''),
                TAN_No = NULLIF(TRIM(p_tan_no), ''),
                Org_Logo = CASE
                    WHEN p_org_logo IS NULL THEN Org_Logo
                    WHEN TRIM(p_org_logo) = '' THEN NULL
                    ELSE FROM_BASE64(p_org_logo)
                END,
                Is_Active = IFNULL(p_is_active, CAST(Is_Active AS UNSIGNED))
            WHERE Org_Id = p_org_id;

            SELECT 'SUCCESS' AS status, p_org_id AS org_id, 'Organization updated successfully' AS message;
        END IF;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_ORG_USER_ADD` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_ORG_USER_ADD`(
    IN p_org_id SMALLINT,
    IN p_user_name VARCHAR(25),
    IN p_user_pass VARCHAR(150),
    IN p_status TINYINT,
    IN p_created_by SMALLINT
)
BEGIN
    DECLARE v_name VARCHAR(25);
    DECLARE v_dup INT DEFAULT 0;
    DECLARE v_new_id SMALLINT DEFAULT NULL;

    SET v_name = NULLIF(TRIM(p_user_name), '');

    IF p_org_id IS NULL OR p_org_id < 1 THEN
        SELECT 'ERROR' AS status, NULL AS user_id, 'Organization is required' AS message;
    ELSEIF v_name IS NULL THEN
        SELECT 'ERROR' AS status, NULL AS user_id, 'User name is required' AS message;
    ELSEIF p_user_pass IS NULL OR TRIM(p_user_pass) = '' THEN
        SELECT 'ERROR' AS status, NULL AS user_id, 'User password is required' AS message;
    ELSE
        SELECT COUNT(*) INTO v_dup
        FROM mst_org_user
        WHERE Org_Id = p_org_id
          AND UPPER(User_Name) = UPPER(v_name);

        IF v_dup > 0 THEN
            SELECT 'ERROR' AS status, NULL AS user_id, 'User name already exists' AS message;
        ELSE
            INSERT INTO mst_org_user (
                Org_Id, User_Name, User_Pass, Status, Created_by
            ) VALUES (
                p_org_id,
                v_name,
                p_user_pass,
                IFNULL(p_status, 1),
                p_created_by
            );

            SET v_new_id = LAST_INSERT_ID();
            SELECT 'SUCCESS' AS status, v_new_id AS user_id, 'Org user created successfully' AS message;
        END IF;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_ORG_USER_UPDATE` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_ORG_USER_UPDATE`(
    IN p_user_id SMALLINT,
    IN p_user_name VARCHAR(25),
    IN p_user_pass VARCHAR(150),
    IN p_status TINYINT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_name VARCHAR(25);
    DECLARE v_dup INT DEFAULT 0;
    DECLARE v_org_id SMALLINT DEFAULT NULL;

    SET v_name = NULLIF(TRIM(p_user_name), '');

    SELECT COUNT(*), MAX(Org_Id) INTO v_exists, v_org_id
    FROM mst_org_user
    WHERE User_Id = p_user_id;

    IF v_exists = 0 THEN
        SELECT 'ERROR' AS status, p_user_id AS user_id, 'Org user not found' AS message;
    ELSE
        IF v_name IS NOT NULL THEN
            SELECT COUNT(*) INTO v_dup
            FROM mst_org_user
            WHERE Org_Id = v_org_id
              AND UPPER(User_Name) = UPPER(v_name)
              AND User_Id <> p_user_id;

            IF v_dup > 0 THEN
                SELECT 'ERROR' AS status, p_user_id AS user_id, 'User name already exists' AS message;
            ELSE
                UPDATE mst_org_user
                SET
                    User_Name = v_name,
                    User_Pass = IF(p_user_pass IS NULL OR TRIM(p_user_pass) = '', User_Pass, p_user_pass),
                    Status = IFNULL(p_status, Status)
                WHERE User_Id = p_user_id;

                SELECT 'SUCCESS' AS status, p_user_id AS user_id, 'Org user updated successfully' AS message;
            END IF;
        ELSE
            UPDATE mst_org_user
            SET
                User_Pass = IF(p_user_pass IS NULL OR TRIM(p_user_pass) = '', User_Pass, p_user_pass),
                Status = IFNULL(p_status, Status)
            WHERE User_Id = p_user_id;

            SELECT 'SUCCESS' AS status, p_user_id AS user_id, 'Org user updated successfully' AS message;
        END IF;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_STATE_LIST` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_STATE_LIST`(
    IN p_state_cd SMALLINT,
    IN p_keyword VARCHAR(75),
    IN p_page INT,
    IN p_per_page INT
)
BEGIN
    DECLARE v_page INT DEFAULT 1;
    DECLARE v_per_page INT DEFAULT 50;
    DECLARE v_offset INT DEFAULT 0;
    DECLARE v_total INT DEFAULT 0;

    SET v_page = GREATEST(IFNULL(p_page, 1), 1);
    SET v_per_page = LEAST(GREATEST(IFNULL(p_per_page, 50), 1), 200);
    SET v_offset = (v_page - 1) * v_per_page;

    SELECT COUNT(*) INTO v_total
    FROM mst_states
    WHERE (p_state_cd IS NULL OR State_Cd = p_state_cd)
      AND (
          p_keyword IS NULL
          OR p_keyword = ''
          OR State_Name LIKE CONCAT('%', p_keyword, '%')
      );

    SELECT
        v_total AS total,
        v_page AS page,
        v_per_page AS per_page,
        CASE
            WHEN v_total = 0 THEN 1
            ELSE CEIL(v_total / v_per_page)
        END AS last_page;

    SELECT
        State_Cd,
        State_Name
    FROM mst_states
    WHERE (p_state_cd IS NULL OR State_Cd = p_state_cd)
      AND (
          p_keyword IS NULL
          OR p_keyword = ''
          OR State_Name LIKE CONCAT('%', p_keyword, '%')
      )
    ORDER BY State_Name ASC
    LIMIT v_per_page OFFSET v_offset;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_USER_PASSWORD_HISTORY_ADD` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_USER_PASSWORD_HISTORY_ADD`(
    IN p_user_id SMALLINT,
    IN p_password_hash VARCHAR(150)
)
BEGIN
    INSERT INTO mst_user_password_history (User_Id, Password_Hash, Created_at)
    VALUES (p_user_id, p_password_hash, NOW());

    
    DELETE FROM mst_user_password_history
    WHERE User_Id = p_user_id
      AND Id NOT IN (
          SELECT Id FROM (
              SELECT Id
              FROM mst_user_password_history
              WHERE User_Id = p_user_id
              ORDER BY Created_at DESC, Id DESC
              LIMIT 20
          ) t
      );

    SELECT LAST_INSERT_ID() AS Id, p_user_id AS User_Id, NOW() AS Created_at;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_USER_PASSWORD_HISTORY_LIST` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_USER_PASSWORD_HISTORY_LIST`(
    IN p_user_id SMALLINT,
    IN p_limit SMALLINT UNSIGNED
)
BEGIN
    SELECT Id, User_Id, Password_Hash, Created_at
    FROM mst_user_password_history
    WHERE User_Id = p_user_id
    ORDER BY Created_at DESC, Id DESC
    LIMIT p_limit;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `USP_USER_PASSWORD_LAST_CHANGED` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`priority`@`%` PROCEDURE `USP_USER_PASSWORD_LAST_CHANGED`(IN p_user_id SMALLINT)
BEGIN
    SELECT Created_at AS Password_Changed_At
    FROM mst_user_password_history
    WHERE User_Id = p_user_id
    ORDER BY Created_at DESC, Id DESC
    LIMIT 1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-23 15:31:03

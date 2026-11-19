CREATE DATABASE IF NOT EXISTS `Paises`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `Paises`;

CREATE TABLE IF NOT EXISTS `paises` (
  `pais_id` INT NOT NULL,
  `pais_descripcion` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`pais_id`)
) ENGINE=InnoDB;

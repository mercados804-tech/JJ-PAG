-- JJ-Indum MySQL schema
-- Ejecutar este script en MySQL Workbench sobre la conexión:
--   Connection Name: jj-indum
--   Hostname: 127.0.0.1
--   Username: root
--   Port: 3006 (o 3306 si corresponde)

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS `jj-indum`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `jj-indum`;

-- Tabla: suppliers (proveedores)
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `contact` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_suppliers_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: products
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `price` INT NOT NULL, -- precio en ARS (entero)
  `image` MEDIUMTEXT NOT NULL, -- imagen/preview en base64
  `category` VARCHAR(100) NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `sold_count` INT NOT NULL DEFAULT 0, -- Total unidades vendidas
  `supplier_id` INT UNSIGNED NULL, -- Relación con proveedores
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_products_category` (`category`),
  CONSTRAINT `fk_products_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: users (clientes)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NULL, -- puede ser null si es invitado que se verifica
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `role` VARCHAR(20) NOT NULL DEFAULT 'client', -- 'client' o 'admin'
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: promotions
CREATE TABLE IF NOT EXISTS `promotions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NULL, -- Relación opcional con productos
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `image` MEDIUMTEXT NOT NULL,
  `price` INT NULL,
  `discount` INT NULL,
  `sizes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_promotions_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: admin_audit_logs (auditoría de acciones admin)
CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `action` VARCHAR(100) NOT NULL,
  `detail_json` MEDIUMTEXT NULL,
  `admin_email` VARCHAR(255) NULL,
  `admin_name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: contact_messages
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: site_home (configuración de portada/carrusel)
CREATE TABLE IF NOT EXISTS `site_home` (
  `id` TINYINT UNSIGNED NOT NULL,
  `images_json` MEDIUMTEXT NOT NULL, -- JSON array de imágenes (puede ser rutas o base64)
  `captions_json` MEDIUMTEXT NOT NULL, -- JSON array de leyendas
  `interval_ms` INT NOT NULL DEFAULT 3000,
  `pause_on_hover` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: orders (pedidos)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer` VARCHAR(255) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pendiente',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orders_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Columnas adicionales para compatibilidad con el backend (idempotente: errores se ignoran en ensureSchema)
ALTER TABLE `orders` ADD COLUMN `total` INT NOT NULL DEFAULT 0;
ALTER TABLE `orders` ADD COLUMN `payment_method` VARCHAR(50) NULL;

-- Tabla: order_items (items de pedido)
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NULL,
  `name` VARCHAR(255) NOT NULL,
  `qty` INT NOT NULL,
  `price` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: user_profiles (datos extendidos del cliente)
CREATE TABLE IF NOT EXISTS `user_profiles` (
  `user_email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `addresses_json` MEDIUMTEXT NULL,
  `avatar` MEDIUMTEXT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_email`),
  CONSTRAINT `fk_user_profiles_user` FOREIGN KEY (`user_email`) REFERENCES `users` (`email`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: cart_items (carrito persistente por usuario)
CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_email` VARCHAR(255) NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `price` INT NOT NULL,
  `image` MEDIUMTEXT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `color` VARCHAR(50) NOT NULL DEFAULT '',
  `talle` VARCHAR(20) NOT NULL DEFAULT '',
  `description` TEXT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_cart_item` (`user_email`, `product_id`, `color`, `talle`),
  KEY `idx_cart_user` (`user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: sales (log de ventas)
CREATE TABLE IF NOT EXISTS `sales` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NULL,
  `name` VARCHAR(255) NOT NULL,
  `qty` INT NOT NULL,
  `price` INT NOT NULL DEFAULT 0,
  `total` INT NOT NULL DEFAULT 0,
  `ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sales_ts` (`ts`),
  KEY `idx_sales_prod` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
-- Tabla: email_verification_tokens (tokens/códigos de verificación por email)
CREATE TABLE IF NOT EXISTS `email_verification_tokens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `used_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_evt_email` (`email`),
  KEY `idx_evt_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: admin_settings (configuración admin)
CREATE TABLE IF NOT EXISTS `admin_settings` (
  `id` TINYINT UNSIGNED NOT NULL,
  `min_stock` INT NOT NULL DEFAULT 2,
  `admin_email` VARCHAR(255) NULL,
  `admin_password` VARCHAR(255) NULL,
  `admin_name` VARCHAR(255) NULL,
  `company_name` VARCHAR(255) NULL,
  `company_address` VARCHAR(255) NULL,
  `company_city` VARCHAR(255) NULL,
  `company_phone` VARCHAR(100) NULL,
  `company_email` VARCHAR(255) NULL,
  `company_cuit` VARCHAR(50) NULL,
  `company_logo` MEDIUMTEXT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `admin_settings` ADD COLUMN `company_name` VARCHAR(255) NULL;
ALTER TABLE `admin_settings` ADD COLUMN `company_address` VARCHAR(255) NULL;
ALTER TABLE `admin_settings` ADD COLUMN `company_city` VARCHAR(255) NULL;
ALTER TABLE `admin_settings` ADD COLUMN `company_phone` VARCHAR(100) NULL;
ALTER TABLE `admin_settings` ADD COLUMN `company_email` VARCHAR(255) NULL;
ALTER TABLE `admin_settings` ADD COLUMN `company_cuit` VARCHAR(50) NULL;
ALTER TABLE `admin_settings` ADD COLUMN `company_logo` MEDIUMTEXT NULL;

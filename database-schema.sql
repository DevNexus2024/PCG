-- Pizza Club and Grill Database Schema
-- MySQL Database for XAMPP
-- Created: January 26, 2026

-- Create Database
DROP DATABASE IF EXISTS `pizza_club_and_grill`;
CREATE DATABASE `pizza_club_and_grill` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pizza_club_and_grill`;

-- =====================================================
-- CUSTOMER TABLE
-- =====================================================
CREATE TABLE `customer` (
  `cus_id` VARCHAR(50) PRIMARY KEY,
  `cus_full_name` VARCHAR(100) NOT NULL,
  `cus_email` VARCHAR(100) UNIQUE NOT NULL,
  `cus_phone_num` VARCHAR(20) NOT NULL,
  `cus_passwordhash` VARCHAR(255) NOT NULL,
  `cus_phy_address` TEXT,
  `cus_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_email` (`cus_email`),
  INDEX `idx_phone` (`cus_phone_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CATEGORY TABLE
-- =====================================================
CREATE TABLE `category` (
  `cat_id` VARCHAR(50) PRIMARY KEY,
  `cat_image` VARCHAR(255),
  `cat_status` ENUM('active', 'inactive') DEFAULT 'active',
  `cat_name` VARCHAR(100) NOT NULL,
  INDEX `idx_status` (`cat_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MENU_ITEM TABLE
-- =====================================================
CREATE TABLE `menu_item` (
  `mi_id` VARCHAR(50) PRIMARY KEY,
  `mi_name` VARCHAR(100) NOT NULL,
  `mi_size` VARCHAR(50),
  `mi_image` VARCHAR(255),
  `cat_id` VARCHAR(50),
  `mi_price` DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (`cat_id`) REFERENCES `category`(`cat_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_category` (`cat_id`),
  INDEX `idx_price` (`mi_price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CART TABLE
-- =====================================================
CREATE TABLE `cart` (
  `cart_id` VARCHAR(50) PRIMARY KEY,
  `cus_id` VARCHAR(50) NOT NULL,
  `cart_created_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `cart_status` ENUM('active', 'checked_out', 'abandoned') DEFAULT 'active',
  FOREIGN KEY (`cus_id`) REFERENCES `customer`(`cus_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_customer` (`cus_id`),
  INDEX `idx_status` (`cart_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CART_ITEM TABLE (Items in Cart)
-- =====================================================
CREATE TABLE `cart_item` (
  `cart_item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `cart_id` VARCHAR(50) NOT NULL,
  `mi_id` VARCHAR(50) NOT NULL,
  `quantity` INT DEFAULT 1,
  `price` DECIMAL(10, 2) NOT NULL,
  `added_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`cart_id`) REFERENCES `cart`(`cart_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`mi_id`) REFERENCES `menu_item`(`mi_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_cart` (`cart_id`),
  INDEX `idx_menu_item` (`mi_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- EMPLOYEE TABLE
-- =====================================================
CREATE TABLE `employee` (
  `emp_id` VARCHAR(50) PRIMARY KEY,
  `emp_fullname` VARCHAR(100) NOT NULL,
  `emp_role` ENUM('admin', 'supervisor', 'cashier', 'delivery') NOT NULL,
  `emp_phone_num` VARCHAR(20),
  `emp_salary` DECIMAL(10, 2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ORDER TABLE
-- =====================================================
CREATE TABLE `order` (
  `ord_id` VARCHAR(50) PRIMARY KEY,
  `cus_id` VARCHAR(50) NOT NULL,
  `ord_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ord_total_amount` DECIMAL(10, 2) NOT NULL,
  `ord_status` ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled') DEFAULT 'pending',
  `da_id` VARCHAR(50),
  FOREIGN KEY (`cus_id`) REFERENCES `customer`(`cus_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_customer` (`cus_id`),
  INDEX `idx_status` (`ord_status`),
  INDEX `idx_date` (`ord_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ORDER_ITEM TABLE
-- =====================================================
CREATE TABLE `order_item` (
  `ord_item_id` VARCHAR(50) PRIMARY KEY,
  `ord_id` VARCHAR(50) NOT NULL,
  `mi_id` VARCHAR(50) NOT NULL,
  `pay_id` VARCHAR(50),
  `ord_item_quantity` INT NOT NULL DEFAULT 1,
  `ord_item_price` DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (`ord_id`) REFERENCES `order`(`ord_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`mi_id`) REFERENCES `menu_item`(`mi_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_order` (`ord_id`),
  INDEX `idx_menu_item` (`mi_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DELIVERY_ADDRESS TABLE
-- =====================================================
CREATE TABLE `delivery_address` (
  `da_id` VARCHAR(50) PRIMARY KEY,
  `ord_id` VARCHAR(50) NOT NULL,
  `da_delivery_status` ENUM('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed') DEFAULT 'pending',
  `da_pick_time` TIMESTAMP NULL,
  `da_delivery_time` TIMESTAMP NULL,
  `da_delivery_location` TEXT NOT NULL,
  FOREIGN KEY (`ord_id`) REFERENCES `order`(`ord_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_order` (`ord_id`),
  INDEX `idx_status` (`da_delivery_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PAYMENT TABLE
-- =====================================================
CREATE TABLE `payment` (
  `pay_id` VARCHAR(50) PRIMARY KEY,
  `ord_item_id` VARCHAR(50),
  `pay_type` ENUM('cash_on_delivery', 'mobile_money', 'card', 'pay_on_pickup') NOT NULL,
  `pay_amount` DECIMAL(10, 2) NOT NULL,
  `pay_status` ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  `pay_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ord_item_id`) REFERENCES `order_item`(`ord_item_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_order_item` (`ord_item_id`),
  INDEX `idx_status` (`pay_status`),
  INDEX `idx_type` (`pay_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- FEEDBACK TABLE
-- =====================================================
CREATE TABLE `feedback` (
  `fb_id` VARCHAR(50) PRIMARY KEY,
  `pay_id` VARCHAR(50),
  `ord_item_id` VARCHAR(50),
  `fb_rating` INT CHECK (`fb_rating` BETWEEN 1 AND 5),
  `fb_comment` TEXT,
  `fb_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`pay_id`) REFERENCES `payment`(`pay_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`ord_item_id`) REFERENCES `order_item`(`ord_item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_payment` (`pay_id`),
  INDEX `idx_order_item` (`ord_item_id`),
  INDEX `idx_rating` (`fb_rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DISCOUNT TABLE
-- =====================================================
CREATE TABLE `discount` (
  `disc_id` VARCHAR(50) PRIMARY KEY,
  `disc_code` VARCHAR(50) UNIQUE NOT NULL,
  `disc_percentage` DECIMAL(5, 2),
  `disc_start_date` DATE,
  `disc_end_date` DATE,
  INDEX `idx_code` (`disc_code`),
  INDEX `idx_dates` (`disc_start_date`, `disc_end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PAYMENT METHOD TABLES
-- =====================================================
CREATE TABLE `mobile_money_mtn` (
  `m_contact_details` VARCHAR(20) PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `card` (
  `ca_type` ENUM('visa', 'mastercard', 'amex') NOT NULL,
  `ca_details` VARCHAR(100) PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cash_on_delivery` (
  `cod_location` TEXT PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA INSERTS
-- =====================================================

-- Insert Sample Customers
INSERT INTO `customer` (`cus_id`, `cus_full_name`, `cus_email`, `cus_phone_num`, `cus_passwordhash`, `cus_phy_address`) VALUES
('cus001', 'John Doe', 'john.doe@example.com', '+268 7698 7654', '$2y$10$abcdefghijklmnopqrstuvwxyz1234567890', '123 Main Street, Mbabane'),
('cus002', 'Jane Smith', 'jane.smith@example.com', '+268 7612 9876', '$2y$10$abcdefghijklmnopqrstuvwxyz1234567890', '456 Oak Avenue, Manzini');

-- Insert Sample Categories
INSERT INTO `category` (`cat_id`, `cat_name`, `cat_status`) VALUES
('cat001', 'Pizza', 'active'),
('cat002', 'Grill', 'active'),
('cat003', 'Drinks', 'active');

-- Insert Sample Menu Items
INSERT INTO `menu_item` (`mi_id`, `mi_name`, `mi_size`, `cat_id`, `mi_price`) VALUES
('mi001', 'Something Meaty', 'Large', 'cat001', 153.00),
('mi002', 'Margherita Pizza', 'Medium', 'cat001', 89.00),
('mi003', 'Grilled Chicken', 'Regular', 'cat002', 120.00);

-- Insert Sample Employee
INSERT INTO `employee` (`emp_id`, `emp_fullname`, `emp_role`, `emp_phone_num`, `emp_salary`) VALUES
('emp001', 'Admin User', 'admin', '+268 7612 3456', 5000.00);

-- Insert Sample Cart
INSERT INTO `cart` (`cart_id`, `cus_id`, `cart_status`) VALUES
('cart001', 'cus001', 'active');

-- Insert Sample Cart Items
INSERT INTO `cart_item` (`cart_id`, `mi_id`, `quantity`, `price`) VALUES
('cart001', 'mi001', 2, 153.00),
('cart001', 'mi003', 1, 120.00);

-- Insert Sample Order
INSERT INTO `order` (`ord_id`, `cus_id`, `ord_total_amount`, `ord_status`) VALUES
('ord001', 'cus002', 178.00, 'pending');

-- Insert Sample Order Items
INSERT INTO `order_item` (`ord_item_id`, `ord_id`, `mi_id`, `ord_item_quantity`, `ord_item_price`) VALUES
('orditem001', 'ord001', 'mi002', 2, 89.00);

-- Insert Sample Delivery Address
INSERT INTO `delivery_address` (`da_id`, `ord_id`, `da_delivery_status`, `da_delivery_location`) VALUES
('da001', 'ord001', 'pending', '456 Oak Avenue, Manzini');

-- Insert Sample Payment
INSERT INTO `payment` (`pay_id`, `ord_item_id`, `pay_type`, `pay_amount`, `pay_status`) VALUES
('pay001', 'orditem001', 'mobile_money', 178.00, 'pending');

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- View all active carts with items
-- SELECT c.cart_id, cu.cus_full_name, ci.mi_id, m.mi_name, ci.quantity, ci.price
-- FROM cart c
-- JOIN customer cu ON c.cus_id = cu.cus_id
-- JOIN cart_item ci ON c.cart_id = ci.cart_id
-- JOIN menu_item m ON ci.mi_id = m.mi_id
-- WHERE c.cart_status = 'active';

-- View all orders with customer details
-- SELECT o.ord_id, c.cus_full_name, o.ord_date, o.ord_total_amount, o.ord_status
-- FROM `order` o
-- JOIN customer c ON o.cus_id = c.cus_id
-- ORDER BY o.ord_date DESC;

-- View order items with menu details
-- SELECT oi.ord_item_id, o.ord_id, m.mi_name, oi.ord_item_quantity, oi.ord_item_price
-- FROM order_item oi
-- JOIN `order` o ON oi.ord_id = o.ord_id
-- JOIN menu_item m ON oi.mi_id = m.mi_id;

-- View pending deliveries
-- SELECT da.da_id, o.ord_id, c.cus_full_name, da.da_delivery_location, da.da_delivery_status
-- FROM delivery_address da
-- JOIN `order` o ON da.ord_id = o.ord_id
-- JOIN customer c ON o.cus_id = c.cus_id
-- WHERE da.da_delivery_status IN ('pending', 'assigned', 'in_transit');

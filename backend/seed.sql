-- JJ-Indum MySQL seed data
-- Ejecutar este script en MySQL Workbench (tras crear el esquema con schema.sql)
-- Connection Name: jj-indum | Host: 127.0.0.1 | User: root | Port: 3006 (o 3306)

USE `jj-indum`;

-- Productos de ejemplo (las imágenes usan rutas del directorio /img del proyecto)
INSERT INTO `products` (`name`, `price`, `image`, `category`, `quantity`) VALUES
  ('Chomba', 19999, '/img/chomba.webp', 'remeras', 20),
  ('Bermuda', 24999, '/img/bermuda.webp', 'bermudas', 15),
  ('Pantalón', 29999, '/img/pantalon.webp', 'pantalones', 12),
  ('Short', 14999, '/img/shortb.webp', 'shorts', 18),
  ('Remera', 17999, '/img/shirt.webp', 'remeras', 25),
  ('Chomba Stamford', 21999, '/img/stamford.webp', 'remeras', 10);

-- Promociones de ejemplo
INSERT INTO `promotions` (`title`, `description`, `image`, `price`, `discount`, `sizes`) VALUES
  ('Promo 10%', '10% de descuento en remeras', '/img/promo1.webp', 19999, 10, 'S,M,L,XL'),
  ('2x1 Remeras', 'Llevate 2 y pagás 1', '/img/promo2.webp', 17999, 0, 'S,M,L');

-- Mensajes de contacto de ejemplo
INSERT INTO `contact_messages` (`name`, `email`, `message`) VALUES
  ('Juan Pérez', 'juan@example.com', 'Consulta sobre envío y tiempos'),
  ('María Gómez', 'maria@example.com', '¿Tienen talles grandes disponibles?');

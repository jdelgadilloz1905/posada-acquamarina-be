-- Script para insertar las 3 habitaciones del Hotel Acquamarina
-- Ejecutar este script después de que las tablas estén creadas

-- Habitación 1: Saky Saky (Estándar)
INSERT INTO rooms (
  name,
  "roomNumber",
  "type",
  "pricePerNight",
  capacity,
  "maxChildren",
  description,
  amenities,
  status,
  "videoId",
  "createdAt",
  "updatedAt"
) VALUES (
  'Saky Saky',
  '101',
  'single',
  520,
  2,
  0,
  'Nuestra habitación estándar. Espaciosas habitaciones equipadas con una cama Queen size ideales para parejas que buscan comfort y descanso. Máximo 2 personas.',
  ARRAY['Aire acondicionado', 'Smart TV', 'Caja fuerte', 'Almohadas y edredones de plumón de fabricación italiana'],
  'available',
  'drLVfiBl1sg',
  NOW(),
  NOW()
);

-- Habitación 2: Noronky (Cuádruple)
INSERT INTO rooms (
  name,
  "roomNumber",
  "type",
  "pricePerNight",
  capacity,
  "maxChildren",
  description,
  amenities,
  status,
  "videoId",
  "createdAt",
  "updatedAt"
) VALUES (
  'Noronky',
  '201',
  'quad',
  720,
  4,
  2,
  'Habitación cuádruple amplia con dos camas Queen size. Perfecta para familias o grupos que buscan espacio y comodidad en un ambiente elegante.',
  ARRAY['Aire acondicionado', 'Smart TV', 'Caja fuerte', 'Almohadas y edredones de plumón de fabricación italiana'],
  'available',
  'zjeCnz67CpU',
  NOW(),
  NOW()
);

-- Habitación 3: Francisky (Familiar)
INSERT INTO rooms (
  name,
  "roomNumber",
  "type",
  "pricePerNight",
  capacity,
  "maxChildren",
  description,
  amenities,
  status,
  "videoId",
  "createdAt",
  "updatedAt"
) VALUES (
  'Francisky',
  '301',
  'family',
  980,
  6,
  3,
  'Nuestra habitación familiar más espaciosa. Ideal para familias grandes con múltiples espacios de descanso y áreas comunes. Incluye 1 Cama King + 2 Sofá Cama.',
  ARRAY['Aire acondicionado', 'Smart TV', 'Caja fuerte', 'Almohadas y edredones de plumón de fabricación italiana'],
  'available',
  'EZ6tsYaqBYk',
  NOW(),
  NOW()
);

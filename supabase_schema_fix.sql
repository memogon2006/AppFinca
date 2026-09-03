-- =========================================================================
-- ESQUEMA CORREGIDO PARA GANADOPRO (COMPATIBLE CON IDs DE TEXTO Y DEXIE)
-- =========================================================================

-- 1. RECREAR TABLA PROFILES
DROP TABLE IF EXISTS public.weighings CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.cattle CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT,
  farm_name TEXT DEFAULT 'Mi Finca Ganadera',
  email TEXT UNIQUE,
  password_hash TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RECREAR TABLA CATTLE
CREATE TABLE public.cattle (
  id BIGINT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tag_number TEXT NOT NULL,
  name TEXT,
  owner TEXT DEFAULT 'Dueño Principal',
  iron_brand TEXT,
  sex TEXT NOT NULL DEFAULT 'Macho',
  category TEXT NOT NULL DEFAULT 'Torete / Novillo',
  production_type TEXT DEFAULT 'Carne',
  status TEXT NOT NULL DEFAULT 'Activo',
  
  -- Reproducción & Lechería
  reproductive_status TEXT DEFAULT 'No aplica',
  milking_status TEXT DEFAULT 'No aplica',
  is_breeding_only BOOLEAN DEFAULT FALSE,
  
  -- Fechas y Pesos de Entrada
  birth_date DATE,
  entry_date DATE DEFAULT CURRENT_DATE,
  entry_weight NUMERIC(8, 2) DEFAULT 0,
  entry_price NUMERIC(14, 2) DEFAULT 0,
  entry_batch TEXT DEFAULT 'Ingreso #1',
  paddock TEXT,
  breed TEXT,
  color TEXT,
  mother_tag TEXT,
  father_tag TEXT,
  
  -- Peso Actual / Salida y Liquidación
  current_weight NUMERIC(8, 2),
  exit_date DATE,
  exit_weight NUMERIC(8, 2),
  exit_price NUMERIC(14, 2),
  exit_type TEXT,
  sale_buyer TEXT,
  sale_reason TEXT,
  partnership_details JSONB,
  
  -- Muerte / Baja
  death_date DATE,
  death_reason TEXT,
  death_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RECREAR TABLA WEIGHINGS
CREATE TABLE public.weighings (
  id BIGINT PRIMARY KEY,
  user_id TEXT NOT NULL,
  cattle_id BIGINT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  weight NUMERIC(8, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RECREAR TABLA EXPENSES
CREATE TABLE public.expenses (
  id BIGINT PRIMARY KEY,
  user_id TEXT NOT NULL,
  cattle_id BIGINT,
  date DATE DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  description TEXT,
  supplier TEXT,
  invoice_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DESHABILITAR RLS PARA ACCESO DIRECTO RÁPIDO CON ANON KEY
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cattle DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weighings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;

-- 6. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_cattle_user ON public.cattle(user_id);
CREATE INDEX IF NOT EXISTS idx_cattle_status ON public.cattle(status);
CREATE INDEX IF NOT EXISTS idx_weighings_user ON public.weighings(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

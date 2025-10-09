-- =================================================================
-- SQL الكامل لإعداد قاعدة بيانات متجر Supabase
-- آمن لإعادة التنفيذ: لن يسبب أخطاء إذا كانت الإعدادات موجودة بالفعل
-- =================================================================

-- ========= 1. جدول المنتجات (Products) =========

-- إنشاء الجدول إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  description TEXT,
  image_url TEXT,
  images TEXT[],
  stock INT DEFAULT 0,
  category TEXT,
  rating NUMERIC,
  reviews INT,
  brand TEXT,
  colors JSONB,
  is_popular BOOLEAN DEFAULT false
);

-- تفعيل الأمان (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- حذف أي سياسات قديمة قد تتعارض
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Allow anon insert access to products" ON public.products;
DROP POLICY IF EXISTS "Allow anon update access to products" ON public.products;
DROP POLICY IF EXISTS "Allow anon delete access to products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON public.products;

-- إنشاء السياسات الصحيحة (للمفتاح العام anon)
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access to products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access to products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete access to products" ON public.products FOR DELETE USING (true);


-- ========= 2. جدول الطلبات (Orders) =========

-- إنشاء الجدول إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  items JSONB,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL
);

-- تفعيل الأمان (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- حذف أي سياسات قديمة قد تتعارض
DROP POLICY IF EXISTS "Allow anon to create and manage orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users to create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin full access" ON public.orders;


-- إنشاء السياسات الصحيحة للسماح بإنشاء الطلبات وإدارتها من لوحة التحكم
CREATE POLICY "Allow anon to create and manage orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);


-- ========= 3. تخزين الصور (Storage) =========

-- إنشاء حاوية (Bucket) لتخزين صور المنتجات وجعلها عامة
INSERT INTO storage.buckets (id, name, public)
VALUES ('product_images', 'product_images', true)
ON CONFLICT (id) DO NOTHING;

-- حذف أي سياسات قديمة قد تتعارض
DROP POLICY IF EXISTS "Allow public read access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon insert access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon delete access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;

-- إنشاء السياسات الصحيحة
CREATE POLICY "Allow public read access to product images" ON storage.objects FOR SELECT USING ( bucket_id = 'product_images' );
CREATE POLICY "Allow anon insert access to product images" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'product_images' );
CREATE POLICY "Allow anon update access to product images" ON storage.objects FOR UPDATE USING ( bucket_id = 'product_images' );
CREATE POLICY "Allow anon delete access to product images" ON storage.objects FOR DELETE USING ( bucket_id = 'product_images' );

-- =================================================================
-- بيانات تجريبية (اختياري)
-- =================================================================

-- حذف المنتجات الحالية لمنع التكرار عند إعادة التنفيذ
TRUNCATE TABLE public.products RESTART IDENTITY;

-- إضافة منتجات جديدة
INSERT INTO products (name, price, original_price, description, image_url, images, stock, category, rating, reviews, brand, colors, is_popular) VALUES
('هودي أسود برسوم', 199, 275, 'هودي مريح وعصري مصنوع من القطن الناعم، مثالي للإطلالات اليومية.', 'https://i.imgur.com/8E3O340.png', ARRAY['https://i.imgur.com/8E3O340.png', 'https://i.imgur.com/p77bA4N.png'], 30, 'ملابس جاهزة', 4.8, 150, 'MENESI''s - Apparels', '[{"name": "Black", "hex": "#2d3436", "imageUrl": "https://i.imgur.com/8E3O340.png"}, {"name": "White", "hex": "#ffffff", "imageUrl": "https://i.imgur.com/G5g2rG6.png"}]', true),
('تيشيرت وقت القهوة', 169, 219, 'تيشيرت قطني بتصميم فريد لمحبي القهوة، يجمع بين الأناقة والراحة.', 'https://i.imgur.com/JPl5C3P.png', ARRAY['https://i.imgur.com/JPl5C3P.png'], 50, 'ملابس جاهزة', 4.7, 95, 'Magical Booth', '[{"name": "Gray", "hex": "#95a5a6", "imageUrl": "https://i.imgur.com/JPl5C3P.png"}, {"name": "Black", "hex": "#2d3436", "imageUrl": "https://i.imgur.com/8QW2m3w.png"}]', true),
('هودي Cat make me happy', 199, 274, 'هودي لطيف ومبهج، الخيار الأمثل لمحبي القطط لإضافة لمسة من المرح لملابسهم.', 'https://i.imgur.com/eun36hG.png', ARRAY['https://i.imgur.com/eun36hG.png'], 25, 'ملابس جاهزة', 4.9, 210, 'Miss Ginger', '[{"name": "Yellow", "hex": "#f1c40f", "imageUrl": "https://i.imgur.com/eun36hG.png"}, {"name": "Black", "hex": "#2d3436", "imageUrl": "https://i.imgur.com/K3Z4A2I.png"}]', true),
('هودي Do what you love', 200, 275, 'هودي أبيض يحمل رسالة إيجابية، مصنوع من مواد عالية الجودة لضمان راحتك طوال اليوم.', 'https://i.imgur.com/G5g2rG6.png', ARRAY['https://i.imgur.com/G5g2rG6.png', 'https://i.imgur.com/8E3O340.png'], 40, 'ملابس جاهزة', 4.8, 180, 'M-E', '[{"name": "White", "hex": "#ffffff", "imageUrl": "https://i.imgur.com/G5g2rG6.png"}, {"name": "Black", "hex": "#2d3436", "imageUrl": "https://i.imgur.com/8E3O340.png"}]', true),
('سماعات بلوتوث لاسلكية', 199, 250, 'استمتع بصوت نقي وعزل للضوضاء مع هذه السماعات اللاسلكية.', 'https://picsum.photos/seed/headphones/600/600', ARRAY['https://picsum.photos/seed/headphones/600/600'], 50, 'إلكترونيات', 4.6, 250, 'Tech Savvy', '[]', false),
('حقيبة ظهر عصرية', 120, NULL, 'حقيبة ظهر بتصميم حديث، مثالية للعمل أو الدراسة.', 'https://picsum.photos/seed/backpack/600/600', ARRAY['https://picsum.photos/seed/backpack/600/600'], 100, 'أزياء', 4.9, 88, 'Urban Gear', '[]', false);

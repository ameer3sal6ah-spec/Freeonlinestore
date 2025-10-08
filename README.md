# متجر إلكتروني احترافي مع React و Supabase

هذا المشروع هو تطبيق متجر إلكتروني متكامل مبني باستخدام React، و Tailwind CSS، و Supabase كقاعدة بيانات.

## كيفية تشغيل المشروع

### الخطوة 1: إعداد الاتصال

1.  **إنشاء مشروع Supabase:**
    *   اذهب إلى [supabase.com](https://supabase.com) وأنشئ مشروعاً جديداً.
2.  **الحصول على مفاتيح API:**
    *   من لوحة تحكم مشروعك، اذهب إلى `Settings` (الإعدادات) > `API`.
    *   انسخ قيم `Project URL` و `anon` `public` key.
3.  **تحديث ملف `supabaseClient.ts`:**
    *   افتح ملف `services/supabaseClient.ts` في المشروع.
    *   استبدل القيم المؤقتة بالقيم التي نسختها.

### الخطوة 2: إعداد قاعدة البيانات والتخزين (الكود الشامل)

اذهب إلى `SQL Editor` في لوحة تحكم Supabase وقم بتنفيذ الكود التالي بالكامل. هذا الكود آمن لإعادة التنفيذ وسيضمن أن كل شيء مُعد بشكل صحيح.

```sql
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
  reviews INT
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

```

### الخطوة 3: إضافة بيانات منتجات أولية (اختياري)

لإضافة بعض المنتجات للمتجر، يمكنك تنفيذ الكود التالي في `SQL Editor`.

```sql
-- حذف المنتجات الحالية لمنع التكرار عند إعادة التنفيذ
-- TRUNCATE TABLE public.products RESTART IDENTITY;

-- إضافة منتجات جديدة
INSERT INTO products (name, price, original_price, description, image_url, images, stock, category, rating, reviews) VALUES
('ساعة ذكية فاخرة', 350, 500, 'ساعة ذكية أنيقة مع شاشة AMOLED وتتبع للياقة البدنية ومقاومة للماء. تصميم عصري يناسب جميع المناسبات.', 'https://picsum.photos/seed/watch/600/600', ARRAY['https://picsum.photos/seed/watch/600/600', 'https://picsum.photos/seed/watch2/600/600'], 25, 'إلكترونيات', 4.8, 120),
('سماعات بلوتوث لاسلكية', 199, 250, 'استمتع بصوت نقي وعزل للضوضاء مع هذه السماعات اللاسلكية. عمر بطارية طويل وصوت عالي الجودة.', 'https://picsum.photos/seed/headphones/600/600', ARRAY['https://picsum.photos/seed/headphones/600/600', 'https://picsum.photos/seed/headphones2/600/600'], 50, 'إلكترونيات', 4.6, 250),
('حقيبة ظهر عصرية', 120, NULL, 'حقيبة ظهر بتصميم حديث، مثالية للعمل أو الدراسة. مساحة تخزين واسعة ومقاومة للماء.', 'https://picsum.photos/seed/backpack/600/600', ARRAY['https://picsum.photos/seed/backpack/600/600'], 100, 'أزياء', 4.9, 88),
('ماكينة قهوة احترافية', 850, 1100, 'اصنع قهوتك المفضلة في المنزل بكل سهولة. تصميم أنيق وأداء قوي للحصول على أفضل كوب قهوة.', 'https://picsum.photos/seed/coffee/600/600', ARRAY['https://picsum.photos/seed/coffee/600/600'], 15, 'أجهزة منزلية', 4.7, 95);
```

### الخطوة 4: تشغيل التطبيق

بعد إتمام الخطوات السابقة، افتح التطبيق في المتصفح. يجب أن تعمل جميع الميزات الآن بشكل صحيح.


import { createClient, SupabaseClient } from '@supabase/supabase-js';

// !! هام جداً !!
// استبدل القيم التالية بالـ URL والـ anon key الخاص بمشروعك في Supabase
// يمكنك العثور عليها في إعدادات المشروع -> API
const supabaseUrl = 'https://cqnqflzrtnfhedvgmnfp.supabase.co'; // مثال: https://xyz.supabase.co
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbnFmbHpydG5maGVkdmdtbmZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODA0MzAsImV4cCI6MjA3NTM1NjQzMH0.MNp83s6txEwoBRvkVGLlacWvQ54TaujLK2FYmerK7ys'; // مثال: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

let supabase: SupabaseClient | null = null;
let supabaseError: string | null = null;

const isPlaceholder = (value: string, key: 'URL' | 'KEY') => {
    return value === `YOUR_SUPABASE_${key}`;
}

if (isPlaceholder(supabaseUrl, 'URL') || isPlaceholder(supabaseAnonKey, 'KEY')) {
    supabaseError = "الرجاء تحديث بيانات Supabase في الملف services/supabaseClient.ts. اتبع التعليمات في README.md";
    console.warn(supabaseError);
} else {
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
        if (e instanceof Error) {
            supabaseError = `خطأ في تهيئة Supabase: ${e.message}. تأكد من صحة الرابط والمفتاح.`;
            console.error(supabaseError);
        } else {
            supabaseError = 'حدث خطأ غير معروف أثناء تهيئة Supabase.';
            console.error(supabaseError);
        }
    }
}

export { supabase, supabaseError };
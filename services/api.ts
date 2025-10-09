
import { supabase } from './supabaseClient';
import { Product, Order } from '../types';
import { GoogleGenAI, Modality } from '@google/genai';

// Gemini AI Integration for product descriptions and image generation
let genAI: GoogleGenAI | null = null;
let genAIError: string | null = null;

try {
  // IMPORTANT: The API key is expected to be available in the environment.
  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable not set.');
  }
  genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
} catch (e: any) {
  genAIError = `فشل تهيئة خدمة الذكاء الاصطناعي: ${e.message}`;
  console.error(genAIError);
}

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
    if (genAIError || !genAI) {
        throw new Error(genAIError || "خدمة الذكاء الاصطناعي غير متاحة.");
    }

    const prompt = `
    اكتب وصفاً تسويقياً جذاباً ومختصراً (جملتين أو ثلاث) لمنتج باللغة العربية. 
    ركز على الفوائد والمميزات الرئيسية.
    اسم المنتج: "${productName}"
    فئة المنتج: "${category}"
    `;

    try {
        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error: any) {
        console.error("Error generating description with Gemini:", error);
        throw new Error(`فشل إنشاء الوصف: ${error.message}`);
    }
};

export const generateImageFromText = async (prompt: string): Promise<string> => {
    if (genAIError || !genAI) {
        throw new Error(genAIError || "خدمة الذكاء الاصطناعي غير متاحة.");
    }
    try {
        const response = await genAI.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png', // Use PNG for potential transparency
            },
        });
        return response.generatedImages[0].image.imageBytes; // Returns base64 string
    } catch (error: any) {
        console.error("Error generating image with Imagen:", error);
        throw new Error(`فشل إنشاء الصورة من النص: ${error.message}`);
    }
};

export const generateImageFromImageAndText = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
    if (genAIError || !genAI) {
        throw new Error(genAIError || "خدمة الذكاء الاصطناعي غير متاحة.");
    }
    try {
        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        // Improved error handling
        const candidate = response.candidates?.[0];
        if (!candidate || (candidate.finishReason && candidate.finishReason !== 'STOP')) {
             const reason = candidate?.finishReason || 'غير معروف';
             const reasonText = reason === 'SAFETY' ? 'لأسباب تتعلق بالسلامة' : `بسبب (${reason})`;
             throw new Error(`تم حظر إنشاء الصورة ${reasonText}. حاول تغيير الوصف أو الصورة.`);
        }
        
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);

        if (imagePart?.inlineData?.data) {
            return imagePart.inlineData.data;
        }
        
        throw new Error("لم يتم العثور على صورة في استجابة الذكاء الاصطناعي.");

    } catch (error: any) {
        console.error("Error editing image with Gemini:", error);
        // Avoid nesting "فشل تعديل الصورة"
        if (error.message.startsWith("تم حظر إنشاء الصورة")) {
            throw error;
        }
        throw new Error(`فشل تعديل الصورة: ${error.message}`);
    }
};


// Helper to transform snake_case from Supabase to camelCase for the app
const fromSupabase = (data: any) => {
    if (!data) return null;
    if (Array.isArray(data)) {
        return data.map(item => fromSupabase(item));
    }
    const transformed: {[key: string]: any} = {};
    for (const key in data) {
        const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
        transformed[camelKey] = data[key];
    }
    return transformed;
};

// Helper to transform camelCase from the app to snake_case for Supabase
const toSupabase = (data: any) => {
    const transformed: {[key: string]: any} = {};
    for (const key in data) {
        if (key.includes('_')) {
             transformed[key] = data[key];
             continue;
        }
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        transformed[snakeKey] = data[key];
    }
    return transformed;
}

// Helper to extract the storage path from a public URL
const getPathFromUrl = (url: string): string | null => {
    if (!url || !url.includes('/storage/v1/object/public/product_images')) {
        return null;
    }
    try {
        const urlObject = new URL(url);
        const parts = urlObject.pathname.split('/');
        const bucketName = 'product_images';
        const bucketIndex = parts.indexOf(bucketName);
        if (bucketIndex === -1 || bucketIndex + 1 >= parts.length) {
            console.warn(`Could not determine image path from URL: ${url}`);
            return null;
        }
        return parts.slice(bucketIndex + 1).join('/');
    } catch (error) {
        console.error(`Invalid URL provided to getPathFromUrl: ${url}`, error);
        return null;
    }
};


const api = {
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error.message || error);
      return [];
    }
    return fromSupabase(data) as Product[];
  },

  getProductById: async (id: number): Promise<Product | undefined> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error(`Error fetching product ${id}:`, error.message || error);
      return undefined;
    }
    return fromSupabase(data) as Product | undefined;
  },
  
  saveProduct: async (
    productData: Partial<Omit<Product, 'id' | 'createdAt'>>,
    imageFile: File | null,
    existingProduct: Product | null
  ): Promise<Product> => {
    let finalProductData = { ...productData };
    let newImageUrl: string | null = null;
    const oldImageUrl: string | null = existingProduct?.imageUrl || null;

    if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('product_images')
            .upload(fileName, imageFile);

        if (uploadError) {
            throw new Error(`فشل رفع الصورة: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
            .from('product_images')
            .getPublicUrl(fileName);
        
        newImageUrl = urlData.publicUrl;
        finalProductData.imageUrl = newImageUrl;
        // ** FIX: Always overwrite the images array when a new file is uploaded **
        finalProductData.images = [newImageUrl];
    }

    try {
        let savedData;
        if (existingProduct) {
            const { data, error } = await supabase
                .from('products')
                .update(toSupabase(finalProductData))
                .eq('id', existingProduct.id)
                .select()
                .single();
            if (error) throw error;
            savedData = data;
        } else {
            const { data, error } = await supabase
                .from('products')
                .insert(toSupabase(finalProductData))
                .select()
                .single();
            if (error) throw error;
            savedData = data;
        }

        if (imageFile && oldImageUrl && oldImageUrl !== newImageUrl) {
            try {
                const oldImagePath = getPathFromUrl(oldImageUrl);
                if (oldImagePath) {
                    await supabase.storage.from('product_images').remove([oldImagePath]);
                }
            } catch (deleteErr: any) {
                console.warn(`تم حفظ المنتج، لكن فشل حذف الصورة القديمة: ${deleteErr.message}`);
            }
        }
        
        return fromSupabase(savedData) as Product;

    } catch (dbError: any) {
        if (newImageUrl) {
            console.warn("فشل عملية قاعدة البيانات، سيتم محاولة حذف الصورة المرفوعة...");
            const newImagePath = getPathFromUrl(newImageUrl);
            if(newImagePath) {
                await supabase.storage.from('product_images').remove([newImagePath]).catch(cleanupErr => console.error("فشل حذف الصورة بعد فشل العملية:", cleanupErr));
            }
        }
        throw new Error(`فشل حفظ المنتج في قاعدة البيانات: ${dbError.message}`);
    }
  },

  // New function to publish a user-designed product
  savePublishedProduct: async (
    productData: Partial<Omit<Product, 'id' | 'createdAt'>>,
    imageFile: File,
  ): Promise<Product> => {
    let newImageUrl: string | null = null;
    
    // 1. Upload the composite image file
    const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `published/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(fileName, imageFile);

    if (uploadError) {
        throw new Error(`فشل رفع صورة التصميم: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
        .from('product_images')
        .getPublicUrl(fileName);
    
    newImageUrl = urlData.publicUrl;
    
    // 2. Prepare product data for insertion
    const finalProductData = {
      ...productData,
      imageUrl: newImageUrl,
      images: [newImageUrl],
      category: 'تصاميم المستخدمين', // Assign a specific category
      stock: 999, // Assume print-on-demand
      rating: 0,
      reviews: 0,
    };

    // 3. Insert the new product into the database
    try {
        const { data, error } = await supabase
            .from('products')
            .insert(toSupabase(finalProductData))
            .select()
            .single();
        if (error) throw error;
        
        return fromSupabase(data) as Product;

    } catch (dbError: any) {
        // If DB operation fails, try to clean up the uploaded image
        console.warn("فشل عملية قاعدة البيانات، سيتم محاولة حذف الصورة المرفوعة...");
        const newImagePath = getPathFromUrl(newImageUrl);
        if(newImagePath) {
            await supabase.storage.from('product_images').remove([newImagePath]).catch(cleanupErr => console.error("فشل حذف الصورة بعد فشل العملية:", cleanupErr));
        }
        throw new Error(`فشل نشر المنتج في قاعدة البيانات: ${dbError.message}`);
    }
  },

  deleteProduct: async (product: Product): Promise<void> => {
    console.error(`Attempting to delete product ID: ${product.id}`);
    const imagePath = getPathFromUrl(product.imageUrl);

    // الخطوة 1: حذف المنتج من قاعدة البيانات أولاً. هذا هو الإجراء الأهم.
    const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

    if (dbError) {
        // إذا فشل حذف قاعدة البيانات، نتوقف فوراً ونبلغ عن الخطأ.
        console.error('DATABASE DELETE FAILED:', dbError);
        throw new Error(`فشل حذف المنتج من قاعدة البيانات: ${dbError.message}`);
    }

    // الخطوة 2: إذا نجح حذف قاعدة البيانات، نحاول حذف الصورة من التخزين.
    if (imagePath) {
        const { error: storageError } = await supabase.storage
            .from('product_images')
            .remove([imagePath]);

        if (storageError) {
            // هذا ليس خطأً فادحاً للمستخدم، لأن المنتج تم حذفه بالفعل.
            // نسجل تحذيراً للمطور لمراجعته لاحقاً.
            console.warn(`تم حذف المنتج بنجاح، لكن فشل حذف الصورة (${imagePath}) من التخزين: ${storageError.message}`);
        }
    }
  },
  
  getOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error.message || error);
        return [];
    }
    
    const transformedData = fromSupabase(data) as any[];
    return transformedData.map(order => ({
        ...order,
        createdAt: new Date(order.createdAt),
    })) as Order[];
  },
  
  updateOrderStatus: async (orderId: string, status: Order['status']): Promise<Order | undefined> => {
     const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();
    
     if (error) {
        console.error(`Error updating order ${orderId}:`, error.message || error);
        return undefined;
     }

     return fromSupabase(data) as Order | undefined;
  },
  
  submitOrder: async (orderData: Omit<Order, 'id' | 'status' | 'createdAt'>): Promise<Order> => {
    const orderToInsert = toSupabase({
      ...orderData,
      status: 'pending',
    });
    
    const { data, error } = await supabase
        .from('orders')
        .insert(orderToInsert)
        .select()
        .single();

    if (error) {
        console.error('Error submitting order:', error.message || error);
        throw new Error('Could not submit order');
    }

    return fromSupabase(data) as Order;
  },
};

export default api;
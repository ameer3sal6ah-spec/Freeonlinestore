
import { GoogleGenAI, Modality } from "@google/genai";
import { supabase } from './supabaseClient';
import { Product, Order } from '../types';

// Centralized AI client initialization with robust error handling for missing API key.
let ai: GoogleGenAI;
const apiKey = process.env.API_KEY;

if (!apiKey) {
    // This console error helps developers diagnose the environmental setup issue.
    console.error("Google AI API key is not configured in process.env.API_KEY. AI features will fail.");
    // Create a dummy object so the app doesn't crash on load. 
    // The functions below will handle the error gracefully for the user.
    ai = {} as GoogleGenAI; 
} else {
    ai = new GoogleGenAI({ apiKey });
}

export async function generateProductDescription(productName: string, category: string): Promise<string> {
  // First, check if the AI client was initialized correctly.
  if (!apiKey || !ai.models) {
    throw new Error("مفتاح API الخاص بـ Google AI غير مُعدّ. يرجى مراجعة إعدادات بيئة التشغيل.");
  }

  const prompt = `اكتب وصفًا تسويقيًا جذابًا ومختصرًا (حوالي 3-4 أسطر) لمنتج اسمه "${productName}" وهو من فئة "${category}". يجب أن يكون الوصف باللغة العربية ومناسبًا لمتجر إلكتروني. ركز على إبراز جودة المنتج أو فائدته للمشتري.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error generating product description with Gemini:", error);
    const errorMessage = (error instanceof Error) ? error.message : String(error);

    // Provide a clear, actionable error message for the specific API key error from the backend.
    if (errorMessage.includes("API key not valid")) {
        throw new Error("مفتاح API الخاص بـ Google AI غير صالح. يرجى التأكد من صحة المفتاح في إعدادات بيئة التشغيل.");
    }
    
    // Generic error for other API issues.
    throw new Error("فشل إنشاء الوصف بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى لاحقاً.");
  }
}

/**
 * Removes the background from an image using the Gemini API.
 * @param base64ImageData The base64 encoded string of the image.
 * @param mimeType The MIME type of the image (e.g., 'image/png').
 * @returns A base64 encoded string of the image with the background removed.
 */
export async function removeImageBackground(base64ImageData: string, mimeType: string): Promise<string> {
    if (!apiKey || !ai.models) {
        throw new Error("مفتاح API الخاص بـ Google AI غير مُعدّ. يرجى مراجعة إعدادات بيئة التشغيل.");
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: 'remove the background, make it transparent',
                    },
                ],
            },
            config: {
                // Per guidelines, both modalities are required for image editing.
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data; // Return the base64 of the new image
            }
        }
        throw new Error("AI did not return an image. It might have returned text instead.");
    } catch (error) {
        console.error("Error removing image background with Gemini:", error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        if (errorMessage.includes("API key not valid")) {
            throw new Error("مفتاح API الخاص بـ Google AI غير صالح. يرجى التأكد من صحة المفتاح في إعدادات بيئة التشغيل.");
        }
        throw new Error("فشل إزالة الخلفية. حاول مرة أخرى بصورة مختلفة.");
    }
}

/**
 * Saves a user-designed product to the database and storage.
 * @param name The name of the new product.
 * @param price The selling price.
 * @param imageBlob The final design image as a Blob.
 * @returns The newly created product.
 */
export async function savePublishedProduct(name: string, price: number, imageBlob: Blob): Promise<Product> {
    if (!supabase) {
        throw new Error("Supabase client is not initialized.");
    }

    // 1. Upload the final design image to Supabase Storage
    const fileName = `designs/${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(fileName, imageBlob, {
            contentType: 'image/png',
        });

    if (uploadError) {
        console.error('Error uploading design image:', uploadError);
        throw new Error('فشل رفع صورة التصميم.');
    }

    const { data: { publicUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(fileName);

    if (!publicUrl) {
        throw new Error('لم يتم العثور على رابط الصورة بعد الرفع.');
    }

    // 2. Insert the new product into the 'products' table
    const productData = {
        name,
        price,
        description: `تصميم فريد تم إنشاؤه بواسطة أحد مستخدمي المنصة.`,
        image_url: publicUrl,
        category: 'تصاميم المستخدمين', // Special category for user designs
        stock: 999, // Assume high stock for on-demand products
        rating: 5,
        reviews: 0,
    };

    const { data, error: insertError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();
    
    if (insertError) {
        console.error('Error saving published product:', insertError);
        throw new Error('فشل حفظ المنتج الجديد في قاعدة البيانات.');
    }
    
    // FIX: Map snake_case from db to camelCase for the app type
    return { 
        ...data, 
        createdAt: data.created_at, 
        imageUrl: data.image_url,
        originalPrice: data.original_price,
    } as Product;
}


const api = {
  // Product Functions
  async getProducts(): Promise<Product[]> {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
    // FIX: Map snake_case from db to camelCase for the app type
    return data.map(p => ({ ...p, createdAt: p.created_at, imageUrl: p.image_url, originalPrice: p.original_price })) as Product[];
  },

  async getProductById(id: number): Promise<Product | null> {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error(`Error fetching product with id ${id}:`, error);
      // 'PGRST116' is the code for "JSON object requested, but row not found"
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    // FIX: Map snake_case from db to camelCase for the app type
    return data ? { ...data, createdAt: data.created_at, imageUrl: data.image_url, originalPrice: data.original_price } as Product : null;
  },

  async saveProduct(
    productData: Partial<Omit<Product, 'id' | 'createdAt'>>,
    imageFile: File | null,
    existingProduct: Product | null
  ): Promise<Product> {
    if (!supabase) throw new Error("Supabase client not initialized.");
    let imageUrl = existingProduct?.imageUrl;

    // 1. Handle image upload if a new file is provided
    if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('product_images')
            .upload(filePath, imageFile);
        
        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw new Error('فشل رفع الصورة.');
        }

        const { data: { publicUrl } } = supabase.storage
            .from('product_images')
            .getPublicUrl(filePath);
        
        imageUrl = publicUrl;

        // Optional: remove the old image if updating
        if (existingProduct && existingProduct.imageUrl) {
            const oldFileName = existingProduct.imageUrl.split('/').pop();
            if (oldFileName) {
                await supabase.storage.from('product_images').remove([`products/${oldFileName}`]);
            }
        }
    }
    
    if (!imageUrl && !existingProduct) {
        throw new Error('صورة المنتج مطلوبة.');
    }
    
    // FIX: Map camelCase from app to snake_case for Supabase
    const { originalPrice, imageUrl: _imageUrl, ...restOfData } = productData;
    
    const dataToUpsert: any = {
        ...existingProduct,
        ...restOfData,
        image_url: imageUrl,
        original_price: originalPrice,
    };
    delete dataToUpsert.createdAt; // Don't send this back
    delete dataToUpsert.imageUrl; // remove camelCase version
    
    // 2. Upsert (update or insert) product data
    const { data, error } = await supabase
        .from('products')
        .upsert(dataToUpsert)
        .select()
        .single();
    
    if (error) {
        console.error('Error saving product:', error);
        throw new Error('فشل حفظ بيانات المنتج.');
    }
    
    // FIX: Map snake_case from db to camelCase for the app type
    return { ...data, createdAt: data.created_at, originalPrice: data.original_price, imageUrl: data.image_url } as Product;
  },

  async deleteProduct(product: Product): Promise<void> {
    if (!supabase) throw new Error("Supabase client not initialized.");
    // 1. Delete the image from storage
    if (product.imageUrl) {
        const fileName = product.imageUrl.split('/').pop();
        if (fileName) {
            const { error: storageError } = await supabase.storage
                .from('product_images')
                .remove([`products/${fileName}`]);
            if (storageError) {
                // Log the error but proceed to delete the record, as it's more critical
                console.error(`Could not delete image for product ${product.id}:`, storageError);
            }
        }
    }

    // 2. Delete the product record
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);
    
    if (error) {
        console.error(`Error deleting product ${product.id}:`, error);
        throw error;
    }
  },

  // Order Functions
  async getOrders(): Promise<Order[]> {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
    // FIX: Map snake_case from db to camelCase and parse items
    return data.map(o => ({ ...o, createdAt: o.created_at, customerName: o.customer_name, items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items })) as Order[];
  },

  async submitOrder(orderData: Omit<Order, 'id' | 'status' | 'createdAt'>): Promise<Order> {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const dataToInsert = {
        customer_name: orderData.customerName,
        phone: orderData.phone,
        address: orderData.address,
        city: orderData.city,
        items: JSON.stringify(orderData.items), // Supabase JSONB expects stringified JSON
        total: orderData.total,
        status: 'pending',
    };

    const { data, error } = await supabase
        .from('orders')
        .insert(dataToInsert)
        .select()
        .single();

    if (error) {
        console.error("Error submitting order:", error);
        throw error;
    }
    return { ...data, createdAt: data.created_at, customerName: data.customer_name, items: JSON.parse(data.items) } as Order;
  },
  
  async updateOrderStatus(orderId: string, newStatus: Order['status']): Promise<Order | null> {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating order status:", error);
        return null;
    }
    return { ...data, createdAt: data.created_at, customerName: data.customer_name, items: JSON.parse(data.items) } as Order;
  },
};

export default api;

import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { generateProductDescription } from '../../services/api';
import { SparklesIcon } from '../icons/Icons';

interface ProductFormModalProps {
  product: Product | null;
  onSave: (productData: Partial<Omit<Product, 'id' | 'createdAt'>>, imageFile: File | null) => void;
  onClose: () => void;
  isSaving: boolean;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ product, onSave, onClose, isSaving }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    originalPrice: '',
    description: '',
    stock: '',
    category: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [aiError, setAiError] = useState('');


  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: String(product.price),
        originalPrice: product.originalPrice ? String(product.originalPrice) : '',
        description: product.description,
        stock: String(product.stock),
        category: product.category,
      });
      setPreviewUrl(product.imageUrl);
    } else {
      setFormData({ name: '', price: '', originalPrice: '', description: '', stock: '', category: '' });
      setPreviewUrl(null);
    }
    setImageFile(null);
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleGenerateDescription = async () => {
    if (!formData.name) {
        setAiError('يرجى إدخال اسم المنتج أولاً.');
        return;
    }
    setIsGeneratingDesc(true);
    setAiError('');
    try {
        const generatedDescription = await generateProductDescription(formData.name, formData.category);
        setFormData(prev => ({ ...prev, description: generatedDescription }));
    } catch (error: any) {
        setAiError(error.message);
    } finally {
        setIsGeneratingDesc(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    const dataToSave = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price || '0'),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        stock: parseInt(formData.stock || '0', 10),
        // These are usually aggregated, so we remove them from manual entry for simplicity
        rating: product?.rating || 4.5, 
        reviews: product?.reviews || 0,
        images: product?.images || [], // Keep existing additional images
    };
    onSave(dataToSave, imageFile);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
        <form onSubmit={handleSubmit}>
            <fieldset disabled={isSaving} className="group">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-6">{product ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">اسم المنتج</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 group-disabled:bg-gray-100" required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">صورة المنتج الرئيسية</label>
                            <div className="mt-2 flex items-center space-x-4 space-x-reverse">
                                {previewUrl && <img src={previewUrl} alt="معاينة" className="w-24 h-24 object-cover rounded-md bg-gray-100 border" />}
                                <div className="w-full">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageChange} 
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 group-disabled:pointer-events-none"
                                    />
                                    {!product && !imageFile && <p className="text-xs text-red-600 mt-1">حقل الصورة مطلوب عند إنشاء منتج جديد.</p>}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">السعر (ج.م)</label>
                            <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 group-disabled:bg-gray-100" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">السعر الأصلي (اختياري)</label>
                            <input type="number" step="0.01" name="originalPrice" value={formData.originalPrice} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 group-disabled:bg-gray-100" />
                        </div>
                        <div className="md:col-span-2">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">الوصف</label>
                                <button
                                    type="button"
                                    onClick={handleGenerateDescription}
                                    disabled={!formData.name || isGeneratingDesc || isSaving}
                                    className="flex items-center space-x-2 space-x-reverse px-2 py-1 text-xs font-semibold text-teal-700 bg-teal-50 rounded-full hover:bg-teal-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    <SparklesIcon className="w-4 h-4" />
                                    <span>{isGeneratingDesc ? 'جاري الإنشاء...' : 'إنشاء بالذكاء الاصطناعي'}</span>
                                </button>
                            </div>
                            <textarea 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                rows={4} 
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 group-disabled:bg-gray-100" 
                                required
                                placeholder={isGeneratingDesc ? "جاري إنشاء وصف تسويقي جذاب..." : ""}
                            ></textarea>
                            {aiError && <p className="text-xs text-red-600 mt-1">{aiError}</p>}
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">المخزون</label>
                            <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 group-disabled:bg-gray-100" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">الفئة</label>
                            <input type="text" name="category" value={formData.category} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 group-disabled:bg-gray-100" required />
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-2 space-x-reverse rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 group-disabled:opacity-50">
                        إلغاء
                    </button>
                    <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 group-disabled:bg-gray-400">
                        {isSaving ? (product ? 'جاري الحفظ...' : 'جاري الإنشاء...') : (product ? 'حفظ التعديلات' : 'إنشاء المنتج')}
                    </button>
                </div>
            </fieldset>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
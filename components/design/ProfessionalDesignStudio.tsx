import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: The 'fabric' library is imported as a namespace because the module does not have a named export 'fabric'.
import * as fabric from 'fabric';
import { SparklesIcon } from '../icons/Icons';
import { removeImageBackground, savePublishedProduct, generateAiImage } from '../../services/api';

const FONT_FAMILIES = [
    { name: 'كايرو', value: 'Cairo, sans-serif' },
    { name: 'تجاول', value: 'Tajawal, sans-serif' },
    { name: 'شنجا', value: 'Changa, sans-serif' },
];

// Helper to convert data URL to Blob
function dataURLtoBlob(dataurl: string): Blob {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}


const ProfessionalDesignStudio: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [activeObject, setActiveObject] = useState<fabric.Object | fabric.ActiveSelection | null>(null);
    const [isLoading, setIsLoading] = useState({ bg: false, ai: false, publish: false });
    const [generalError, setGeneralError] = useState('');
    const [canvasError, setCanvasError] = useState('');
    
    // Image editing states
    const [imageColor, setImageColor] = useState('#FFFFFF');
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [saturation, setSaturation] = useState(0);
    
    // State to force re-render when a fabric object property changes
    const [updateCounter, setUpdateCounter] = useState(0);
    const forceUpdate = () => setUpdateCounter(c => c + 1);

    // AI State
    const [aiPrompt, setAiPrompt] = useState('');
    
    // Publish Modal State
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [publishName, setPublishName] = useState('');
    const [publishPrice, setPublishPrice] = useState('');


    const updateLoadingState = (key: keyof typeof isLoading, value: boolean) => {
        setIsLoading(prev => ({ ...prev, [key]: value }));
    };

    const initializeCanvas = useCallback(() => {
        try {
            if (!canvasRef.current || !containerRef.current) {
                // Defer if refs are not ready
                setTimeout(initializeCanvas, 50);
                return;
            };

            if (containerRef.current.offsetWidth === 0) {
                 // Defer if container has no width yet
                setTimeout(initializeCanvas, 50);
                return;
            }
            
            const containerWidth = containerRef.current.offsetWidth;
            const canvasHeight = containerWidth * 1.2; // Maintain a good aspect ratio

            const canvas = new fabric.Canvas(canvasRef.current, {
                width: containerWidth,
                height: canvasHeight,
                backgroundColor: '#ffffff'
            });
            fabricCanvasRef.current = canvas;

            // Event listeners for object selection
            const onObjectSelected = (e: fabric.IEvent) => {
                setActiveObject(e.target || null);
            };
            const onSelectionCleared = () => {
                setActiveObject(null);
            };
            canvas.on('selection:created', onObjectSelected);
            canvas.on('selection:updated', onObjectSelected);
            canvas.on('selection:cleared', onSelectionCleared);
            
            canvas.renderAll();

            return () => {
                canvas.off('selection:created', onObjectSelected);
                canvas.off('selection:updated', onObjectSelected);
                canvas.off('selection:cleared', onSelectionCleared);
                canvas.dispose();
                fabricCanvasRef.current = null;
            };
        } catch (error) {
            console.error("Failed to initialize Fabric.js canvas:", error);
            setCanvasError("فشل تحميل استوديو التصميم. الرجاء تحديث الصفحة والمحاولة مرة أخرى.");
        }
    }, []);

    useEffect(() => {
        const cleanup = initializeCanvas();
        // Handle window resize
        const handleResize = () => {
             if (fabricCanvasRef.current && containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const canvasHeight = containerWidth * 1.2;
                fabricCanvasRef.current.setDimensions({ width: containerWidth, height: canvasHeight });
                fabricCanvasRef.current.renderAll();
             }
        };
        window.addEventListener('resize', handleResize);
        
        return () => {
            if (cleanup) cleanup();
            window.removeEventListener('resize', handleResize);
        };
    }, [initializeCanvas]);
    
    // Effect to update UI controls when the active object changes
    useEffect(() => {
        const firstObject = activeObject && 'getObjects' in activeObject ? (activeObject as fabric.ActiveSelection).getObjects()[0] : activeObject;

        if (firstObject && firstObject.type === 'image' && fabric.filters) {
            const img = firstObject as fabric.Image;
            img.filters = img.filters || [];

            const brightnessFilter = img.filters.find(f => f instanceof fabric.filters.Brightness) as fabric.filters.Brightness | undefined;
            const contrastFilter = img.filters.find(f => f instanceof fabric.filters.Contrast) as fabric.filters.Contrast | undefined;
            const saturationFilter = img.filters.find(f => f instanceof fabric.filters.Saturation) as fabric.filters.Saturation | undefined;
            const tintFilter = img.filters.find(f => f instanceof fabric.filters.BlendColor) as fabric.filters.BlendColor | undefined;

            setBrightness(brightnessFilter?.brightness || 0);
            setContrast(contrastFilter?.contrast || 0);
            setSaturation(saturationFilter?.saturation || 0);
            setImageColor(tintFilter?.color || '#FFFFFF');
        } else {
            // Reset sliders when no image is selected
            setBrightness(0);
            setContrast(0);
            setSaturation(0);
            setImageColor('#FFFFFF');
        }
    }, [activeObject]);

    // Effect to apply all image filters when their values change
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        const activeObj = canvas?.getActiveObject();
        if (!activeObj || activeObj.type !== 'image' || !fabric.filters) return;
        
        const activeImg = activeObj as fabric.Image;
        activeImg.filters = activeImg.filters || [];

        // Remove old adjustment filters to avoid stacking them
        activeImg.filters = activeImg.filters.filter(f =>
            !(f instanceof fabric.filters.Brightness) &&
            !(f instanceof fabric.filters.Contrast) &&
            !(f instanceof fabric.filters.Saturation) &&
            !(f instanceof fabric.filters.BlendColor)
        );

        // Add new filters only if their values are not the default
        if (brightness !== 0) {
            activeImg.filters.push(new fabric.filters.Brightness({ brightness }));
        }
        if (contrast !== 0) {
            activeImg.filters.push(new fabric.filters.Contrast({ contrast }));
        }
        if (saturation !== 0) {
            activeImg.filters.push(new fabric.filters.Saturation({ saturation }));
        }
        // Always add the tint filter, even if the color is white
        activeImg.filters.push(new fabric.filters.BlendColor({
            color: imageColor,
            mode: 'tint',
            alpha: 0.5
        }));

        activeImg.applyFilters();
        canvas.renderAll();
    }, [brightness, contrast, saturation, imageColor, activeObject]);

    const addText = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const text = new fabric.Textbox('نص جديد', {
            left: canvas.getCenter().left,
            top: canvas.getCenter().top,
            width: 150,
            fontSize: 28,
            fill: '#000000',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            fontFamily: FONT_FAMILIES[0].value,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        
        // Manually sync state after programmatic addition
        setActiveObject(text);
        
        canvas.renderAll();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const canvas = fabricCanvasRef.current;
        if (!file || !canvas) return;

        setGeneralError('');
        const reader = new FileReader();

        reader.onload = (f) => {
            const dataUrl = f.target?.result as string;
            
            const imageElement = document.createElement('img');
            imageElement.src = dataUrl;

            imageElement.onload = () => {
                if (imageElement.naturalWidth === 0 || imageElement.naturalHeight === 0) {
                     setGeneralError("ملف الصورة فارغ أو تالف.");
                     return;
                }

                const img = new fabric.Image(imageElement);
                const canvasWidth = canvas.getWidth();
                const canvasHeight = canvas.getHeight();

                // Intelligently scale the image to fit within 80% of the canvas
                const imgWidth = img.width || imageElement.naturalWidth;
                const imgHeight = img.height || imageElement.naturalHeight;
                const maxWidth = canvasWidth * 0.8;
                const maxHeight = canvasHeight * 0.8;
                
                let scale = 1;
                // Scale down only if the image is larger than the bounding box
                if (imgWidth > maxWidth || imgHeight > maxHeight) {
                    scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
                }

                img.set({
                    left: canvas.getCenter().left,
                    top: canvas.getCenter().top,
                    originX: 'center',
                    originY: 'center',
                }).scale(scale);

                canvas.add(img);
                canvas.setActiveObject(img);
                setActiveObject(img);
                canvas.renderAll();
            };

            imageElement.onerror = () => {
                setGeneralError("فشل تحميل الصورة. قد يكون نوع الملف غير مدعوم أو الملف تالف.");
            };
        };
        
        reader.onerror = () => {
            setGeneralError("فشل في قراءة ملف الصورة.");
        };

        reader.readAsDataURL(file);

        // Reset the input field to allow re-uploading the same file
        e.target.value = '';
    };

    const handleRemoveBackground = async () => {
        const canvas = fabricCanvasRef.current;
        const activeObj = canvas?.getActiveObject();
        if (!activeObj || activeObj.type !== 'image') {
            setGeneralError("الرجاء تحديد صورة أولاً.");
            return;
        }
        const activeImg = activeObj as fabric.Image;

        updateLoadingState('bg', true);
        setGeneralError('');
        
        try {
            const dataUrl = activeImg.toDataURL({ format: 'png' });
            const base64Data = dataUrl.split(',')[1];
            
            const resultBase64 = await removeImageBackground(base64Data, 'image/png');
            const newImageUrl = `data:image/png;base64,${resultBase64}`;

            fabric.Image.fromURL(newImageUrl, (newImg) => {
                newImg.set({
                    left: activeImg.left,
                    top: activeImg.top,
                    angle: activeImg.angle,
                    scaleX: activeImg.scaleX,
                    scaleY: activeImg.scaleY,
                    originX: 'center',
                    originY: 'center',
                });
                canvas.remove(activeImg);
                canvas.add(newImg);
                canvas.setActiveObject(newImg);
                setActiveObject(newImg);
                canvas.renderAll();
            });
        } catch (error: any) {
            setGeneralError(error.message || "فشل إزالة الخلفية.");
        } finally {
            updateLoadingState('bg', false);
        }
    };

    const handleDeleteObject = () => {
        const canvas = fabricCanvasRef.current;
        if (!activeObject || !canvas) return;
        
        if (activeObject.type === 'activeSelection') {
            (activeObject as fabric.ActiveSelection).getObjects().forEach(obj => canvas.remove(obj));
        } else {
            canvas.remove(activeObject);
        }
        
        setActiveObject(null);
        canvas.discardActiveObject();
        canvas.renderAll();
    };

    const handleGroupObjects = () => {
        const canvas = fabricCanvasRef.current;
        const activeSelection = canvas?.getActiveObject();
        if (!canvas || !activeSelection || activeSelection.type !== 'activeSelection') return;
        
        (activeSelection as fabric.ActiveSelection).toGroup();
        canvas.requestRenderAll();
        // The selection events will update the active object state to the new group
    };

    const handleUngroupObjects = () => {
        const canvas = fabricCanvasRef.current;
        const activeGroup = canvas?.getActiveObject();
        if (!canvas || !activeGroup || activeGroup.type !== 'group') return;
        
        (activeGroup as fabric.Group).toActiveSelection();
        canvas.requestRenderAll();
        // The selection events will update the active object state to the new active selection
    };

    const handleTextColorChange = (color: string) => {
        const canvas = fabricCanvasRef.current;
        const activeText = canvas?.getActiveObject();
        if (activeText && activeText.type === 'textbox') {
            (activeText as fabric.Textbox).set('fill', color);
            canvas.renderAll();
            forceUpdate(); // Force React to re-read properties from activeObject
        }
    };

    const handleFontFamilyChange = (font: string) => {
        const canvas = fabricCanvasRef.current;
        const activeText = canvas?.getActiveObject();
        if (activeText && activeText.type === 'textbox') {
            (activeText as fabric.Textbox).set('fontFamily', font);
            canvas.renderAll();
            forceUpdate(); // Force React to re-read properties from activeObject
        }
    };

    const handleGenerateAiImage = async () => {
        if (!aiPrompt.trim()) {
            setGeneralError('يرجى كتابة وصف للصورة أو الشعار.');
            return;
        }
        updateLoadingState('ai', true);
        setGeneralError('');
        const canvas = fabricCanvasRef.current;
        if (!canvas) {
            updateLoadingState('ai', false);
            return;
        };
        
        try {
            const base64Image = await generateAiImage(aiPrompt);
            const imageUrl = `data:image/png;base64,${base64Image}`;

            fabric.Image.fromURL(imageUrl, (img) => {
                const scale = 200 / (img.width || 200);
                img.set({
                    left: canvas.getCenter().left,
                    top: canvas.getCenter().top,
                    originX: 'center',
                    originY: 'center',
                }).scale(scale);
                canvas.add(img);
                canvas.setActiveObject(img);
                // Manually sync state for the new AI image
                setActiveObject(img);
                canvas.renderAll();
            });

        } catch (error: any) {
            console.error('AI image generation error:', error);
            setGeneralError(error.message || 'حدث خطأ أثناء إنشاء الصورة. يرجى المحاولة مرة أخرى.');
        } finally {
            updateLoadingState('ai', false);
        }
    };
    
    const downloadDesign = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Target a high resolution for printing, e.g., 4000px wide.
        const TARGET_EXPORT_WIDTH = 4000;
        const multiplier = TARGET_EXPORT_WIDTH / canvas.getWidth();

        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: multiplier,
        });
        
        const link = document.createElement('a');
        link.download = 'design-high-resolution.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePublish = async () => {
        if (!publishName || !publishPrice) {
            setGeneralError("يرجى إدخال اسم وسعر للتصميم.");
            return;
        }
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        updateLoadingState('publish', true);
        setGeneralError('');

        try {
            // Use high-resolution export for the published product
            const TARGET_EXPORT_WIDTH = 1200; // Good quality for web store
            const multiplier = TARGET_EXPORT_WIDTH / canvas.getWidth();
            const dataUrl = canvas.toDataURL({ format: 'png', multiplier: multiplier });

            const blob = dataURLtoBlob(dataUrl);
            await savePublishedProduct(publishName, parseFloat(publishPrice), blob);
            
            alert(`تم نشر تصميمك "${publishName}" بنجاح!`);
            setIsPublishModalOpen(false);
            setPublishName('');
            setPublishPrice('');

        } catch (error: any) {
            setGeneralError(error.message || "فشل نشر التصميم.");
        } finally {
            updateLoadingState('publish', false);
        }
    };

    const isTextObject = activeObject?.type === 'textbox';
    const isImageObject = activeObject?.type === 'image';
    const isMultiSelection = activeObject?.type === 'activeSelection';
    const isGroup = activeObject?.type === 'group';

    // For text properties, get from the object only if it's a single text object
    const currentTextColor = isTextObject ? String((activeObject as fabric.Textbox).fill) : '#000000';
    const currentFontFamily = isTextObject ? (activeObject as fabric.Textbox).fontFamily : FONT_FAMILIES[0].value;
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Controls Panel */}
            <aside className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg h-fit sticky top-28">
                <h2 className="text-2xl font-bold mb-6 border-b pb-4">أدوات التصميم</h2>
                {generalError && <p className="text-red-500 bg-red-100 p-2 rounded-md text-sm mb-4">{generalError}</p>}
                
                <div className="space-y-6">
                    {/* Add Elements */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3">1. أضف عناصر</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button onClick={addText} className="w-full bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">إضافة نص</button>
                             <label className="w-full bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-center">
                                رفع صورة
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                            <label className="w-full sm:col-span-2 bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-center">
                                رفع لوجو
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                        </div>
                    </div>
                                        
                    {/* AI Generation */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center"><SparklesIcon className="w-5 h-5 ms-2 text-yellow-500"/> 2. إنشاء بالذكاء الاصطناعي</h3>
                        <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="اطلب صورة، لوجو، أو خط فني..." rows={3} className="w-full border-gray-300 rounded-md shadow-sm" />
                        <button onClick={handleGenerateAiImage} disabled={isLoading.ai} className="w-full mt-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 disabled:bg-gray-400">
                            {isLoading.ai ? 'جاري الإنشاء...' : 'إنشاء تصميم'}
                        </button>
                    </div>

                    {/* ACTIONS: DELETE, GROUP, UNGROUP */}
                    {activeObject && (
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-semibold mb-3">إجراءات العنصر المحدد</h3>
                            <div className="space-y-3">
                                {isMultiSelection && (
                                    <button onClick={handleGroupObjects} className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600">
                                        تجميع العناصر (تثبيت)
                                    </button>
                                )}
                                {isGroup && (
                                    <button onClick={handleUngroupObjects} className="w-full bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-600">
                                        فك تجميع العناصر
                                    </button>
                                )}
                                <button onClick={handleDeleteObject} className="w-full bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600">
                                    حذف العنصر المحدد
                                </button>
                            </div>
                        </div>
                    )}


                    {/* ADVANCED TOOLS: TEXT & IMAGE EDITING */}
                    {activeObject && !isMultiSelection && (
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-semibold mb-3">أدوات متقدمة</h3>

                            {/* Text Tools */}
                            {isTextObject && (
                                <div className="space-y-4 p-3 bg-gray-50 rounded-md border">
                                    <h4 className="font-semibold text-gray-800 border-b pb-2 mb-3">أدوات النص</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">لون الخط</label>
                                        <input
                                            type="color"
                                            value={currentTextColor}
                                            onChange={(e) => handleTextColorChange(e.target.value)}
                                            className="mt-1 w-full h-10 p-1 border border-gray-300 rounded-md cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">نوع الخط</label>
                                        <select
                                            value={currentFontFamily}
                                            onChange={(e) => handleFontFamilyChange(e.target.value)}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
                                            style={{ fontFamily: currentFontFamily }}
                                        >
                                            {FONT_FAMILIES.map(font => (
                                                <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                                    {font.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Image Tools */}
                            {isImageObject && (
                                <>
                                    <button 
                                        onClick={handleRemoveBackground} 
                                        disabled={isLoading.bg}
                                        className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mb-4 flex items-center justify-center space-x-2 space-x-reverse"
                                    >
                                        <SparklesIcon className="w-5 h-5 text-yellow-300" />
                                        <span>{isLoading.bg ? 'جاري المعالجة...' : 'إزالة خلفية الصورة بالـ AI'}</span>
                                    </button>
                                    
                                    <div className="space-y-3 p-3 bg-gray-50 rounded-md border">
                                        <h4 className="font-semibold text-gray-800 border-b pb-2 mb-3">تعديلات الصورة</h4>
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            <label htmlFor="imageColor" className="text-sm font-medium text-gray-700">تلوين الصورة:</label>
                                            <input type="color" id="imageColor" value={imageColor} onChange={e => setImageColor(e.target.value)} className="w-10 h-10 p-1 rounded-md border border-gray-300 cursor-pointer" />
                                        </div>
                                        <div>
                                            <label htmlFor="brightness" className="block text-sm font-medium text-gray-700">السطوع: {Math.round(brightness * 100)}%</label>
                                            <input id="brightness" type="range" min="-1" max="1" step="0.05" value={brightness} onChange={e => setBrightness(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                        <div>
                                            <label htmlFor="contrast" className="block text-sm font-medium text-gray-700">التباين: {Math.round(contrast * 100)}%</label>
                                            <input id="contrast" type="range" min="-1" max="1" step="0.05" value={contrast} onChange={e => setContrast(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                        <div>
                                            <label htmlFor="saturation" className="block text-sm font-medium text-gray-700">التشبع: {Math.round(saturation * 100)}%</label>
                                            <input id="saturation" type="range" min="-1" max="1" step="0.05" value={saturation} onChange={e => setSaturation(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                 <div className="mt-8 border-t pt-6 space-y-3">
                     <button onClick={() => setIsPublishModalOpen(true)} className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-green-700 transition-colors">
                        نشر التصميم
                    </button>
                     <button onClick={downloadDesign} className="w-full bg-gray-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-800 transition-colors">
                        تحميل التصميم (جودة عالية)
                    </button>
                 </div>
            </aside>

            {/* Canvas Area */}
            <main ref={containerRef} className="lg:col-span-2 bg-gray-200 rounded-lg shadow-lg flex items-center justify-center p-4 relative overflow-hidden" style={{ minHeight: '80vh'}}>
                {canvasError ? (
                    <div className="text-center text-red-700 bg-red-100 p-6 rounded-lg border border-red-200">
                        <p className="font-bold text-lg">حدث خطأ في استوديو التصميم</p>
                        <p>{canvasError}</p>
                    </div>
                ) : (
                    <canvas ref={canvasRef} />
                )}
            </main>

            {/* Publish Modal */}
            {isPublishModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">نشر التصميم</h2>
                            <p className="text-gray-600 mb-6">سيتم إضافة تصميمك كمنتج جديد في المتجر ليتمكن الآخرون من شرائه.</p>
                            {generalError && <p className="text-red-500 text-sm mb-4">{generalError}</p>}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">اسم التصميم</label>
                                    <input type="text" value={publishName} onChange={e => setPublishName(e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" placeholder="مثال: هودي القط الفضائي" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">سعر البيع (ج.م)</label>
                                    <input type="number" value={publishPrice} onChange={e => setPublishPrice(e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm" placeholder="مثال: 299" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-2 space-x-reverse rounded-b-lg">
                           <button onClick={() => setIsPublishModalOpen(false)} disabled={isLoading.publish} className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50">إلغاء</button>
                           <button onClick={handlePublish} disabled={isLoading.publish || !publishName || !publishPrice} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400">
                                {isLoading.publish ? 'جاري النشر...' : 'تأكيد النشر'}
                           </button>
                        </div>
                      </div>
                 </div>
            )}
        </div>
    );
};

export default ProfessionalDesignStudio;
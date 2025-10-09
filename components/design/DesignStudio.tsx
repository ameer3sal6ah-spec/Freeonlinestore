
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { UploadIcon, Wand2Icon, TshirtIcon, Trash2Icon, ListIcon, PaletteIcon, TextIcon, PenToolIcon } from '../icons/Icons';
import api, { generateImageFromText, generateImageFromImageAndText } from '../../services/api';

// --- Configuration Data ---
const TSHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const APPAREL_PRODUCTS = [
    {
        id: 'tshirt-woman-long-sleeve',
        name: 'تيشرت نسائي',
        previewImage: 'https://i.ibb.co/kStx0g7/woman-long-sleeve.png',
        basePrice: 260,
        colors: [ { name: 'أسود', hex: '#2d3436', imageUrl: 'https://i.ibb.co/kStx0g7/woman-long-sleeve.png' } ]
    },
    {
        id: 'tshirt-man-short-sleeve',
        name: 'تيشرت رجالي',
        previewImage: 'https://i.ibb.co/9vVrw0V/man-short-sleeve.png',
        basePrice: 250,
        colors: [ { name: 'أبيض', hex: '#FFFFFF', imageUrl: 'https://i.ibb.co/9vVrw0V/man-short-sleeve.png' } ]
    },
    {
        id: 'tshirt-classic-hanger',
        name: 'تيشرت كلاسيك',
        previewImage: 'https://i.ibb.co/yQG12t5/classic-hanger.png',
        basePrice: 240,
        colors: [ { name: 'أسود', hex: '#2d3436', imageUrl: 'https://i.ibb.co/yQG12t5/classic-hanger.png' } ]
    },
    {
        id: 'tshirt-man-back',
        name: 'منظر خلفي',
        previewImage: 'https://i.ibb.co/hK8bYx5/man-back.png',
        basePrice: 250,
        colors: [ { name: 'أسود', hex: '#2d3436', imageUrl: 'https://i.ibb.co/hK8bYx5/man-back.png' } ]
    },
    {
        id: 'tshirt-man-long-sleeve',
        name: 'تيشرت كم طويل',
        previewImage: 'https://i.ibb.co/N2c7pHD/man-long-sleeve.png',
        basePrice: 270,
        colors: [ { name: 'أسود', hex: '#2d3436', imageUrl: 'https://i.ibb.co/N2c7pHD/man-long-sleeve.png' } ]
    }
];

type ApparelProduct = typeof APPAREL_PRODUCTS[0];
type ApparelColor = ApparelProduct['colors'][0];

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const mimeType = result.substring(5, result.indexOf(';'));
            const base64 = result.substring(result.indexOf(',') + 1);
            resolve({ base64, mimeType });
        };
        reader.onerror = error => reject(error);
    });
};

const SidebarSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; rightContent?: React.ReactNode }> = ({ title, icon, children, rightContent }) => (
    <div className="border-b border-gray-500/30 pb-5">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-bold text-gray-200 flex items-center">
                {icon}
                <span className="ms-2">{title}</span>
            </h3>
            {rightContent}
        </div>
        {children}
    </div>
);

type InteractionState = {
    type: 'drag' | 'resize' | null;
    element: 'logo' | 'text' | null;
    startX: number; startY: number;
    startPropX: number; startPropY: number;
    startPropW?: number;
};


const DesignStudio: React.FC = () => {
    const navigate = useNavigate();
    
    const defaultApparel = APPAREL_PRODUCTS.find(p => p.id === 'tshirt-classic-hanger') || APPAREL_PRODUCTS[0];
    const [selectedApparel, setSelectedApparel] = useState<ApparelProduct>(defaultApparel);
    const [selectedColor, setSelectedColor] = useState<ApparelColor>(defaultApparel.colors[0]);
    const [selectedSize, setSelectedSize] = useState(TSHIRT_SIZES[1]);
    
    // Design Elements State
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoPosition, setLogoPosition] = useState({ x: 50, y: 45, width: 30 });
    const [textElement, setTextElement] = useState({ content: '', color: '#FFFFFF', fontSize: 5, fontFamily: 'Cairo', x: 50, y: 65 });
    const [customTshirtUrl, setCustomTshirtUrl] = useState<string | null>(null);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [interaction, setInteraction] = useState<InteractionState>({ type: null, element: null, startX: 0, startY: 0, startPropX: 0, startPropY: 0 });
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // AI and other UI state
    const [aiMode, setAiMode] = useState<'design' | 'image' | 'logo'>('design');
    const [prompt, setPrompt] = useState('');
    const [imagePromptFile, setImagePromptFile] = useState<File | null>(null);
    const [imagePromptPreview, setImagePromptPreview] = useState<string | null>(null);
    const [aiError, setAiError] = useState('');
    const [publishMessage, setPublishMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const aiImageInputRef = useRef<HTMLInputElement>(null);
    const customTshirtInputRef = useRef<HTMLInputElement>(null);

    const handleSelectApparel = (apparel: ApparelProduct) => {
        setSelectedApparel(apparel);
        setSelectedColor(apparel.colors[0]);
    };
    
    const handleRemoveDesign = (elementType: 'logo' | 'text') => {
        if (elementType === 'logo') {
            setLogoUrl(null);
        } else {
            setTextElement(prev => ({ ...prev, content: '' }));
        }
    };
    
    const handleCustomImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCustomTshirtUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomTshirtUrl(reader.result as string);
                setLogoUrl(null);
                setTextElement(prev => ({ ...prev, content: '' }));
            };
            reader.readAsDataURL(file);
        }
    };

     const handleImagePromptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImagePromptFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePromptPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleGenerateDesign = async () => {
        if (!prompt) { setAiError('يرجى كتابة وصف للتصميم المطلوب.'); return; }
        
        setIsGenerating(true); 
        setAiError(''); 
        setLogoUrl(null);
        
        try {
            let finalPrompt: string;
            let generatedBase64: string;

            if (aiMode === 'logo') {
                finalPrompt = `أنشئ شعارًا (لوجو) أو تصميم نص فني احترافي بناءً على النص التالي: "${prompt}". يجب أن يكون التصميم كعنصر واحد نظيف وبخلفية شفافة تمامًا ليتم وضعه على ملابس.`;
                generatedBase64 = await generateImageFromText(finalPrompt);
            } else if (aiMode === 'image') {
                if (!imagePromptFile) {
                    setAiError('يرجى رفع صورة كمرجع للتصميم.');
                    setIsGenerating(false);
                    return;
                }
                const { base64, mimeType } = await fileToBase64(imagePromptFile);
                finalPrompt = `مهمتك هي تعديل الصورة المرفقة بناءً على الطلب التالي: "${prompt}". يجب أن تكون النتيجة النهائية هي الصورة المعدلة فقط، بدون أي نصوص أو تعليقات إضافية.`;
                generatedBase64 = await generateImageFromImageAndText(base64, mimeType, finalPrompt);
            } else { // aiMode === 'design'
                finalPrompt = `أنشئ تصميمًا جرافيكيًا احترافيًا ومبتكرًا ليتم طباعته على تي شيرت. يجب أن يكون التصميم جذابًا وعالي الجودة ومناسبًا للطباعة. الفكرة الرئيسية للتصميم هي: "${prompt}". يجب أن يكون التصميم كعنصر واحد مع خلفية شفافة إن أمكن.`;
                generatedBase64 = await generateImageFromText(finalPrompt);
            }
           
            setLogoUrl(`data:image/png;base64,${generatedBase64}`);
        } catch (error: any) {
            setAiError(`حدث خطأ أثناء إنشاء التصميم: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };
    
    // --- NEW: Function to generate composite image and publish ---
    const generateCompositeImage = (): Promise<File> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('Failed to get canvas context');

            const baseImage = new Image();
            baseImage.crossOrigin = "anonymous"; // Important for external images
            baseImage.src = customTshirtUrl || selectedColor.imageUrl;

            baseImage.onload = () => {
                canvas.width = baseImage.naturalWidth;
                canvas.height = baseImage.naturalHeight;
                ctx.drawImage(baseImage, 0, 0);

                const drawLogo = () => {
                    if (logoUrl) {
                        const logoImage = new Image();
                        logoImage.crossOrigin = "anonymous";
                        logoImage.src = logoUrl;
                        logoImage.onload = () => {
                            const w = canvas.width * (logoPosition.width / 100);
                            const h = (w / logoImage.naturalWidth) * logoImage.naturalHeight;
                            const x = canvas.width * (logoPosition.x / 100) - w / 2;
                            const y = canvas.height * (logoPosition.y / 100) - h / 2;
                            ctx.drawImage(logoImage, x, y, w, h);
                            drawText(); // Draw text after logo
                        };
                        logoImage.onerror = () => { drawText(); }; // Continue even if logo fails
                    } else {
                        drawText(); // No logo, just draw text
                    }
                };

                const drawText = () => {
                    if (textElement.content) {
                        const fontSizeInPixels = (textElement.fontSize / 100) * canvas.width;
                        ctx.font = `${fontSizeInPixels}px ${textElement.fontFamily}`;
                        ctx.fillStyle = textElement.color;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const x = canvas.width * (textElement.x / 100);
                        const y = canvas.height * (textElement.y / 100);
                        ctx.fillText(textElement.content, x, y);
                    }
                    finalizeImage();
                };

                const finalizeImage = () => {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], 'published-design.png', { type: 'image/png' }));
                        } else {
                            reject('Failed to create blob from canvas');
                        }
                    }, 'image/png');
                };

                drawLogo(); // Start the drawing chain
            };
            baseImage.onerror = () => reject('Failed to load base T-shirt image');
        });
    };

    const handlePublishDesign = async () => {
        if (!logoUrl && !textElement.content) {
            setPublishMessage({ type: 'error', text: 'يرجى إضافة تصميم أو نص أولاً لنشره.' });
            return;
        }
        setIsPublishing(true);
        setPublishMessage({ type: '', text: '' });

        try {
            const compositeImageFile = await generateCompositeImage();
            
            const isCustomTshirt = !!customTshirtUrl;
            const productName = prompt ? `تيشرت بتصميم: ${prompt}`.substring(0, 50) : (isCustomTshirt ? 'تيشرت بتصميم وصورة مخصصة' : `${selectedApparel.name} بتصميم مخصص`);
            const price = isCustomTshirt ? 299 : selectedApparel.basePrice;

            const productData = {
                name: productName,
                price: price,
                description: `تصميم فريد تم إنشاؤه بواسطة أحد مبدعي المتجر. اللون: ${isCustomTshirt ? 'مخصص' : selectedColor.name}.`,
            };
            
            const newProduct = await api.savePublishedProduct(productData, compositeImageFile);

            setPublishMessage({ type: 'success', text: `تم نشر تصميمك بنجاح! يمكنك مشاهدته الآن.` });
            setTimeout(() => navigate(`/product/${newProduct.id}`), 2000);

        } catch (error: any) {
            setPublishMessage({ type: 'error', text: `فشل النشر: ${error.message}` });
        } finally {
            setIsPublishing(false);
        }
    };


    const handleInteractionStart = (e: React.MouseEvent, type: 'drag' | 'resize', element: 'logo' | 'text') => {
        e.preventDefault();
        e.stopPropagation();
        const startProps = element === 'logo' ? logoPosition : textElement;
        setInteraction({
            type, element,
            startX: e.clientX, startY: e.clientY,
            startPropX: startProps.x, startPropY: startProps.y,
            startPropW: 'width' in startProps ? startProps.width : undefined,
        });
    };

    const handleInteractionMove = useCallback((e: MouseEvent) => {
        if (!interaction.type || !previewContainerRef.current) return;
        
        const { width: containerWidth, height: containerHeight } = previewContainerRef.current.getBoundingClientRect();
        const dx = ((e.clientX - interaction.startX) / containerWidth) * 100;
        const dy = ((e.clientY - interaction.startY) / containerHeight) * 100;

        const updateState = (updater: (prevState: any) => any) => {
            if (interaction.element === 'logo') setLogoPosition(updater);
            else setTextElement(updater);
        };

        if (interaction.type === 'drag') {
            updateState(prev => ({ ...prev, x: interaction.startPropX + dx, y: interaction.startPropY + dy }));
        } else if (interaction.type === 'resize' && interaction.startPropW !== undefined) {
            const newWidth = Math.max(5, interaction.startPropW + dx);
            updateState(prev => ({ ...prev, width: newWidth }));
        }
    }, [interaction]);

    const handleInteractionEnd = useCallback(() => {
        setInteraction({ type: null, element: null, startX: 0, startY: 0, startPropX: 0, startPropY: 0 });
    }, []);

    useEffect(() => {
        if (interaction.type) {
            window.addEventListener('mousemove', handleInteractionMove);
            window.addEventListener('mouseup', handleInteractionEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleInteractionMove);
            window.removeEventListener('mouseup', handleInteractionEnd);
        };
    }, [interaction.type, handleInteractionMove, handleInteractionEnd]);
    
    const previewImageUrl = customTshirtUrl || selectedColor.imageUrl;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-gray-100 p-4 rounded-lg min-h-[85vh]">
            <div ref={previewContainerRef} className="lg:col-span-8 bg-gray-200 rounded-lg flex items-center justify-center p-4 relative overflow-hidden select-none">
                <div className="absolute inset-0 bg-repeat bg-center opacity-5" style={{backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cGF0aCBmaWxsPSIjMDAwMDAwIiBkPSJNMjcuNDIgMy42N2ExIDEgMCAwIDAtMS40MSAwTDE2IDIxLjU5TDYgMTEuNTlhMSAxIDAgMCAwLTEuNDEgMS40MWwxMSA5YTEgMSAwIDAgMCAxLjQxIDBsMTEtOWExIDEgMCAwIDAgMC0xLjQxWiIvPjwvc3ZnPg==')"}}></div>
                <div className="relative w-full max-w-lg transition-all duration-500" key={previewImageUrl}>
                    <img src={previewImageUrl} alt="T-shirt" className="w-full h-auto pointer-events-none" />

                    {/* Logo Element */}
                    {logoUrl && !isGenerating && (
                         <div className="absolute cursor-move" style={{ top: `${logoPosition.y}%`, left: `${logoPosition.x}%`, width: `${logoPosition.width}%`, transform: 'translate(-50%, -50%)' }} onMouseDown={(e) => handleInteractionStart(e, 'drag', 'logo')}>
                            <div className="relative w-full h-full">
                                <img src={logoUrl} alt="Design" className="w-full h-auto pointer-events-none" />
                                <div className="absolute -inset-1 border-2 border-dashed border-cyan-400 opacity-75"></div>
                                <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-cyan-400 rounded-full cursor-se-resize" onMouseDown={(e) => handleInteractionStart(e, 'resize', 'logo')}></div>
                            </div>
                        </div>
                    )}

                    {/* Text Element */}
                    {textElement.content && !isGenerating && (
                        <div className="absolute cursor-move" style={{ top: `${textElement.y}%`, left: `${textElement.x}%`, transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap' }} onMouseDown={(e) => handleInteractionStart(e, 'drag', 'text')}>
                           <div className="relative p-2" style={{ color: textElement.color, fontFamily: textElement.fontFamily, fontSize: `${textElement.fontSize}vw`}}>
                                {textElement.content}
                                <div className="absolute -inset-0 border-2 border-dashed border-purple-400 opacity-75"></div>
                           </div>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                            <svg className="animate-spin h-10 w-10 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="mt-3 text-teal-700 font-semibold">الذكاء الاصطناعي يبدع...</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-4 bg-[#34495e] text-white rounded-lg p-5 flex flex-col">
                <div className="overflow-y-auto flex-grow pe-2 space-y-5">
                    <SidebarSection 
                        title="المنتج" 
                        icon={<TshirtIcon className="w-5 h-5"/>}
                        rightContent={
                            !customTshirtUrl && (
                                <button onClick={() => customTshirtInputRef.current?.click()} className="text-xs text-teal-400 hover:text-teal-300 font-semibold">
                                    رفع صورة تيشرت
                                </button>
                            )
                        }
                    >
                        <input type="file" accept="image/*" onChange={handleCustomTshirtUpload} ref={customTshirtInputRef} className="hidden" />
                        {customTshirtUrl ? (
                             <div>
                                <img src={customTshirtUrl} alt="Custom T-shirt" className="w-full h-auto object-cover rounded-sm mb-2" />
                                <button onClick={() => setCustomTshirtUrl(null)} className="text-red-400 hover:text-red-300 text-sm font-semibold w-full text-left">
                                    إزالة واستخدام المنتجات الجاهزة
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
                                {APPAREL_PRODUCTS.map(apparel => (
                                    <button key={apparel.id} onClick={() => handleSelectApparel(apparel)} className={`text-center group block bg-gray-700/50 rounded-md p-2 transition-all duration-200 border-2 ${selectedApparel.id === apparel.id ? 'border-teal-500' : 'border-transparent hover:border-gray-500'}`}>
                                        <img src={apparel.previewImage} alt={apparel.name} className="w-full h-auto object-cover rounded-sm mb-2 aspect-square" />
                                        <h3 className="text-xs font-semibold text-gray-200 truncate">{apparel.name}</h3>
                                    </button>
                                ))}
                            </div>
                        )}
                    </SidebarSection>
                    
                    <SidebarSection title="التصميم" icon={<UploadIcon className="w-5 h-5"/>}>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 rounded-lg border-2 border-dashed border-gray-500 font-medium text-gray-300 hover:bg-gray-700/50 hover:border-teal-500 transition"><UploadIcon className="w-5 h-5" /><span>رفع شعار (Logo)</span></button>
                        <input type="file" accept="image/*" onChange={handleCustomImageUpload} ref={fileInputRef} className="hidden" />
                         {logoUrl && <button onClick={() => handleRemoveDesign('logo')} className="text-red-400 hover:text-red-300 text-sm font-semibold mt-2 -mb-2 w-full text-left">إزالة الشعار</button>}
                    </SidebarSection>

                    <SidebarSection title="إضافة نص" icon={<TextIcon className="w-5 h-5"/>}>
                        <input type="text" placeholder="اكتب هنا..." value={textElement.content} onChange={e => setTextElement(p => ({...p, content: e.target.value}))} className="w-full p-2 border bg-gray-700/50 border-gray-600/50 rounded-md text-sm text-white focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400"/>
                        <div className="flex items-center space-x-4 space-x-reverse mt-2">
                           <label htmlFor="text-size" className="text-sm font-medium text-gray-300">الحجم:</label>
                           <input id="text-size" type="range" min="2" max="15" step="0.5" value={textElement.fontSize} onChange={e => setTextElement(p => ({...p, fontSize: parseFloat(e.target.value)}))} className="w-full flex-grow"/>
                           <label htmlFor="text-color" className="text-sm font-medium text-gray-300">اللون:</label>
                           <input id="text-color" type="color" value={textElement.color} onChange={e => setTextElement(p => ({...p, color: e.target.value}))} className="w-8 h-8 p-0 border-none rounded-md bg-transparent cursor-pointer" style={{ appearance: 'none', WebkitAppearance: 'none' }}/>
                        </div>
                    </SidebarSection>
                    
                    {!customTshirtUrl && (
                        <SidebarSection title="اختر الألوان" icon={<PaletteIcon className="w-5 h-5"/>} rightContent={<span className="text-xs text-gray-400">{selectedColor.name}</span>}>
                            <div className="flex flex-wrap gap-3">{selectedApparel.colors.map(color => (<button key={color.name} onClick={() => setSelectedColor(color)} className={`w-8 h-8 rounded-full border-2 transition-transform transform hover:scale-110 ${selectedColor.hex === color.hex ? 'border-white scale-110' : 'border-gray-500/50'}`} style={{ backgroundColor: color.hex }} aria-label={color.name} />))}</div>
                        </SidebarSection>
                    )}
                    
                     <SidebarSection title="اختر المقاس" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 21H3L9 3h6l6 18Z"/><path d="M12 3v18"/><path d="M9.5 12h5"/></svg>}>
                        <div className="flex flex-wrap gap-2">{TSHIRT_SIZES.map(size => (<button key={size} onClick={() => setSelectedSize(size)} className={`px-3 py-1 rounded-md border text-sm font-medium transition ${selectedSize === size ? 'bg-teal-500 text-white border-teal-500' : 'bg-gray-700/50 text-gray-200 border-transparent hover:bg-gray-600/50'}`}>{size}</button>))}</div>
                     </SidebarSection>

                    <SidebarSection title="مساعد التصميم بالذكاء الاصطناعي" icon={<Wand2Icon className="w-5 h-5"/>}>
                         <div className="bg-gray-900/30 rounded-md p-3 space-y-3">
                            <div className="grid grid-cols-3 bg-gray-700/50 rounded-lg p-1 gap-1">
                                <button onClick={() => setAiMode('design')} className={`py-1 text-xs font-semibold rounded-md transition flex items-center justify-center space-x-1 space-x-reverse ${aiMode === 'design' ? 'bg-teal-600' : 'hover:bg-gray-600/50'}`}>
                                    <TshirtIcon className="w-4 h-4" /><span>تصميم كامل</span>
                                </button>
                                <button onClick={() => setAiMode('image')} className={`py-1 text-xs font-semibold rounded-md transition flex items-center justify-center space-x-1 space-x-reverse ${aiMode === 'image' ? 'bg-teal-600' : 'hover:bg-gray-600/50'}`}>
                                    <UploadIcon className="w-4 h-4" /><span>من صورة</span>
                                </button>
                                <button onClick={() => setAiMode('logo')} className={`py-1 text-xs font-semibold rounded-md transition flex items-center justify-center space-x-1 space-x-reverse ${aiMode === 'logo' ? 'bg-teal-600' : 'hover:bg-gray-600/50'}`}>
                                    <PenToolIcon className="w-4 h-4" /><span>شعار/نص</span>
                                </button>
                            </div>

                            {aiMode === 'image' && (
                                <div>
                                    <button onClick={() => aiImageInputRef.current?.click()} className="w-full flex items-center justify-center space-x-2 space-x-reverse p-2 text-sm rounded-lg border-2 border-dashed border-gray-500 text-gray-300 hover:border-teal-500 transition">
                                        <UploadIcon className="w-4 h-4" />
                                        <span>{imagePromptFile ? imagePromptFile.name : 'اختر صورة مرجعية'}</span>
                                    </button>
                                    <input type="file" accept="image/*" ref={aiImageInputRef} onChange={handleImagePromptUpload} className="hidden" />
                                    {imagePromptPreview && <img src={imagePromptPreview} alt="Image prompt preview" className="mt-2 w-full h-auto rounded-md object-cover" />}
                                </div>
                            )}

                            <textarea 
                                value={prompt} 
                                onChange={(e) => setPrompt(e.target.value)} 
                                placeholder={
                                    aiMode === 'design' ? 'اكتب وصف تصميم كامل للتيشرت...' :
                                    aiMode === 'image' ? 'اكتب تعليمات التعديل على الصورة...' :
                                    'اكتب اسم الشعار أو النص الاحترافي...'
                                }
                                rows={2} 
                                className="w-full p-2 border bg-gray-700/50 border-gray-600/50 rounded-md text-sm text-white focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400"
                            ></textarea>
                            
                            <button onClick={handleGenerateDesign} disabled={isGenerating} className="w-full flex items-center justify-center space-x-2 space-x-reverse bg-teal-600 text-white font-semibold py-2 rounded-md hover:bg-teal-700 transition disabled:bg-gray-500">
                                <Wand2Icon className="w-5 h-5"/> <span>{isGenerating ? 'جاري الإنشاء...' : 'أنشئ التصميم'}</span>
                            </button>
                            {aiError && <p className="text-xs text-red-400 text-center mt-2">{aiError}</p>}
                         </div>
                    </SidebarSection>
                </div>
                
                <div className="mt-auto pt-5 border-t border-gray-500/50">
                    <div className="flex justify-between items-center mb-3"><span className="text-lg font-medium text-gray-300">سعر المنتج:</span><span className="text-3xl font-bold text-white">{(customTshirtUrl ? 299 : selectedApparel.basePrice).toFixed(2)} ج.م</span></div>
                    <button onClick={handlePublishDesign} disabled={isPublishing} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg hover:bg-teal-600 transition text-lg disabled:bg-gray-500">
                        {isPublishing ? 'جاري النشر...' : 'نشر التصميم'}
                    </button>
                    {publishMessage.text && (<p className={`text-center font-semibold mt-2 text-sm ${publishMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{publishMessage.text}</p>)}
                </div>
            </div>
        </div>
    );
};

export default DesignStudio;
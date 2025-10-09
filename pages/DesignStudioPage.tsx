import React from 'react';
import ProfessionalDesignStudio from '../components/design/ProfessionalDesignStudio';

const DesignStudioPage: React.FC = () => {
    return (
        <div className="bg-gray-100">
            <div className="container mx-auto px-4 sm:px-6 py-12">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                        <span className="block">استوديو التصميم الاحترافي</span>
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        أطلق العنان لإبداعك. أضف صوراً، نصوصاً، واستخدم الذكاء الاصطناعي لتصميم تيشرتك الفريد.
                    </p>
                </div>
                <ProfessionalDesignStudio />
            </div>
        </div>
    );
};

export default DesignStudioPage;
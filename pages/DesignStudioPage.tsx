
import React from 'react';
import DesignStudio from '../components/design/DesignStudio';

const DesignStudioPage: React.FC = () => {
    return (
        <div>
            <div className="container mx-auto px-4 sm:px-6 py-12">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                        <span className="block">استوديو تصميم التيشرتات</span>
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        أطلق العنان لإبداعك. اختر، صمم، وارتدي تيشرتك الفريد من نوعه.
                    </p>
                </div>
                <DesignStudio />
            </div>
        </div>
    );
};

export default DesignStudioPage;
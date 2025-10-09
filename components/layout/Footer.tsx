
import React from 'react';
import { YouTubeIcon } from '../icons/Icons';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="container mx-auto px-6 py-6 text-center text-gray-500">
        <div className="flex justify-center mb-4">
          <a 
            href="https://www.youtube.com/@user-dalil_alribh7" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-500 hover:text-red-600 transition-colors duration-300"
            aria-label="قناة اليوتيوب"
          >
            <YouTubeIcon className="w-7 h-7" />
          </a>
        </div>
        <p>&copy; {new Date().getFullYear()} Profit store. جميع الحقوق محفوظة.</p>
        <p className="text-sm mt-2">تم إنشاء الموقع بواسطة Mohamed Abd Alall</p>
      </div>
    </footer>
  );
};

export default Footer;
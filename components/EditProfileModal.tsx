import React, { useState, useEffect, useRef } from 'react';
import { User } from '../AuthContext';
import { useLanguage } from '../LanguageContext';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  const { t } = useLanguage();
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = () => {
    onSave({
      ...user,
      name,
      avatar
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatar(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 flex flex-col" onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-text-main">{t('settings.editProfileTitle')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-text-main transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          {/* Avatar Preview */}
          <div className="flex justify-center mb-2">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div 
                className="size-24 rounded-full bg-cover bg-center border border-slate-200"
                style={{ backgroundImage: `url("${avatar || 'https://picsum.photos/100/100'}")` }}
              ></div>
              <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="material-symbols-outlined text-white">camera_alt</span>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-main">{t('settings.nickname')}</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm outline-none transition-all"
            />
          </div>

           <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-main">头像 URL</label>
            <input 
              type="text" 
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm outline-none transition-all"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button 
            onClick={onClose} 
            className="flex-1 h-10 rounded-lg border border-slate-200 bg-white text-text-main font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button 
            onClick={handleSave} 
            className="flex-1 h-10 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors shadow-lg shadow-blue-200"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
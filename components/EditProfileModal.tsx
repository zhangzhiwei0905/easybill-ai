import React, { useState, useEffect, useRef } from 'react';
import { User, useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { api } from '../services/api';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = async () => {
    if (!token) {
      setError('请先登录');
      return;
    }

    if (!name.trim()) {
      setError('请输入昵称');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 调用 API 更新用户资料
      // avatar 可以是 base64 或 URL，后端需要处理
      const updatedUser = await api.users.updateProfile(
        {
          name: name.trim(),
          avatarUrl: avatar || undefined,
        },
        token
      );

      onSave(updatedUser);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 检查文件大小（限制为 2MB）
      if (file.size > 2 * 1024 * 1024) {
        setError('图片大小不能超过 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatar(e.target.result as string);
          setError(null);
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
          <p className="text-xs text-center text-text-sub">点击头像更换（支持 base64，最大 2MB）</p>

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
              value={avatar.startsWith('data:') ? '(已上传本地图片)' : avatar}
              onChange={(e) => {
                if (!e.target.value.startsWith('(已上传')) {
                  setAvatar(e.target.value);
                }
              }}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm outline-none transition-all text-slate-500"
              placeholder="https://..."
              disabled={avatar.startsWith('data:')}
            />
            {avatar.startsWith('data:') && (
              <button
                onClick={() => setAvatar('')}
                className="text-xs text-primary text-left"
              >
                清除本地图片，改用 URL
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-xs text-danger text-center">{error}</div>
          )}
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-10 rounded-lg border border-slate-200 bg-white text-text-main font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="flex-1 h-10 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '保存中...' : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;

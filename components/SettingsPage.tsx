import React, { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocal ? 'http://127.0.0.1:5000' : 'https://amirhmz.pythonanywhere.com';

interface Settings {
    caption_prompt: string;
    dm_prompt: string;
    interaction_hashtags: string[];
    interaction_comments: string[];
}

interface SettingsPageProps {
  isRateLimited: boolean;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ isRateLimited }) => {
    const [settings, setSettings] = useState<Settings>({
        caption_prompt: '',
        dm_prompt: '',
        interaction_hashtags: [],
        interaction_comments: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        setStatus(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/settings`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'خطا در دریافت تنظیمات.');
            setSettings(data);
        } catch (error: any) {
            setStatus({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    useEffect(() => {
        if (status) {
            const timer = setTimeout(() => setStatus(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const handleSave = async () => {
        setIsSaving(true);
        setStatus(null);
        try {
            const payload = {
                ...settings,
                interaction_hashtags: settings.interaction_hashtags.filter(h => h.trim() !== ''),
                interaction_comments: settings.interaction_comments.filter(c => c.trim() !== ''),
            };

            const response = await fetch(`${API_BASE_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'خطا در ذخیره تنظیمات.');
            setStatus({ type: 'success', text: data.message });
            setSettings(payload);
        } catch (error: any) {
            setStatus({ type: 'error', text: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSettingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'interaction_hashtags' || name === 'interaction_comments') {
            setSettings(prev => ({ ...prev, [name]: value.split('\n') }));
        } else {
            setSettings(prev => ({ ...prev, [name]: value }));
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-cyan-500" size={32} /></div>;
    }

    const anyLoading = isSaving || isRateLimited;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-white/10 max-w-5xl mx-auto">
                    <div className="text-center sm:text-right">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">تنظیمات پرامپت و ربات</h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
                            دستورالعمل‌های هوش مصنوعی و محتوای ربات را در اینجا ویرایش کنید.
                        </p>
                    </div>
                    <button onClick={handleSave} disabled={anyLoading} className="mt-4 sm:mt-0 flex-shrink-0 flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg transition transform hover:scale-105 disabled:opacity-50 w-full sm:w-auto">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        <span>ذخیره تغییرات</span>
                    </button>
                </div>

                <div className="max-w-5xl mx-auto">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">تنظیمات پرامپت هوش مصنوعی</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <label htmlFor="caption_prompt" className="block text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">پرامپت تولید کپشن پست</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">این دستورالعمل برای ساخت کپشن در بخش "ارسال محتوا" استفاده می‌شود.</p>
                            <textarea
                                id="caption_prompt"
                                name="caption_prompt"
                                value={settings.caption_prompt}
                                onChange={handleSettingChange}
                                rows={12}
                                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg p-4 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition duration-300 font-mono text-sm"
                                disabled={anyLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="dm_prompt" className="block text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">پرامپت تولید متن دایرکت</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">این دستورالعمل برای ساخت پیام در بخش "دایرکت هوشمند" استفاده می‌شود.</p>
                            <textarea
                                id="dm_prompt"
                                name="dm_prompt"
                                value={settings.dm_prompt}
                                onChange={handleSettingChange}
                                rows={12}
                                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg p-4 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300 font-mono text-sm"
                                disabled={anyLoading}
                            />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold mb-4 mt-8 text-gray-800 dark:text-white">محتوای ربات تعامل هوشمند</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div>
                            <label htmlFor="interaction_hashtags" className="block text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">لیست هشتگ‌ها</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">هر هشتگ در یک خط جدید. ربات برای تعامل در اکسپلور از این لیست استفاده می‌کند.</p>
                            <textarea
                                id="interaction_hashtags"
                                name="interaction_hashtags"
                                value={settings.interaction_hashtags.join('\n')}
                                onChange={handleSettingChange}
                                rows={12}
                                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg p-4 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition duration-300 font-mono text-sm"
                                disabled={anyLoading}
                            />
                        </div>
                        <div>
                           <label htmlFor="interaction_comments" className="block text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">لیست کامنت‌ها</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">هر کامنت در یک خط جدید. ربات به صورت تصادفی یکی را برای ارسال انتخاب می‌کند.</p>
                            <textarea
                                id="interaction_comments"
                                name="interaction_comments"
                                value={settings.interaction_comments.join('\n')}
                                onChange={handleSettingChange}
                                rows={12}
                                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg p-4 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
                                disabled={anyLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>
             {status && (
                 <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-xl flex items-center gap-3 text-sm font-semibold text-white ${
                    status.type === 'success' ? 'bg-green-500' :
                    status.type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                }`}>
                    {status.type === 'success' && <CheckCircle size={18} />}
                    {status.type === 'error' && <AlertTriangle size={18} />}
                    {status.type === 'info' && <Info size={18} />}
                    <span>{status.text}</span>
                </div>
              )}
        </div>
    );
};

export default SettingsPage;
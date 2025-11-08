import React, { useState, useEffect } from 'react';
import { Bot, Compass, Users, Loader2, CheckCircle, AlertTriangle, Info, XCircle, Timer, ThumbsUp, MessageSquare } from 'lucide-react';

type EngageTarget = 'discover' | 'followers';

interface SmartInteractionProps {
  isRateLimited: boolean;
}

const API_URLS = ['https://amirhmz.pythonanywhere.com', 'http://127.0.0.1:5000'];

const fetchWithFailover = async (path: string, options?: RequestInit): Promise<Response> => {
    let errorForFallback: any;
    try {
        const response = await fetch(`${API_URLS[0]}${path}`, options);
        if (response.status < 500) {
            return response;
        }
        errorForFallback = new Error(`Server error on primary URL: ${response.status}`);
    } catch (error) {
        errorForFallback = error;
    }
    console.warn(`Primary API call to ${path} failed, trying fallback.`, errorForFallback);
    return fetch(`${API_URLS[1]}${path}`, options);
};

const securityTips = [
    "هنگامی که ربات فعال است، وارد اکانت اینستاگرام خود از دستگاه دیگری نشوید تا از بروز اختلال جلوگیری کنید.",
    "هر زمان که احساس کردید تعامل به حد کافی بوده، به ربات و پیج استراحت دهید. استفاده مداوم ممکن است حساسیت‌زا باشد.",
    "برای طبیعی‌تر شدن فعالیت، لیست هشتگ‌ها و کامنت‌ها را در تنظیمات به طور منظم به‌روزرسانی کنید.",
    "از اجرای همزمان ربات تعامل هوشمند و دایرکت هوشمند برای مدت طولانی خودداری کنید تا فعالیت شما مشکوک به نظر نرسد.",
    "به یاد داشته باشید که هدف اصلی این ربات، افزایش تعامل طبیعی است. صبور باشید و اجازه دهید ربات با سرعت ایمن کار خود را انجام دهد.",
    "عملکرد ربات را زیر نظر داشته باشید. اگر متوجه رفتار غیرعادی شدید، عملیات را متوقف کرده و تنظیمات را بازبینی کنید.",
    "امنیت حساب شما اولویت است. از رمز عبور قوی و تایید دو مرحله‌ای برای اکانت اینستاگرام خود استفاده کنید."
];


const TargetOption: React.FC<{
  value: EngageTarget;
  title: string;
  description: string;
  icon: React.ReactNode;
  current: EngageTarget;
  onClick: (target: EngageTarget) => void;
  disabled: boolean;
}> = ({ value, title, description, icon, current, onClick, disabled }) => (
  <button
    onClick={() => onClick(value)}
    disabled={disabled}
    className={`p-4 rounded-lg border-2 text-right transition-all duration-300 flex items-start gap-4 disabled:opacity-60 disabled:cursor-not-allowed ${
      current === value
        ? 'border-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/20'
        : 'border-gray-200 dark:border-white/20 hover:bg-gray-500/10 dark:hover:bg-white/10'
    }`}
  >
    <div className={`mt-1 ${current === value ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-600 dark:text-gray-300'}`}>
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-gray-800 dark:text-white">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
  </button>
);

const InteractionStatusCard: React.FC<{ stats: { liked: number; commented: number; elapsed: string; message: string; } }> = ({ stats }) => (
    <div className="mb-6 max-w-3xl mx-auto p-4 bg-gray-500/10 dark:bg-white/5 border border-cyan-500/30 rounded-lg">
        <h3 className="text-center font-bold text-lg mb-4 text-cyan-600 dark:text-cyan-300">وضعیت تعامل هوشمند لحظه‌ای</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
             <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">لایک موفق</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <ThumbsUp className="text-green-500" size={20}/>
                    <p className="text-2xl font-bold">{stats.liked}</p>
                </div>
            </div>
             <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">کامنت موفق</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <MessageSquare className="text-blue-500" size={20}/>
                    <p className="text-2xl font-bold">{stats.commented}</p>
                </div>
            </div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">زمان سپری شده</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <Timer className="text-amber-500" size={20}/>
                    <p className="text-2xl font-bold font-mono">{stats.elapsed}</p>
                </div>
            </div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-500/20 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span>{stats.message || 'در حال تعامل...'}</span>
            </p>
        </div>
    </div>
);

const SmartInteraction: React.FC<SmartInteractionProps> = ({ isRateLimited }) => {
  const [target, setTarget] = useState<EngageTarget>('discover');
  const [isEngaging, setIsEngaging] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [engageStats, setEngageStats] = useState<{ liked: number; commented: number; elapsed: string; message: string; } | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showTip, setShowTip] = useState(true);
  const [randomTip, setRandomTip] = useState('');

  useEffect(() => {
    // Check initial status on mount
    const checkInitialStatus = async () => {
        try {
            const response = await fetchWithFailover('/api/interaction_status');
            const data = await response.json();
            if (data.running) {
                setIsEngaging(true);
            }
        } catch (error) {
            console.error("Failed to check initial interaction status:", error);
        }
    };
    checkInitialStatus();
  }, []);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        setStatus(null);
      }, 5000); // Hide after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    let tipInterval: number | undefined;

    if (isEngaging) {
        // Set an initial tip immediately
        setRandomTip(securityTips[Math.floor(Math.random() * securityTips.length)]);
        setShowTip(true);

        // Start an interval to change the tip every 15 seconds
        tipInterval = window.setInterval(() => {
            setRandomTip(securityTips[Math.floor(Math.random() * securityTips.length)]);
            setShowTip(true); // Re-show the banner with the new tip
        }, 60000); // 15 seconds
    }

    // Cleanup function to clear the interval when the component unmounts or isEngaging becomes false
    return () => {
        if (tipInterval) {
            clearInterval(tipInterval);
        }
    };
  }, [isEngaging]);


  useEffect(() => {
    if (!isEngaging) {
        setEngageStats(null);
        return;
    }

    const fetchStatus = async () => {
        try {
            const response = await fetchWithFailover('/api/interaction_status');
            const data = await response.json();
            
            if (response.ok && data.running) {
                const elapsedMs = ((Date.now() / 1000) - data.start_time) * 1000;
                const hours = String(Math.floor(elapsedMs / 3600000)).padStart(2, '0');
                const minutes = String(Math.floor((elapsedMs % 3600000) / 60000)).padStart(2, '0');
                const seconds = String(Math.floor((elapsedMs % 60000) / 1000)).padStart(2, '0');

                setEngageStats({
                    liked: data.liked,
                    commented: data.commented,
                    elapsed: `${hours}:${minutes}:${seconds}`,
                    message: data.message
                });
            } else {
                setIsEngaging(false);
                setStatus({ type: 'info', text: data.message || 'عملیات تعامل هوشمند متوقف شد.' });
            }
        } catch (error) {
            console.error("Failed to fetch interaction status:", error);
            setStatus({type: 'error', text: 'ارتباط برای دریافت وضعیت قطع شد.'});
            setIsEngaging(false);
        }
    };

    const intervalId = setInterval(fetchStatus, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId);
  }, [isEngaging]);


  const handleEngage = async () => {
    setIsEngaging(true); // Optimistically set to engaging
    setStatus(null);

    try {
      const response = await fetchWithFailover('/api/auto_engage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'خطا در شروع تعامل.');
      }
      setStatus({ type: 'info', text: data.message });
    } catch (error: any) {
      setStatus({ type: 'error', text: error.message });
      setIsEngaging(false); // Revert if start failed
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setStatus(null);

    // Immediately revert the UI to the 'idle' state, per user request.
    setIsEngaging(false); 
    
    try {
      const response = await fetchWithFailover('/api/cancel_task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: 'interaction' }),
      });
      const data = await response.json();

      if(!response.ok) {
        setStatus({ type: 'error', text: data.message || 'خطا در ارسال درخواست لغو' });
      } else {
        setStatus({ type: 'info', text: 'درخواست لغو ارسال شد. عملیات در پس‌زمینه متوقف خواهد شد.' });
      }

    } catch (error: any) {
        setStatus({ type: 'error', text: error.message });
    } finally {
        setIsCancelling(false);
    }
  }
  
  const TipBanner = () => (
    <div className="max-w-3xl mx-auto mb-6 p-4 bg-blue-100 dark:bg-blue-500/20 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200 rounded-lg relative">
        <div className="flex items-center">
            <Info size={20} className="ml-3 rtl:ml-0 rtl:mr-3 flex-shrink-0" />
            <div>
                <p className="font-bold">نکته امنیتی</p>
                <p className="text-sm">{randomTip}</p>
            </div>
        </div>
        <button
            onClick={() => setShowTip(false)}
            className="absolute top-2 left-2 p-1 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-500/30 rounded-full"
            aria-label="بستن نکته"
        >
            <XCircle size={18} />
        </button>
    </div>
  );


  return (
    <div className="relative flex flex-col h-full pb-16">
       <div className="flex-grow flex flex-col justify-center">
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent text-center">تعامل هوشمند خودکار</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto text-center text-sm">
          با لایک و کامنت خودکار، دیده شدن صفحه خود را افزایش دهید. ربات به طور مداوم این کار را انجام خواهد داد تا زمانی که شما آن را لغو کنید.
        </p>
        
        {isEngaging && showTip && randomTip && <TipBanner />}

        {isEngaging && engageStats && <InteractionStatusCard stats={engageStats} />}

        {isEngaging && (
            <div className="max-w-3xl mx-auto mb-6 p-4 bg-yellow-100 dark:bg-yellow-500/20 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 rounded-lg" role="alert">
                <div className="flex items-center">
                    <Info size={20} className="ml-3 rtl:ml-0 rtl:mr-3" />
                    <div>
                        <p className="font-bold">عملیات تعامل هوشمند در حال اجرا است.</p>
                        <p className="text-sm">برای شروع یک عملیات جدید، ابتدا باید عملیات فعلی را از طریق دکمه "لغو تعامل" متوقف کنید.</p>
                    </div>
                </div>
            </div>
        )}

        <div className="space-y-6 max-w-3xl mx-auto">
            {!isEngaging && (
                <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300 text-center">۱. هدف تعامل را انتخاب کنید:</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <TargetOption value="discover" title="اکسپلور با هشتگ" description="تعامل با پست‌های محبوب با هشتگ‌های تعریف شده در تنظیمات." icon={<Compass size={24} />} current={target} onClick={setTarget} disabled={isEngaging || isRateLimited} />
                        <TargetOption value="followers" title="پست‌های فالورها" description="تعامل با پست‌های اخیر برخی از فالورهای شما." icon={<Users size={24} />} current={target} onClick={setTarget} disabled={isEngaging || isRateLimited} />
                    </div>
                </div>
            )}
            
            <div className={`pt-4 ${!isEngaging ? 'border-t border-gray-200 dark:border-white/20' : ''}`}>
              <button 
                onClick={isEngaging ? handleCancel : handleEngage} 
                disabled={isCancelling || isRateLimited} 
                className={`w-full flex items-center justify-center gap-2 font-bold px-4 py-3 rounded-lg shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isEngaging ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white' : 'bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white'}`}
              >
                  {isCancelling ? <Loader2 className="animate-spin" /> : (isEngaging ? <XCircle size={20} /> : <Bot size={20} />)}
                  <span>{isCancelling ? 'در حال لغو...' : (isEngaging ? 'لغو تعامل' : 'شروع تعامل هوشمند')}</span>
              </button>
            </div>
        </div>
      </div>
      
      {status && (
         <div className={`absolute bottom-0 left-0 right-0 p-3 text-sm font-semibold text-center border-t border-gray-200 dark:border-white/10 flex items-center justify-center gap-2 ${
            status.type === 'success' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' :
            status.type === 'error' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' :
            'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
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

export default SmartInteraction;

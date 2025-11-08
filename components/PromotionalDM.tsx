import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles, Send, Loader2, CheckCircle, AlertTriangle, Info, Bot, Users, MailWarning, XCircle, Timer, ShieldOff } from 'lucide-react';

type DMTarget = 'smart_engagers' | 'random_contacts';

interface PromotionalDMProps {
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
    "برای جلوگیری از شناسایی شدن به عنوان اسپم، متن پیام خود را هر چند وقت یکبار تغییر دهید.",
    "بین کمپین‌های ارسال دایرکت، به حساب خود چند ساعت استراحت دهید تا فعالیت شما طبیعی به نظر برسد.",
    "از ارسال لینک‌های مشکوک یا کوتاه شده در پیام‌های خود خودداری کنید.",
    "مطمئن شوید که پیام شما برای مخاطب ارزش ایجاد می‌کند و صرفاً یک تبلیغ تکراری نیست.",
    "از اجرای همزمان ربات دایرکت و ربات تعامل برای مدت طولانی بپرهیزید.",
    "عملکرد ربات را زیر نظر داشته باشید. اگر تعداد خطاهای ارسال بالا رفت، عملیات را متوقف کنید.",
    "شخصی‌سازی پیام با استفاده از نام کاربری {username} می‌تواند تأثیرگذاری آن را افزایش دهد."
];

const TargetOption: React.FC<{
  value: DMTarget;
  title: string;
  description: string;
  icon: React.ReactNode;
  current: DMTarget;
  onClick: (target: DMTarget) => void;
  disabled: boolean;
}> = ({ value, title, description, icon, current, onClick, disabled }) => (
  <button
    onClick={() => onClick(value)}
    disabled={disabled}
    className={`p-3 rounded-lg border-2 text-right w-full transition-all duration-300 flex items-start gap-3 disabled:opacity-60 disabled:cursor-not-allowed ${
      current === value
        ? 'border-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/20'
        : 'border-gray-200 dark:border-white/20 hover:bg-gray-500/10 dark:hover:bg-white/10'
    }`}
  >
    <div className={`mt-1 ${current === value ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-600 dark:text-gray-300'}`}>
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-gray-800 dark:text-white text-sm">{title}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
  </button>
);

const DMStatusCard: React.FC<{ stats: { sent: number; failed: number; elapsed: string; message: string; } }> = ({ stats }) => (
    <div className="mb-6 max-w-3xl mx-auto p-4 bg-gray-500/10 dark:bg-white/5 border border-cyan-500/30 rounded-lg">
        <h3 className="text-center font-bold text-lg mb-4 text-cyan-600 dark:text-cyan-300">وضعیت ارسال لحظه‌ای</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ارسال موفق</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <CheckCircle className="text-green-500" size={20}/>
                    <p className="text-2xl font-bold">{stats.sent}</p>
                </div>
            </div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ارسال ناموفق</p>
                 <div className="flex items-center justify-center gap-2 mt-1">
                    <ShieldOff className="text-red-500" size={20}/>
                    <p className="text-2xl font-bold">{stats.failed}</p>
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
                <span>{stats.message || 'در حال ارسال...'}</span>
            </p>
        </div>
    </div>
);


const PromotionalDM: React.FC<PromotionalDMProps> = ({ isRateLimited }) => {
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<DMTarget>('smart_engagers');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [dmStats, setDmStats] = useState<{ sent: number; failed: number; elapsed: string; message: string; } | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showTip, setShowTip] = useState(true);
  const [randomTip, setRandomTip] = useState('');


  useEffect(() => {
    // Check initial status on mount
    const checkInitialStatus = async () => {
        try {
            const response = await fetchWithFailover('/api/dm_status');
            const data = await response.json();
            if (data.running) {
                setIsSending(true);
            }
        } catch (error) {
            console.error("Failed to check initial DM status:", error);
        }
    };
    checkInitialStatus();
  }, []);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);
  
  useEffect(() => {
    let tipInterval: number | undefined;

    if (isSending) {
        setRandomTip(securityTips[Math.floor(Math.random() * securityTips.length)]);
        setShowTip(true);

        tipInterval = window.setInterval(() => {
            setRandomTip(securityTips[Math.floor(Math.random() * securityTips.length)]);
            setShowTip(true);
        }, 60000);
    }

    return () => {
        if (tipInterval) {
            clearInterval(tipInterval);
        }
    };
  }, [isSending]);


  useEffect(() => {
    if (!isSending) {
        setDmStats(null);
        return;
    }

    const fetchStatus = async () => {
        try {
            const response = await fetchWithFailover('/api/dm_status');
            const data = await response.json();
            
            if (response.ok && data.running) {
                const elapsedMs = ((Date.now() / 1000) - data.start_time) * 1000;
                const hours = String(Math.floor(elapsedMs / 3600000)).padStart(2, '0');
                const minutes = String(Math.floor((elapsedMs % 3600000) / 60000)).padStart(2, '0');
                const seconds = String(Math.floor((elapsedMs % 60000) / 1000)).padStart(2, '0');

                setDmStats({
                    sent: data.sent,
                    failed: data.failed,
                    elapsed: `${hours}:${minutes}:${seconds}`,
                    message: data.message
                });
            } else {
                setIsSending(false);
                if(data.sent > 0 || data.failed > 0) {
                    setStatus({ type: 'info', text: `عملیات متوقف شد. ${data.sent} پیام موفق و ${data.failed} ناموفق بود.` });
                }
            }
        } catch (error) {
            console.error("Failed to fetch DM status:", error);
            setStatus({type: 'error', text: 'ارتباط برای دریافت وضعیت قطع شد.'});
            setIsSending(false);
        }
    };

    const intervalId = setInterval(fetchStatus, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId);
  }, [isSending]);


  const generateMessage = useCallback(async () => {
    setIsGenerating(true);
    setStatus(null);
    try {
      const response = await fetchWithFailover('/api/generate_caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_dm: true }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'خطا در تولید پیام.');
      }
      setMessage(data.caption);
      setStatus({ type: 'success', text: 'نمونه پیام با موفقیت تولید شد.' });
    } catch (error: any) {
      setMessage('');
      setStatus({ type: 'error', text: error.message });
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleSend = async () => {
    if (!message) {
      setStatus({ type: 'error', text: 'لطفاً ابتدا متنی برای پیام بنویسید.' });
      return;
    }
    
    setIsSending(true);
    setStatus(null);

    try {
      const response = await fetchWithFailover('/api/send_dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, target }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'خطا در شروع عملیات.');
      }
      setStatus({ type: 'info', text: data.message });
    } catch (error: any) {
        setStatus({ type: 'error', text: error.message });
        setIsSending(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setStatus(null);

    setIsSending(false); 
    
    try {
      const response = await fetchWithFailover('/api/cancel_task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: 'dm' }),
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
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent text-center">ارسال دایرکت تبلیغاتی</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto text-center text-sm">
           یک نمونه پیام با هوش مصنوعی تولید کنید، گروه مخاطب را انتخاب کرده و ارسال را شروع کنید. ربات به طور مداوم پیام‌ها را ارسال می‌کند تا زمانی که شما آن را متوقف کنید.
        </p>

        {isSending && showTip && randomTip && <TipBanner />}
        
        {isSending && dmStats && <DMStatusCard stats={dmStats} />}

        {isSending && (
            <div className="max-w-3xl mx-auto mb-6 p-4 bg-yellow-100 dark:bg-yellow-500/20 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 rounded-lg" role="alert">
                <div className="flex items-center">
                    <Info size={20} className="ml-3 rtl:ml-0 rtl:mr-3" />
                    <div>
                        <p className="font-bold">عملیات ارسال دایرکت در حال اجرا است.</p>
                        <p className="text-sm">برای شروع یک عملیات جدید، ابتدا باید عملیات فعلی را از طریق دکمه "لغو ارسال" متوقف کنید.</p>
                    </div>
                </div>
            </div>
        )}

        <div className="space-y-6 max-w-3xl mx-auto">
            {!isSending && (
              <>
                <div>
                  <label htmlFor="dm-message" className="block text-sm font-semibold mb-2 text-gray-600 dark:text-gray-300">۱. متن پیام:</label>
                  <textarea
                      id="dm-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="متن پیام خود را اینجا بنویسید یا با هوش مصنوعی یک نمونه تولید کنید..."
                      rows={5}
                      className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg p-4 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition duration-300"
                      disabled={isSending || isRateLimited}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300">۲. گروه مخاطبین را انتخاب کنید:</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <TargetOption value="smart_engagers" title="هوشمند (تعامل‌کنندگان)" description="ارسال به فالورهایی که اخیراً پست‌های شما را لایک کرده یا کامنت گذاشته‌اند." icon={<Bot size={24} />} current={target} onClick={setTarget} disabled={isSending || isRateLimited} />
                        <TargetOption value="random_contacts" title="تصادفی (فالور و فالویینگ)" description="ارسال به فالورها و فالویینگ‌ها به صورت تصادفی و غیر تکراری." icon={<Users size={24} />} current={target} onClick={setTarget} disabled={isSending || isRateLimited} />
                    </div>
                </div>
              </>
            )}
            
            <div className={`pt-4 ${!isSending ? 'border-t border-gray-200 dark:border-white/20' : ''}`}>
                <div className="flex flex-col sm:flex-row gap-4">
                  {!isSending && (
                      <button onClick={generateMessage} disabled={isGenerating || isSending || isRateLimited} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold px-4 py-3 rounded-lg transition transform hover:scale-105 disabled:opacity-50">
                          {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                          <span>تولید متن با هوش مصنوعی</span>
                      </button>
                  )}
                  <button 
                    onClick={isSending ? handleCancel : handleSend} 
                    disabled={isCancelling || isRateLimited || (isSending ? false : (isGenerating || !message))} 
                    className={`flex-1 flex items-center justify-center gap-2 font-bold px-4 py-3 rounded-lg shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isSending ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white' : 'bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white'}`}
                  >
                      {isCancelling ? <Loader2 className="animate-spin" /> : (isSending ? <XCircle size={20} /> : <Send size={20} />)}
                      <span>{isCancelling ? 'در حال لغو...' : (isSending ? 'لغو ارسال' : 'شروع ارسال')}</span>
                  </button>
                </div>
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

export default PromotionalDM;

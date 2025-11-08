import React, { useState, useEffect } from 'react';
import { ShieldCheck, LogIn, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaSolution, setCaptchaSolution] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challengeRequired, setChallengeRequired] = useState(false);

  const fetchCaptcha = async () => {
    setIsCaptchaLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/captcha');
      const data = await response.json();
      if (response.ok) {
        setCaptchaId(data.id);
        setCaptchaImage(data.image);
      } else {
        throw new Error(data.message || 'خطا در دریافت کپچا.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const body: any = {
        username,
        password,
        captcha_id: captchaId,
        captcha_solution: captchaSolution,
    };

    if (challengeRequired) {
        body.code = verificationCode;
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            // Always refresh captcha on login errors, as it's likely invalid after one attempt.
            if (data.message && data.message.toLowerCase().includes('captcha')) {
                fetchCaptcha();
                setCaptchaSolution('');
            }

            let errorMessage = data.message || 'خطای ناشناخته در ورود.';

            // Provide more specific, user-friendly messages based on status codes.
            switch (response.status) {
                case 401: // LoginRequired
                    errorMessage = "نام کاربری یا رمز عبور اشتباه است. لطفاً دوباره بررسی کنید.";
                    break;
                case 403: // Action Blocked / "feedback_required"
                    errorMessage = data.message || "اکانت شما توسط اینستاگرام محدود شده است. لطفاً ۲۴ ساعت صبر کرده و دوباره تلاش کنید.";
                    break;
                case 429: // Rate limited
                    errorMessage = "تعداد تلاش‌ها بیش از حد مجاز است. لطفاً چند دقیقه صبر کرده و دوباره امتحان کنید.";
                    break;
                case 400: // General client errors (like checkpoint, bad captcha)
                    if (data.message && data.message.includes('چالش امنیتی')) {
                        errorMessage = "ورود مشکوک شناسایی شد. لطفاً اپلیکیشن اینستاگرام یا ایمیل خود را برای تایید هویت بررسی کرده و سپس مجدداً وارد شوید.";
                    } else if (data.message && data.message.toLowerCase().includes('captcha')) {
                       errorMessage = "پاسخ سوال امنیتی (کپچا) اشتباه است. لطفاً دوباره تلاش کنید.";
                    } else if (data.message && data.message.includes('challenge_required')) {
                        errorMessage = "اینستاگرام یک چالش امنیتی شناسایی کرده است. لطفاً با باز کردن اپلیکیشن اینستاگرام یا ایمیل خود، هویت خود را تأیید کرده و سپس مجدداً برای ورود تلاش کنید. این ممکن است به دلیل ورود از یک مکان جدید یا فعالیت مشکوک باشد.";
                    }
                    break;
            }
            throw new Error(errorMessage);
        }

        if (data.success) {
            onLogin();
        } else if (data.two_factor) {
            setChallengeRequired(true);
            setError("کد تایید دو مرحله‌ای نیاز است. لطفاً کد را وارد کرده و دوباره تلاش کنید.");
        } else {
             // Fallback for unexpected successful responses without a success flag
            throw new Error(data.message || 'یک خطای غیرمنتظره رخ داد.');
        }
    } catch (err: any) {
        // Handle network errors specifically
        if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
            setError('امکان برقراری ارتباط با سرور وجود ندارد. لطفاً از اتصال اینترنت و فعال بودن سرور اطمینان حاصل کنید.');
        } else {
            setError(err.message);
        }
    } finally {
        setIsLoading(false);
    }
  };


  const logoUrl = "https://s34.picofile.com/file/8487733434/postino.png";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden border border-gray-300 dark:border-white/20">
            {/* Form Panel */}
            <div className="w-full md:w-1/2 bg-white/80 dark:bg-black/30 backdrop-blur-xl p-10">
                <form
                    onSubmit={handleSubmit}
                    className="w-full space-y-6"
                >
                    <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                        ورود به اینستاگرام
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">برای مدیریت حساب خود وارد شوید</p>
                    </div>
                    
                    {error && <div className="bg-red-500/20 dark:bg-red-500/30 border border-red-500 text-red-700 dark:text-red-200 text-sm rounded-lg p-3 text-center">{error}</div>}

                    {!challengeRequired && (
                    <>
                        <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="نام کاربری"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-3 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
                            disabled={isLoading}
                            required
                        />
                        <div className="relative w-full">
                            <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="رمز عبور"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-3 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300 pl-12"
                            disabled={isLoading}
                            required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 left-0 flex items-center px-4 text-gray-500 dark:text-gray-400 hover:text-cyan-500 transition-colors duration-300"
                                aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        </div>
                        
                        <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                            {isCaptchaLoading ? (
                            <div className="w-[150px] h-[50px] flex items-center justify-center bg-gray-200 dark:bg-white/10 rounded-lg border border-gray-300 dark:border-white/20">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
                            </div>
                            ) : (
                            <img src={captchaImage} alt="CAPTCHA" className="w-[150px] h-[50px] rounded-lg border border-gray-300 dark:border-white/20" />
                            )}
                            <button type="button" onClick={fetchCaptcha} disabled={isCaptchaLoading || isLoading} className="p-2 text-gray-500 dark:text-gray-400 hover:text-cyan-500 transition disabled:opacity-50">
                            <RefreshCw size={20} className={isCaptchaLoading ? 'animate-spin' : ''}/>
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="سوال امنیتی"
                            value={captchaSolution}
                            onChange={(e) => setCaptchaSolution(e.target.value)}
                            className="w-full bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-3 text-gray-800 dark:text-white text-center tracking-widest placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
                            disabled={isLoading}
                            required
                        />
                        </div>
                    </>
                    )}

                    {challengeRequired && (
                    <div className="flex flex-col items-center space-y-2 pt-2">
                        <label htmlFor="2fa" className="text-sm text-cyan-600 dark:text-cyan-300">کد تایید دو مرحله‌ای</label>
                        <input
                        id="2fa"
                        type="text"
                        placeholder="123456"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="w-full bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-3 text-gray-800 dark:text-white text-center tracking-widest placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
                        disabled={isLoading}
                        required
                        />
                    </div>
                    )}
                    
                    <button
                    type="submit"
                    disabled={isLoading || isCaptchaLoading}
                    className="w-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white font-bold py-3 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                    {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        <>
                        {challengeRequired ? <ShieldCheck className="mr-2" size={20}/> : <LogIn className="mr-2" size={20} />}
                        <span>{challengeRequired ? 'تایید و ورود' : ' ورود امن '}</span>
                        </>
                    )}
                    </button>
                </form>
            </div>
            
            {/* Logo Panel */}
            <div className="hidden md:flex w-1/2 bg-white items-center justify-center p-12">
                <img 
                    src={logoUrl} 
                    alt="لوگو" 
                    className="max-w-[70%] h-auto"
                />
            </div>
        </div>
    </div>
  );
};

export default LoginPage;
import React, { useState, useEffect } from 'react';
import ContentPublisher from './ContentPublisher';
import PromotionalDM from './PromotionalDM';
import SmartInteraction from './SmartInteraction';
import DashboardHome from './DashboardHome';
import SettingsPage from './SettingsPage';
import { LogOut, Send, Mail, UserCircle, Heart, Bot, LayoutDashboard, Settings, Menu, X, AlertOctagon, Moon } from 'lucide-react';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocal ? 'http://127.0.0.1:5000' : 'https://amirhmz.pythonanywhere.com';

interface DashboardPageProps {
  userInfo: any;
  onLogout: () => void;
  isRateLimited: boolean;
  limitedUntil: number;
  onInteraction: () => void;
}

type ActiveTab = 'dashboard' | 'publisher' | 'dm' | 'interaction' | 'settings';

const RateLimitBanner: React.FC<{ limitedUntil: number }> = ({ limitedUntil }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = Math.floor(Date.now() / 1000);
            const secondsRemaining = limitedUntil - now;

            if (secondsRemaining <= 0) {
                setTimeLeft('۰۰:۰۰');
                return;
            }

            const minutes = String(Math.floor(secondsRemaining / 60)).padStart(2, '0');
            const seconds = String(secondsRemaining % 60).padStart(2, '0');
            setTimeLeft(`${minutes}:${seconds}`);
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [limitedUntil]);

    return (
        <div className="w-full bg-amber-100 dark:bg-amber-500/20 border-l-4 border-amber-500 text-amber-800 dark:text-amber-200 p-4 rounded-lg mb-4 flex items-center gap-4 animate-pulse">
            <AlertOctagon className="h-6 w-6" />
            <div>
                <p className="font-bold">حساب شما به طور موقت محدود شده است.</p>
                <p className="text-sm">اینستاگرام به دلیل فعالیت زیاد، درخواست‌ها را محدود کرده. برای محافظت از حساب، تمام عملیات تا <span className="font-mono font-bold">{timeLeft}</span> دیگر متوقف شده است.</p>
            </div>
        </div>
    );
};

const DashboardPage: React.FC<DashboardPageProps> = ({ userInfo, onLogout, isRateLimited, limitedUntil, onInteraction }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cancellingTask, setCancellingTask] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const profilePicUrl = `${API_BASE_URL}/api/profile_pic`;

  const handleCancelTask = async (taskName: string) => {
    if (!window.confirm(`آیا از لغو عملیات '${taskName}' مطمئن هستید؟`)) return;
    
    setCancellingTask(taskName);
    try {
        const response = await fetch(`${API_BASE_URL}/api/cancel_task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task: taskName }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'خطا در لغو عملیات.');
        }
        alert(data.message || 'درخواست لغو ارسال شد. عملیات به زودی متوقف خواهد شد.');
        onInteraction();
    } catch (error: any) {
        console.error('Error cancelling task:', error);
        alert(`خطا در لغو عملیات: ${error.message}`);
    } finally {
        setCancellingTask(null);
    }
  };

  const handleNavItemClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const NavItem = ({ tab, icon, label }: { tab: ActiveTab, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => handleNavItemClick(tab)}
      className={`flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg transition-all duration-300 w-full text-right ${
        activeTab === tab
          ? 'bg-black/10 dark:bg-white/20 text-gray-900 dark:text-white shadow-md'
          : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {icon}
      <span className="font-semibold">{label}</span>
    </button>
  );
  
  const tabTitles: { [key in ActiveTab]: string } = {
    dashboard: "داشبورد",
    publisher: "ارسال محتوا",
    dm: "دایرکت هوشمند",
    interaction: "تعامل هوشمند",
    settings: "تنظیمات"
  };

  return (
    <div className="relative min-h-screen md:flex">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 bg-gray-100/80 dark:bg-black/30 backdrop-blur-xl border-l border-gray-200 dark:border-white/10 p-4 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {avatarError ? (
                <UserCircle size={40} className="text-cyan-500 dark:text-cyan-400" />
            ) : (
                <img 
                    src={profilePicUrl} 
                    alt={userInfo.username} 
                    onError={() => setAvatarError(true)}
                    className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500" 
                />
            )}
            <div>
              <h2 className="font-bold text-lg">{userInfo.username}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{userInfo.full_name || 'مدیریت حساب'}</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-gray-600 dark:text-gray-300">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-grow space-y-2">
            <NavItem tab="dashboard" icon={<LayoutDashboard size={20} />} label="داشبورد" />
            <NavItem tab="publisher" icon={<Send size={20} />} label="ارسال محتوا" />
            <NavItem tab="dm" icon={<Mail size={20} />} label="دایرکت هوشمند" />
            <NavItem tab="interaction" icon={<Bot size={20} />} label="تعامل هوشمند" />
        </nav>
        
        <div className="space-y-2 mt-6 pt-4 border-t border-gray-300 dark:border-white/10">
          <NavItem tab="settings" icon={<Settings size={20} />} label="تنظیمات" />
          <button
            onClick={onLogout}
            className="flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-300 w-full"
          >
            <LogOut size={20} />
            <span className="font-semibold">خروج از حساب</span>
          </button>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-300 dark:border-white/10 text-center text-xs text-gray-500 dark:text-gray-400">
           <p className="flex items-center justify-center">
             ساخته شده با عشق
             <Heart className="inline-block fill-red-500 text-red-500 mx-1" size={14} />
           </p>
           <p className="mt-1">نسخه 1.0.0</p>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 h-screen overflow-hidden">
        <header className="md:hidden flex justify-between items-center mb-4 p-2 bg-white/60 dark:bg-black/20 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/10 sticky top-0 z-10">
           <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
              {tabTitles[activeTab]}
           </h1>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-800 dark:text-white">
            <Menu size={24} />
          </button>
        </header>

        <div className="bg-white/60 dark:bg-black/20 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-2xl shadow-lg w-full h-[calc(100%-72px)] md:h-full p-6 overflow-y-auto">
          {isRateLimited && <RateLimitBanner limitedUntil={limitedUntil} />}
          <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }} className="h-full">
            <DashboardHome userInfo={userInfo} onCancelTask={handleCancelTask} setActiveTab={setActiveTab} cancellingTask={cancellingTask} />
          </div>
          <div style={{ display: activeTab === 'publisher' ? 'block' : 'none' }} className="h-full">
            <ContentPublisher isRateLimited={isRateLimited} />
          </div>
          <div style={{ display: activeTab === 'dm' ? 'block' : 'none' }} className="h-full">
            <PromotionalDM isRateLimited={isRateLimited} onInteraction={onInteraction} />
          </div>
          <div style={{ display: activeTab === 'interaction' ? 'block' : 'none' }} className="h-full">
            <SmartInteraction isRateLimited={isRateLimited} onInteraction={onInteraction} />
          </div>
          <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }} className="h-full">
            <SettingsPage isRateLimited={isRateLimited} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
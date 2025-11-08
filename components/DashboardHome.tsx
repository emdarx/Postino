import React from 'react';
import { Users, UserPlus, FileText, LayoutGrid, Send, Bot, Loader2 } from 'lucide-react';

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color: string; darkColor: string }> = ({ icon, label, value, color, darkColor }) => (
  <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 flex items-center space-x-4 rtl:space-x-reverse">
    <div className={`p-3 rounded-full ${color} ${darkColor}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-300">{label}</p>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{String(value)}</p>
    </div>
  </div>
);

const Stats: React.FC<{ stats: any }> = ({ stats }) => {
  if (!stats) return null;
  
  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">آمار کلی</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Users size={24} />} label="فالورها" value={stats.followers} color="bg-cyan-100 text-cyan-600" darkColor="dark:bg-cyan-500/30 dark:text-cyan-300" />
        <StatCard icon={<UserPlus size={24} />} label="فالوینگ‌ها" value={stats.following} color="bg-fuchsia-100 text-fuchsia-600" darkColor="dark:bg-fuchsia-500/30 dark:text-fuchsia-300" />
        <StatCard icon={<FileText size={24} />} label="پست‌ها" value={stats.posts} color="bg-amber-100 text-amber-600" darkColor="dark:bg-amber-500/30 dark:text-amber-300" />
      </div>
    </div>
  );
};

type ActiveTab = 'dashboard' | 'publisher' | 'dm' | 'interaction';

const ActiveTasks: React.FC<{ 
  tasks: any; 
  onNavigate: (tab: ActiveTab) => void;
}> = ({ tasks, onNavigate }) => {
  const taskDetails = [
    { key: 'publishing', icon: <LayoutGrid size={20} className="text-gray-600 dark:text-gray-300" />, text: 'ارسال هوشمند', tab: 'publisher' as ActiveTab },
    { key: 'dm', icon: <Send size={20} className="text-gray-600 dark:text-gray-300"/>, text: 'دایرکت هوشمند', tab: 'dm' as ActiveTab },
    { key: 'interaction', icon: <Bot size={20} className="text-gray-600 dark:text-gray-300"/>, text: 'تعامل هوشمند', tab: 'interaction' as ActiveTab }
  ];

  const activeTasks = tasks ? taskDetails.filter(task => tasks[task.key]) : [];

  if (activeTasks.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-8">
      <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">عملیات‌های در حال اجرا</h3>
        <div className="space-y-3">
          {activeTasks.map(task => (
            <div 
              key={task.key} 
              onClick={() => onNavigate(task.tab)}
              className="flex items-center justify-between p-3 bg-gray-100/50 dark:bg-white/5 rounded-lg border border-gray-200/50 dark:border-white/10 cursor-pointer hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                {task.icon}
                <span className="font-semibold text-gray-700 dark:text-gray-200">{task.text}</span>
              </div>
               <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-400 font-semibold">
                    <Loader2 className="animate-spin" size={16} />
                    <span>در حال اجرا...</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


interface DashboardHomeProps {
  userInfo: any;
  onCancelTask: (taskName: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  cancellingTask: string | null;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ userInfo, onCancelTask, setActiveTab, cancellingTask }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-center bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
        {userInfo.username} به داشبورد هوشمند خوش آمدید!
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8 text-center max-w-xl">
        آمار کلی حساب خود را در اینجا مشاهده کنید و از منوی کناری برای مدیریت بخش‌های مختلف استفاده کنید.
      </p>
      <div className="w-full max-w-4xl">
         <Stats stats={userInfo} />
         <ActiveTasks 
            tasks={userInfo.tasks} 
            onNavigate={setActiveTab}
          />
      </div>
    </div>
  );
};

export default DashboardHome;
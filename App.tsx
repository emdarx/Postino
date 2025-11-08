import React, { useState, useEffect, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [limitedUntil, setLimitedUntil] = useState<number>(0);

  const updateStatus = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/stats');
      const data = await response.json();

      if (data.rate_limited) {
        setIsRateLimited(true);
        setLimitedUntil(data.limited_until);
        setIsLoggedIn(true);
      } else if (data.logged_in) {
        setIsRateLimited(false);
        setLimitedUntil(0);
        setUserInfo(data);
        setIsLoggedIn(true);
      } else {
        setIsRateLimited(false);
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }, []);

  const checkLoginStatusWithLoader = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/stats');
      const data = await response.json();
      
      if (data.rate_limited) {
        setIsRateLimited(true);
        setLimitedUntil(data.limited_until);
        setIsLoggedIn(true);
        setUserInfo(prev => prev || { username: 'محدود شده' });
      } else if (data.logged_in) {
        setIsRateLimited(false);
        setLimitedUntil(0);
        setUserInfo(data);
        setIsLoggedIn(true);
      } else {
        setIsRateLimited(false);
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    } catch (error) {
      console.error("Failed to check login status:", error);
      setIsRateLimited(false);
      setIsLoggedIn(false);
      setUserInfo(null);
    } finally {
        setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    checkLoginStatusWithLoader();
  }, [checkLoginStatusWithLoader]);

  const handleLogin = () => {
    checkLoginStatusWithLoader();
  };

  const handleLogout = async () => {
    try {
      await fetch('http://127.0.0.1:5000/api/logout', { method: 'POST' });
    } catch (error) {
      console.error("Failed to log out from server:", error);
    } finally {
      setIsLoggedIn(false);
      setIsRateLimited(false);
      setUserInfo(null);
    }
  };

  if (isLoading) {
    return (
       <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-gray-800 dark:text-white transition-colors duration-300">
      {isLoggedIn && userInfo ? (
        <DashboardPage 
          userInfo={userInfo} 
          onLogout={handleLogout} 
          isRateLimited={isRateLimited}
          limitedUntil={limitedUntil}
          onInteraction={updateStatus}
        />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;

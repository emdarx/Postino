import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Image as ImageIcon, Video, Send, Loader2, CheckCircle, AlertTriangle, Info, Upload, Trash2, XCircle, Sparkles, Rocket } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:5000';

interface FileItemProps {
  filename: string;
  type: 'photo' | 'reel';
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  disabled: boolean;
}

const FileItem: React.FC<FileItemProps> = ({ filename, type, isSelected, onSelect, onDelete, disabled }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  const fileUrl = `${API_BASE_URL}/${type === 'photo' ? PHOTO_FOLDER : REELS_FOLDER}/${filename}`;

  return (
    <div ref={ref} className="relative aspect-square group rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
      {inView ? (
        <>
          {type === 'photo' ? (
            <img src={fileUrl} alt={filename} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <video src={fileUrl} className="w-full h-full object-cover" muted playsInline />
          )}
          <div
            onClick={disabled ? undefined : onSelect}
            className={`absolute inset-0 transition-all duration-300 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${
              isSelected
                ? 'bg-cyan-500/70 border-4 border-cyan-400'
                : 'bg-black/50 opacity-0 group-hover:opacity-100'
            }`}
          >
            {isSelected && <CheckCircle className="absolute top-2 right-2 text-white bg-cyan-500 rounded-full" />}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); if (!disabled) onDelete(); }}
            disabled={disabled}
            className="absolute top-2 left-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            title="حذف فایل"
          >
            <Trash2 size={16} />
          </button>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
};

const PHOTO_FOLDER = "photo";
const REELS_FOLDER = "reels";

interface ContentPublisherProps {
    isRateLimited: boolean;
}

const ContentPublisher: React.FC<ContentPublisherProps> = ({ isRateLimited }) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'reels'>('photos');
  const [files, setFiles] = useState<{ photos: string[], reels: string[] }>({ photos: [], reels: [] });
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: 'photo' | 'reel' } | null>(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState({ library: false, posting: false, uploading: false, deleting: false, generatingCaption: false });
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{ percentage: number; loaded: number; total: number; remaining: string } | null>(null);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        setStatus(null);
      }, 5000); // Hide after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [status]);

  const fetchFiles = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, library: true }));
    setStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/files`);
      const data = await response.json();
      if (!response.ok) throw new Error("خطا در دریافت لیست فایل‌ها.");
      setFiles({ photos: data.photos || [], reels: data.reels || [] });
    } catch (error: any) {
      setStatus({ type: 'error', text: `${error.message}` });
    } finally {
      setIsLoading(prev => ({ ...prev, library: false }));
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);
  
  const handleFileSelect = (name: string, type: 'photo' | 'reel') => {
    if (selectedFile?.name === name && selectedFile?.type === type) {
      setSelectedFile(null);
      setCaption('');
    } else {
      setSelectedFile({ name, type });
      setCaption('');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(prev => ({ ...prev, uploading: true }));
      setStatus(null);
      setUploadProgress({ percentage: 0, loaded: 0, total: file.size, remaining: '...' });
      
      const fileType = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type) ? 'photo' : 'reel';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', fileType);

      const xhr = new XMLHttpRequest();
      const startTime = Date.now();

      xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
              const percentage = (e.loaded / e.total) * 100;
              const elapsedSeconds = (Date.now() - startTime) / 1000;
              const speed = e.loaded / elapsedSeconds; // bytes per second
              const remainingBytes = e.total - e.loaded;
              const remainingSeconds = speed > 0 ? remainingBytes / speed : Infinity;
              
              setUploadProgress({
                  percentage,
                  loaded: e.loaded,
                  total: e.total,
                  remaining: remainingSeconds === Infinity ? '...' : Math.round(remainingSeconds).toString(),
              });
          }
      });

      xhr.addEventListener('load', () => {
          setIsLoading(prev => ({ ...prev, uploading: false }));
          setUploadProgress(null);
          if (fileInputRef.current) fileInputRef.current.value = "";

          try {
              if (xhr.status >= 200 && xhr.status < 300) {
                  const data = JSON.parse(xhr.responseText);
                  if (data.success) {
                      setStatus({ type: 'success', text: data.message });
                      fetchFiles();
                  } else {
                      throw new Error(data.message || 'خطا در آپلود فایل.');
                  }
              } else {
                  const data = JSON.parse(xhr.responseText);
                  throw new Error(data.message || `خطای سرور: ${xhr.status}`);
              }
          } catch (error: any) {
              setStatus({ type: 'error', text: error.message });
          }
      });

      xhr.addEventListener('error', () => {
          setIsLoading(prev => ({ ...prev, uploading: false }));
          setUploadProgress(null);
          setStatus({ type: 'error', text: 'خطای شبکه در هنگام آپلود رخ داد.' });
          if (fileInputRef.current) fileInputRef.current.value = "";
      });
      
      xhr.addEventListener('abort', () => {
          setIsLoading(prev => ({ ...prev, uploading: false }));
          setUploadProgress(null);
          setStatus({ type: 'info', text: 'آپلود لغو شد.' });
          if (fileInputRef.current) fileInputRef.current.value = "";
      });

      xhr.open('POST', `${API_BASE_URL}/api/upload_file`, true);
      xhr.send(formData);
  };

  const handleDeleteFile = async (filename: string, type: 'photo' | 'reel') => {
      if (!window.confirm(`آیا از حذف فایل ${filename} مطمئن هستید؟`)) return;

      setIsLoading(prev => ({ ...prev, deleting: true }));
      setStatus(null);

      try {
          const response = await fetch(`${API_BASE_URL}/api/delete_file`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename, type }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'خطا در حذف فایل.');
          setStatus({ type: 'success', text: data.message });
          if (selectedFile?.name === filename && selectedFile?.type === type) {
            setSelectedFile(null);
          }
          fetchFiles();
      } catch (error: any) {
          setStatus({ type: 'error', text: error.message });
      } finally {
          setIsLoading(prev => ({ ...prev, deleting: false }));
      }
  };

  const handlePost = async () => {
      if (!selectedFile) {
        setStatus({ type: 'error', text: 'لطفاً ابتدا یک فایل را انتخاب کنید.' });
        return;
      }
      setIsLoading(prev => ({ ...prev, posting: true }));
      setStatus(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/post_media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: selectedFile.name, type: selectedFile.type, caption }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'خطا در ارسال پست.');
        setStatus({ type: 'success', text: data.message });
        setSelectedFile(null);
        setCaption('');
        fetchFiles();
      } catch (error: any) {
        setStatus({ type: 'error', text: error.message });
      } finally {
        setIsLoading(prev => ({ ...prev, posting: false }));
      }
  };

  const generateCaption = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, generatingCaption: true }));
    setStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate_caption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_dm: false }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'خطا در تولید کپشن.');
      }
      setCaption(data.caption);
      setStatus({ type: 'success', text: 'کپشن با موفقیت تولید شد.' });
    } catch (error: any) {
      setCaption('');
      setStatus({ type: 'error', text: error.message });
    } finally {
      setIsLoading(prev => ({ ...prev, generatingCaption: false }));
    }
  }, []);

  const anyLoading = Object.values(isLoading).some(Boolean) || isRateLimited;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* Publisher Column */}
      <div className="lg:w-1/3 xl:w-1/4 flex flex-col gap-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">ارسال محتوا</h2>
        <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-4 flex flex-col flex-grow border border-gray-200 dark:border-white/10">
          {selectedFile ? (
            <div className="flex flex-col h-full">
              <div className="relative aspect-square rounded-lg overflow-hidden group mb-4 shadow-lg shadow-cyan-500/10">
                {selectedFile.type === 'photo' ? (
                  <img src={`${API_BASE_URL}/${PHOTO_FOLDER}/${selectedFile.name}`} alt={selectedFile.name} className="w-full h-full object-cover" />
                ) : (
                  <video src={`${API_BASE_URL}/${REELS_FOLDER}/${selectedFile.name}`} className="w-full h-full object-cover" controls />
                )}
                <button onClick={() => setSelectedFile(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-transform transform hover:scale-110">
                    <XCircle size={22} />
                </button>
              </div>
              
              <div className="relative flex-grow flex flex-col mb-4">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="کپشن خود را اینجا بنویسید..."
                  rows={6}
                  className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/20 rounded-lg p-3 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none"
                  disabled={anyLoading}
                />
                 <button onClick={generateCaption} disabled={isLoading.generatingCaption || isRateLimited} className="absolute bottom-3 left-3 flex items-center justify-center gap-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold px-3 py-1.5 rounded-lg transition transform hover:scale-105 disabled:opacity-50 text-xs">
                    {isLoading.generatingCaption ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    <span>تولید متن با هوش مصنوعی</span>
                </button>
              </div>

              <div className="mt-auto">
                <button 
                  onClick={handlePost} 
                  disabled={isLoading.posting || isRateLimited} 
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isLoading.posting ? <Loader2 className="animate-spin" /> : <Rocket size={20} />}
                  <span>ارسال نهایی</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-cyan-500/50">
                  <ImageIcon size={48} className="text-cyan-500" />
              </div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">فایلی انتخاب نشده</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">برای شروع، یک عکس یا ویدیو از کتابخانه انتخاب کنید.</p>
            </div>
          )}
        </div>
      </div>

      {/* Library Column */}
      <div className="lg:w-2/3 xl:w-3/4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
            <div className="flex border border-gray-300 dark:border-white/20 rounded-lg p-1 bg-gray-100 dark:bg-black/20">
              <button onClick={() => setActiveTab('photos')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'photos' ? 'bg-white dark:bg-white/20 shadow' : 'text-gray-500'}`}><ImageIcon size={16} className="inline-block ml-1" /> عکس‌ها</button>
              <button onClick={() => setActiveTab('reels')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'reels' ? 'bg-white dark:bg-white/20 shadow' : 'text-gray-500'}`}><Video size={16} className="inline-block ml-1" /> ریلزها</button>
            </div>
             <label htmlFor="file-upload" className={`flex items-center gap-2 bg-cyan-500 text-white px-4 py-2 rounded-lg cursor-pointer transition transform hover:scale-105 ${isLoading.uploading || isRateLimited ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload size={18} />
                <span>آپلود</span>
                <input id="file-upload" ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/jpeg,image/png,image/jpg,video/mp4,video/quicktime" disabled={isLoading.uploading || isRateLimited} />
            </label>
        </div>
        
         {isLoading.uploading && uploadProgress && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                <div className="bg-cyan-600 h-2.5 rounded-full" style={{ width: `${uploadProgress.percentage}%` }}></div>
            </div>
        )}

        <div className="flex-grow overflow-y-auto pr-2">
            {isLoading.library && <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-cyan-500" size={32} /></div>}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {(activeTab === 'photos' ? files.photos : files.reels).map(file => (
                <FileItem
                  key={file}
                  filename={file}
                  type={activeTab === 'photos' ? 'photo' : 'reel'}
                  isSelected={selectedFile?.name === file && selectedFile?.type === (activeTab === 'photos' ? 'photo' : 'reel')}
                  onSelect={() => handleFileSelect(file, activeTab === 'photos' ? 'photo' : 'reel')}
                  onDelete={() => handleDeleteFile(file, activeTab === 'photos' ? 'photo' : 'reel')}
                  disabled={anyLoading}
                />
              ))}
            </div>
             {!isLoading.library && (activeTab === 'photos' ? files.photos : files.reels).length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                    <p>کتابخانه شما خالی است. برای شروع، فایلی را آپلود کنید.</p>
                </div>
            )}
        </div>
      </div>
       {status && (
         <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-xl flex items-center gap-3 text-sm font-semibold border ${
            status.type === 'success' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-500/30' :
            status.type === 'error' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30' :
            'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/30'
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

export default ContentPublisher;

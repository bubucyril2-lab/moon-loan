import React, { useEffect, useState } from 'react';
import { Bell, X, Check, Info, AlertTriangle, Megaphone, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { safeFormat } from '../utils/date';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}

const NotificationCenter = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, token]);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'broadcast': return <Megaphone className="h-4 w-4 text-purple-500" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'success': return <Check className="h-4 w-4 text-emerald-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[80]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl z-[90] overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Notifications</h3>
                <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-slate-900">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!n.is_read ? 'bg-emerald-50/30' : ''}`}
                        onClick={() => !n.is_read && markAsRead(n.id)}
                      >
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold text-slate-900 ${!n.is_read ? 'pr-4' : ''}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-2">
                              {safeFormat(n.created_at, 'MMM d, HH:mm')}
                            </p>
                          </div>
                          {!n.is_read && (
                            <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Bell className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">All caught up!</p>
                    <p className="text-xs text-slate-400 mt-1">No new notifications</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                  <button className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
                    View All Notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;

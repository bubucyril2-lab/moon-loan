import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Loader2,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Notification } from '../../types';
import { storageService } from '../../services/storage';
import { safeFormat } from '../../utils/date';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CustomerNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await storageService.getNotificationsByUserId(user.id);
      setNotifications(data.sort((a, b) => new Date(b.created_at || b.createdAt || '').getTime() - new Date(a.created_at || a.createdAt || '').getTime()));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      const updated = { ...notification, isRead: true, read: true };
      await storageService.saveNotification(updated);
      setNotifications(prev => prev.map(n => n.id === id ? updated : n));
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      try {
        await storageService.deleteNotificationsByUserId(user.id);
        setNotifications([]);
        toast.success('Notifications cleared');
      } catch (error) {
        toast.error('Failed to clear notifications');
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
            <p className="text-slate-500">Stay updated with your account activities</p>
          </div>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-all"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">No Notifications</h3>
            <p className="text-sm text-slate-500">We'll notify you when something important happens.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                className={`p-6 flex gap-4 hover:bg-slate-50 transition-all cursor-pointer ${!notification.read ? 'bg-emerald-50/30' : ''}`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-bold ${!notification.read ? 'text-slate-900' : 'text-slate-600'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {safeFormat(notification.created_at || notification.createdAt, 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
                {!notification.read && (
                  <div className="flex-shrink-0 self-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerNotifications;

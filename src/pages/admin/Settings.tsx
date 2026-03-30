import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  Bell, 
  Database, 
  Globe, 
  Lock,
  Save,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

import { storageService } from '../../services/storage';

const AdminSettings = () => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    bank_name: 'ECONEST BANK',
    maintenance_mode: 'false',
    interest_rate: '5.5',
    max_loan_amount: '50000',
    allow_registrations: 'true'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await storageService.getSettings();
        if (data) setSettings(data);
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await storageService.saveSettings(settings);
      
      await storageService.saveAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        adminId: user.id,
        adminName: user.fullName || user.full_name || '',
        action: 'system_settings_update',
        details: `Updated system settings: ${Object.keys(settings).join(', ')}`,
        createdAt: new Date().toISOString()
      });

      toast.success('System settings updated successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">System Settings</h2>
        <p className="text-slate-500">Configure global bank parameters and security policies</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <nav className="space-y-1">
            {[
              { icon: Globe, label: 'General', active: true },
              { icon: Shield, label: 'Security', active: false },
              { icon: Bell, label: 'Notifications', active: false },
              { icon: Database, label: 'Backup', active: false },
            ].map((item, i) => (
              <button 
                key={i}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  item.active ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <Settings className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="font-bold text-slate-900">General Configuration</h3>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Bank Name</label>
                <input 
                  type="text" 
                  value={settings.bank_name}
                  onChange={(e) => setSettings({...settings, bank_name: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Default Interest Rate (%)</label>
                  <input 
                    type="number" 
                    value={settings.interest_rate}
                    onChange={(e) => setSettings({...settings, interest_rate: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Max Loan Amount ($)</label>
                  <input 
                    type="number" 
                    value={settings.max_loan_amount}
                    onChange={(e) => setSettings({...settings, max_loan_amount: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Maintenance Mode</p>
                    <p className="text-xs text-slate-500">Disable all customer features temporarily</p>
                  </div>
                  <button 
                    onClick={() => setSettings({...settings, maintenance_mode: settings.maintenance_mode === 'true' ? 'false' : 'true'})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.maintenance_mode === 'true' ? 'bg-red-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.maintenance_mode === 'true' ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">New Registrations</p>
                    <p className="text-xs text-slate-500">Allow new users to create accounts</p>
                  </div>
                  <button 
                    onClick={() => setSettings({...settings, allow_registrations: settings.allow_registrations === 'true' ? 'false' : 'true'})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.allow_registrations === 'true' ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.allow_registrations === 'true' ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              {settings.maintenance_mode === 'true' && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-700 leading-relaxed">
                    <strong>Warning:</strong> Enabling maintenance mode will prevent all customers from accessing their dashboards.
                  </p>
                </div>
              )}

              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    <Save className="h-5 w-5" />
                    Save System Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Smartphone, 
  Bell, 
  User,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Camera
} from 'lucide-react';
import { firebaseAuthService } from '../../services/firebaseAuthService';
import { storageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CustomerSettings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFactorEnabled || false);
  const [isUpdating2FA, setIsUpdating2FA] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'Security';
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email: { transactions: true, security: true, marketing: false },
    push: { transactions: true, security: true, marketing: true },
    sms: { transactions: false, security: true, marketing: false }
  });
  const [linkedDevices, setLinkedDevices] = useState([
    { id: '1', name: 'iPhone 15 Pro', location: 'London, UK', lastActive: 'Active Now', isCurrent: true },
    { id: '2', name: 'MacBook Pro 14"', location: 'London, UK', lastActive: '2 hours ago', isCurrent: false },
    { id: '3', name: 'Chrome on Windows', location: 'Manchester, UK', lastActive: 'Yesterday', isCurrent: false }
  ]);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    city: user?.city || '',
    country: user?.country || '',
    age: user?.age?.toString() || ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  React.useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        age: user.age?.toString() || ''
      });
    }
  }, [user]);

  React.useEffect(() => {
    const fetchAccount = async () => {
      if (user) {
        const acc = await storageService.getAccountByUserId(user.id);
        setAccount(acc);
      }
    };
    fetchAccount();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingProfile(true);
    try {
      const updatedData = {
        ...profileForm,
        age: parseInt(profileForm.age) || undefined
      };
      await firebaseAuthService.updateProfile(user.id, updatedData);
      updateUser({
        ...user,
        ...updatedData
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    setIsUpdatingPassword(true);
    try {
      await firebaseAuthService.forgotPassword(user.email);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    if (!user) return;
    setIsUpdating2FA(true);
    try {
      const updatedUser = { ...user, twoFactorEnabled: !is2FAEnabled };
      await storageService.saveUser(updatedUser);
      updateUser(updatedUser);
      setIs2FAEnabled(!is2FAEnabled);
      toast.success(`2FA ${!is2FAEnabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update 2FA status');
    } finally {
      setIsUpdating2FA(false);
    }
  };

  const handleToggleNotification = (channel: 'email' | 'push' | 'sms', category: 'transactions' | 'security' | 'marketing') => {
    setNotificationSettings(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [category]: !prev[channel][category]
      }
    }));
    toast.success('Notification preferences updated');
  };

  const handleRemoveDevice = (id: string) => {
    if (window.confirm('Are you sure you want to remove this device?')) {
      setLinkedDevices(prev => prev.filter(d => d.id !== id));
      toast.success('Device removed successfully');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const imageUrl = await storageService.uploadFile(file, `profiles/${user.id}/${file.name}`);
      const updatedUser = { ...user, profilePicture: imageUrl };
      await storageService.saveUser(updatedUser);
      updateUser(updatedUser);
      toast.success('Profile picture updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
          title="Go Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Account Settings</h2>
          <p className="text-slate-500">Manage your security preferences and profile</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm overflow-hidden">
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="h-10 w-10 text-emerald-600" />
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="absolute bottom-4 right-0 p-1.5 bg-slate-900 text-white rounded-full border-2 border-white hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
                  title="Update Profile Picture"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                </button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <h3 className="font-bold text-slate-900">{user?.fullName}</h3>
              <p className="text-xs text-slate-500 mb-4">{user?.email}</p>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Verified Account
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { icon: Shield, label: 'Security' },
              { icon: User, label: 'Profile' },
              { icon: Bell, label: 'Notifications' },
              { icon: Smartphone, label: 'Linked Devices' },
            ].map((item, i) => (
              <button 
                key={i}
                onClick={() => setActiveTab(item.label)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.label ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="md:col-span-2 space-y-8">
          {activeTab === 'Profile' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h3 className="font-bold text-slate-900 mb-6">Personal Information</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Age</label>
                    <input 
                      type="number"
                      value={profileForm.age}
                      onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <input 
                    type="tel"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</label>
                  <input 
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">City</label>
                    <input 
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</label>
                    <input 
                      type="text"
                      value={profileForm.country}
                      onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {isUpdatingProfile ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'Security' && (
            <>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                <h3 className="font-bold text-slate-900 mb-6">Security & Password</h3>
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                        <Lock className="h-6 w-6 text-slate-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Password Reset</h4>
                        <p className="text-xs text-slate-500">Securely reset your account password via email.</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleSendResetEmail}
                      disabled={isUpdatingPassword}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUpdatingPassword ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Email'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                <h3 className="font-bold text-slate-900 mb-6">Bank Account Details</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Name</span>
                      <span className="text-sm font-bold text-slate-900">Moonstone Saving Bank</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SWIFT / BIC</span>
                      <span className="text-sm font-mono font-bold text-slate-900">MOONUS33XXX</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IBAN</span>
                      <span className="text-sm font-mono font-bold text-slate-900">US76 MOON 0000 1234 5678 90</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center italic">Use these details for international wire transfers.</p>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                <h3 className="font-bold text-slate-900 mb-6">Account Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-slate-50">
                    <span className="text-sm text-slate-500">Account Status</span>
                    <span className="text-sm font-bold text-emerald-600 capitalize">{user?.status}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-50">
                    <span className="text-sm text-slate-500">Membership Type</span>
                    <span className="text-sm font-bold text-slate-900">Moonstone Premium</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-500">2FA Status</span>
                      <span className="text-[10px] text-slate-400">Extra security for your account</span>
                    </div>
                    <button 
                      onClick={handleToggle2FA}
                      disabled={isUpdating2FA}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        is2FAEnabled ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        is2FAEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center py-3 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-500">Transfer PIN</span>
                      <span className="text-[10px] text-slate-400">{user?.transactionPin ? 'PIN is active' : 'PIN not set'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <ShieldCheck className="h-4 w-4" />
                      {user?.transactionPin ? 'MANAGED BY ADMIN' : 'CONTACT ADMIN TO SET'}
                    </div>
                  </div>
                </div>
                <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-red-900">Danger Zone</p>
                    <button className="text-[10px] text-red-600 font-bold hover:underline mt-1">
                      Request Account Deactivation
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'Notifications' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8">
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Notification Preferences</h3>
                <p className="text-sm text-slate-500">Choose how you want to receive updates from us.</p>
              </div>

              <div className="space-y-6">
                {/* Email Notifications */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Bell className="h-3 w-3" />
                    Email Notifications
                  </h4>
                  <div className="space-y-3">
                    {[
                      { id: 'transactions', label: 'Transaction Alerts', desc: 'Get notified for every transfer and payment' },
                      { id: 'security', label: 'Security Alerts', desc: 'Important updates about your account security' },
                      { id: 'marketing', label: 'Marketing & Offers', desc: 'Stay updated with our latest products and deals' }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{item.label}</span>
                          <span className="text-xs text-slate-500">{item.desc}</span>
                        </div>
                        <button 
                          onClick={() => handleToggleNotification('email', item.id as any)}
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                            notificationSettings.email[item.id as keyof typeof notificationSettings.email] ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            notificationSettings.email[item.id as keyof typeof notificationSettings.email] ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Push Notifications */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Smartphone className="h-3 w-3" />
                    Push Notifications
                  </h4>
                  <div className="space-y-3">
                    {[
                      { id: 'transactions', label: 'Transaction Alerts', desc: 'Real-time alerts on your mobile device' },
                      { id: 'security', label: 'Security Alerts', desc: 'Instant security notifications' }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{item.label}</span>
                          <span className="text-xs text-slate-500">{item.desc}</span>
                        </div>
                        <button 
                          onClick={() => handleToggleNotification('push', item.id as any)}
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                            notificationSettings.push[item.id as keyof typeof notificationSettings.push] ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            notificationSettings.push[item.id as keyof typeof notificationSettings.push] ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Linked Devices' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8">
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Linked Devices</h3>
                <p className="text-sm text-slate-500">Manage the devices that have access to your account.</p>
              </div>

              <div className="space-y-4">
                {linkedDevices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                        <Smartphone className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{device.name}</h4>
                          {device.isCurrent && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-[8px] font-bold uppercase tracking-wider">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{device.location} • {device.lastActive}</p>
                      </div>
                    </div>
                    {!device.isCurrent && (
                      <button 
                        onClick={() => handleRemoveDevice(device.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove Device"
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  If you see any device you don't recognize, we recommend changing your password immediately and removing the device.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default CustomerSettings;

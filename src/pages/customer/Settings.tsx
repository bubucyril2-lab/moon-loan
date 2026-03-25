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
              { icon: Shield, label: 'Security', active: true },
              { icon: Bell, label: 'Notifications', active: false },
              { icon: Smartphone, label: 'Linked Devices', active: false },
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

        <div className="md:col-span-2 space-y-8">
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
        </div>
      </div>
    </div>
  );
};

export default CustomerSettings;

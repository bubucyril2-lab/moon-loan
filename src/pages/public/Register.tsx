import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, Mail, Lock, User, Loader2, AlertCircle, Globe, MapPin, Calendar, Camera, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { firebaseAuthService } from '../../services/firebaseAuthService';
import { storageService } from '../../services/storage';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Account } from '../../types';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    city: '',
    age: ''
  });
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [profilePhotoName, setProfilePhotoName] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationsAllowed, setRegistrationsAllowed] = useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    storageService.getSettings().then((s) => {
      if (s && s.allow_registrations !== undefined) {
        const val = s.allow_registrations;
        const allowed = !(val === false || String(val).trim().toLowerCase() === 'false' || String(val).trim() === '0');
        setRegistrationsAllowed(allowed);
      }
    }).catch(() => {});
  }, []);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, or WEBP).');
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Profile picture must be smaller than 10MB.');
      toast.error('Image must be smaller than 10MB');
      return;
    }

    setIsProcessingPhoto(true);
    setError('');
    try {
      const dataUrl = await storageService.uploadFile(file, `profiles/signup_${Date.now()}_${file.name}`);
      setProfilePicture(dataUrl);
      setProfilePhotoName(file.name);
      toast.success('Profile picture ready!');
    } catch (err: any) {
      setError(err?.message || 'Could not process image. Please try another photo.');
      toast.error('Failed to process selected photo');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationsAllowed) {
      setError('New public registrations are currently paused by the administrator.');
      return;
    }
    if (!profilePicture) {
      setError('Please upload a profile picture to open your account.');
      toast.error('Profile picture is required');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const registeredUser = await firebaseAuthService.register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        username: formData.email.split('@')[0],
        profilePicture,
        country: formData.country,
        city: formData.city,
        age: parseInt(formData.age),
        status: 'active'
      });

      // Create initial bank account in Firestore
      const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const accountId = Math.random().toString(36).substring(2, 15);
      const newAccount: Account = {
        id: accountId,
        userId: registeredUser.id,
        accountNumber: accountNumber,
        balance: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'accounts', accountId), newAccount);
      login(registeredUser);

      toast.success('Welcome to ECONEST BANK!');

      if (registeredUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center gap-2 mb-6">
          <Landmark className="h-10 w-10 text-emerald-600" />
          <span className="text-2xl font-bold text-slate-900 tracking-tight">ECONEST BANK</span>
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-slate-900">Open your account</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          {!registrationsAllowed && (
            <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3.5 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">Registrations Temporarily Paused</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  New public account registrations have been turned OFF by the administrator. Please check back later or sign in to an existing account.
                </p>
              </div>
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Required Profile Picture Upload */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isProcessingPhoto || !registrationsAllowed}
                  className="relative w-18 h-18 rounded-full bg-white border-2 border-dashed border-emerald-400 flex items-center justify-center overflow-hidden shrink-0 hover:border-emerald-600 transition-colors cursor-pointer"
                  title="Upload Profile Picture"
                >
                  {isProcessingPhoto ? (
                    <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
                  ) : profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="h-7 w-7 text-emerald-600" />
                  )}
                </button>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-800">Profile Picture *</span>
                    {profilePicture && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">
                    {profilePicture
                      ? `Uploaded: ${profilePhotoName || 'Photo ready'} — displays on your customer dashboard.`
                      : 'Required photo to display on your customer dashboard.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isProcessingPhoto || !registrationsAllowed}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{profilePicture ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Country</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Your country"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">City</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Your city"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Age</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="number"
                  required
                  min="18"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Your age"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Your email address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-slate-900">
                I agree to the{' '}
                <Link to="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                  Terms & Conditions
                </Link>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !registrationsAllowed}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : !registrationsAllowed ? (
                  'Registrations Currently Paused'
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;

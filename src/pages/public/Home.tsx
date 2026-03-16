import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Globe, ArrowRight, CheckCircle2, Landmark } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { motion } from 'motion/react';

const Home = () => {
  return (
    <div className="min-h-screen">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80" 
            alt="Hero Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
                Banking for the <span className="text-emerald-400">Next Generation</span>
              </h1>
              <p className="text-xl text-slate-200 mb-8 leading-relaxed max-w-2xl">
                Experience secure, transparent, and lightning-fast digital banking. 
                Manage your wealth with Moonstone Saving Bank's advanced financial tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2 group">
                  Get Started Now
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/about" className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all text-center">
                  Learn More
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose Moonstone?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">We combine traditional security with modern technology to give you the best banking experience.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Secure Banking', desc: 'Your assets are protected by industry-leading encryption and security protocols.' },
              { icon: Zap, title: 'Instant Transfers', desc: 'Send and receive money globally in seconds with our optimized network.' },
              { icon: Globe, title: 'Global Access', desc: 'Manage your account from anywhere in the world with our mobile-first platform.' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-slate-50 border border-slate-100 transition-all"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="https://picsum.photos/seed/finance/800/600" 
                alt="Financial Services" 
                className="rounded-3xl shadow-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="order-1 lg:order-2 mb-12 lg:mb-0">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Comprehensive Financial Services</h2>
              <div className="space-y-4">
                {[
                  'Personal & Business Savings Accounts',
                  'International Wire Transfers',
                  'Flexible Personal & Business Loans',
                  '24/7 Real-time Support',
                  'Advanced Fraud Protection'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-slate-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link to="/services" className="text-emerald-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                  Explore all services <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Landmark className="h-8 w-8 text-emerald-500" />
                <span className="text-xl font-bold text-white tracking-tight">MOONSTONE</span>
              </div>
              <p className="max-w-sm">
                Empowering individuals and businesses with modern financial solutions. 
                Moonstone Saving Bank is a registered financial institution.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-emerald-500 transition-colors">About Us</Link></li>
                <li><Link to="/services" className="hover:text-emerald-500 transition-colors">Services</Link></li>
                <li><Link to="/contact" className="hover:text-emerald-500 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link></li>
                <li><Link to="#" className="hover:text-emerald-500 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-sm text-center">
            &copy; 2026 Moonstone Saving Bank. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

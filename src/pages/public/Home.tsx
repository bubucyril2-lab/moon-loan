import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Zap, Globe, ArrowRight, CheckCircle2, Landmark } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

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

      {/* How It Works Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
          <p className="text-slate-600 max-w-2xl mx-auto mb-16">Get started with Moonstone in three simple steps.</p>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-emerald-100 -translate-y-1/2 z-0"></div>
            
            {[
              { step: '01', title: 'Register', desc: 'Create your secure account in minutes with basic information.' },
              { step: '02', title: 'Apply', desc: 'Choose a loan plan that fits your needs and submit your application.' },
              { step: '03', title: 'Receive', desc: 'Once approved, funds are instantly disbursed to your account.' }
            ].map((item, i) => (
              <div key={i} className="relative z-10 bg-slate-50 px-4">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loan Plans Preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Flexible Loan Plans</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Choose the plan that best suits your financial goals with competitive interest rates.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Starter', duration: '1 Month', rate: '5%', color: 'emerald' },
              { name: 'Standard', duration: '3 Months', rate: '8%', color: 'blue' },
              { name: 'Premium', duration: '6 Months', rate: '12%', color: 'purple' },
              { name: 'Elite', duration: '12 Months', rate: '15%', color: 'slate' }
            ].map((plan, i) => (
              <div key={i} className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all group">
                <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-slate-500 text-sm mb-6">{plan.duration}</p>
                <div className="text-4xl font-bold text-emerald-600 mb-6 group-hover:scale-110 transition-transform origin-left">
                  {plan.rate}
                  <span className="text-sm font-normal text-slate-400 ml-1">Interest</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Instant Approval
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No Hidden Fees
                  </li>
                </ul>
                <Link to="/register" className="block w-full py-3 text-center bg-slate-50 text-slate-900 font-bold rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                  Apply Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Trusted by Thousands</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Join our growing community of satisfied customers who have transformed their banking experience.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Johnson', role: 'Business Owner', text: 'Moonstone has completely changed how I manage my business finances. The instant transfers are a lifesaver.' },
              { name: 'Michael Chen', role: 'Freelancer', text: 'The loan application process was incredibly smooth. I received my funds within hours of approval.' },
              { name: 'Elena Rodriguez', role: 'Tech Professional', text: 'Best digital banking experience I\'ve ever had. The UI is clean, fast, and very secure.' }
            ].map((t, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10">
                <p className="text-lg text-slate-300 italic mb-6">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center font-bold text-emerald-400">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-bold">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-600">Find answers to common questions about our services.</p>
          </div>
          
          <div className="space-y-4">
            {[
              { q: 'How do I open an account?', a: 'You can open an account by clicking the "Get Started" button and filling out our simple registration form. You\'ll need to provide some basic information and verify your identity.' },
              { q: 'What are the loan requirements?', a: 'To apply for a loan, you must be a registered member with an active account. Requirements vary based on the loan amount and plan chosen.' },
              { q: 'Is my money safe with Moonstone?', a: 'Yes, we use industry-standard encryption and security protocols to protect your assets and personal information. We are a registered financial institution.' },
              { q: 'How long does loan approval take?', a: 'Our automated system processes applications quickly. Most loans are reviewed and approved within 24 hours.' }
            ].map((faq, i) => (
              <details key={i} className="group bg-slate-50 rounded-2xl border border-slate-100 p-6 cursor-pointer">
                <summary className="flex items-center justify-between font-bold text-slate-900 list-none">
                  {faq.q}
                  <span className="transition-transform group-open:rotate-180">
                    <ArrowRight className="h-5 w-5 rotate-90" />
                  </span>
                </summary>
                <p className="mt-4 text-slate-600 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Landmark className="h-8 w-8 text-emerald-500" />
                <span className="text-xl font-bold text-white tracking-tight">MOONSTONE</span>
              </div>
              <p className="max-w-sm mb-6">
                Empowering individuals and businesses with modern financial solutions. 
                Moonstone Saving Bank is a registered financial institution providing secure digital banking and instant loans.
              </p>
              <div className="flex gap-4">
                {/* Social placeholders */}
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all cursor-pointer">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all cursor-pointer">
                  <Shield className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4">
                <li><Link to="/about" className="hover:text-emerald-500 transition-colors">About Us</Link></li>
                <li><Link to="/services" className="hover:text-emerald-500 transition-colors">Services</Link></li>
                <li><Link to="/contact" className="hover:text-emerald-500 transition-colors">Contact Support</Link></li>
                <li><Link to="/register" className="hover:text-emerald-500 transition-colors">Open Account</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Legal & Support</h4>
              <ul className="space-y-4">
                <li><Link to="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link></li>
                <li><Link to="#" className="hover:text-emerald-500 transition-colors">Terms of Service</Link></li>
                <li><Link to="#" className="hover:text-emerald-500 transition-colors">Cookie Policy</Link></li>
                <li><Link to="#" className="hover:text-emerald-500 transition-colors">Security Center</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; 2026 Moonstone Saving Bank. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              Regulated by Financial Conduct Authority
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

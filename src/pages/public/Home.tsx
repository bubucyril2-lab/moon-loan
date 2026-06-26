import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Zap, Globe, ArrowRight, CheckCircle2, Landmark, Wifi, RotateCw, HelpCircle, CreditCard } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
// @ts-ignore
import bankHqBg from '../../assets/images/econest_bank_hq_1782508914035.jpg';

const Home = () => {
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const toggleCard = (index: number) => {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  return (
    <div className="min-h-screen">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-end overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={bankHqBg} 
            alt="Hero Background" 
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          {/* Multi-layered gradient overlay: darker on the bottom to protect text contrast, lighter on top to reveal the gorgeous bank signage */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/50 to-slate-900/25 backdrop-blur-[0.5px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-48 pb-16 sm:pb-20 w-full">
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
                Manage your wealth with ECONEST BANK's advanced financial tools.
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
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose ECONEST BANK?</h2>
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
          <p className="text-slate-600 max-w-2xl mx-auto mb-16">Get started with ECONEST BANK in three simple steps.</p>
          
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
              { name: 'Sarah Johnson', role: 'Business Owner', text: 'ECONEST BANK has completely changed how I manage my business finances. The instant transfers are a lifesaver.' },
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

      {/* FAQ Section with Interactive 3D ATM Cards */}
      <section className="py-24 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 tracking-wider uppercase inline-block mb-3">
              Interactive Support
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
              Find answers to common questions styled as our exclusive premium tier card collection. 
              <span className="block mt-1 font-medium text-emerald-600">Click any card to flip and reveal the details!</span>
            </p>
          </div>

          {/* Interactive controls */}
          <div className="flex justify-center mb-12">
            <button
              onClick={() => {
                const someFlipped = [0, 1, 2, 3].some(idx => flippedCards[idx]);
                const nextState = !someFlipped;
                setFlippedCards({
                  0: nextState,
                  1: nextState,
                  2: nextState,
                  3: nextState,
                });
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-500 hover:text-emerald-600 font-semibold text-sm transition-all text-slate-700 active:scale-95"
            >
              <RotateCw className="h-4 w-4 text-emerald-500" />
              <span>
                {[0, 1, 2, 3].some(idx => flippedCards[idx]) ? 'Flip All Front' : 'Flip All Back'}
              </span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {[
              {
                q: 'How do I open an account?',
                a: "You can open an account by clicking the 'Get Started' button and filling out our simple registration form. You'll need to provide some basic information and verify your identity.",
                type: 'Platinum Access',
                bg: 'from-[#022c22] via-[#064e3b] to-[#059669]',
                border: 'border-emerald-500/30',
                network: 'mastercard',
                cvv: '942'
              },
              {
                q: 'What are the loan requirements?',
                a: 'To apply for a loan, you must be a registered member with an active account. Requirements vary based on the loan amount and plan chosen.',
                type: 'World Elite Gold',
                bg: 'from-[#451a03] via-[#78350f] to-[#d97706]',
                border: 'border-amber-500/30',
                network: 'visa',
                cvv: '581'
              },
              {
                q: 'Is my money safe with ECONEST BANK?',
                a: 'Yes, we use industry-standard encryption and security protocols to protect your assets and personal information. We are a registered financial institution.',
                type: 'Infinite Sapphire',
                bg: 'from-[#172554] via-[#1e3a8a] to-[#2563eb]',
                border: 'border-blue-500/30',
                network: 'unionpay',
                cvv: '702'
              },
              {
                q: 'How long does loan approval take?',
                a: 'Our automated system processes applications quickly. Most loans are reviewed and approved within 24 hours.',
                type: 'Signature Ruby',
                bg: 'from-[#4c0519] via-[#881337] to-[#db2777]',
                border: 'border-rose-500/30',
                network: 'visa',
                cvv: '139'
              }
            ].map((card, i) => (
              <div 
                key={i} 
                className="h-[270px] w-full cursor-pointer select-none"
                style={{ perspective: '1000px' }}
                onClick={() => toggleCard(i)}
              >
                <div 
                  className="relative w-full h-full duration-700 transition-all shadow-xl rounded-[2rem]"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: flippedCards[i] ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* FRONT SIDE */}
                  <div 
                    className={`absolute inset-0 w-full h-full rounded-[2rem] p-6 sm:p-7 bg-gradient-to-tr ${card.bg} border ${card.border} flex flex-col justify-between overflow-hidden`}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {/* Decorative Hologram Foil Pattern */}
                    <div className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-overlay bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <div className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-white/[0.03] blur-3xl pointer-events-none"></div>

                    {/* Card Header */}
                    <div className="flex justify-between items-start z-10">
                      <div className="flex items-center gap-1.5">
                        <Landmark className="h-5 w-5 text-white/95" />
                        <span className="font-bold tracking-wider text-xs sm:text-sm text-white">ECONEST BANK</span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-white/70 font-semibold uppercase">{card.type}</span>
                    </div>

                    {/* Chip & Contactless Signal */}
                    <div className="flex items-center justify-between mt-3 z-10">
                      {/* Premium Gold EMV Chip */}
                      <div className="w-11 h-8 sm:w-12 sm:h-9 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-lg shadow-md flex flex-col justify-between p-1.5 border border-amber-300/30">
                        <div className="border border-amber-700/20 rounded h-full w-full flex flex-col justify-between">
                          <div className="border-b border-amber-700/20 h-1/2"></div>
                          <div className="flex justify-between h-1/2">
                            <div className="border-r border-amber-700/20 w-1/3"></div>
                            <div className="border-r border-amber-700/20 w-1/3"></div>
                          </div>
                        </div>
                      </div>
                      {/* Wi-Fi Contactless Symbol */}
                      <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-white/50 rotate-90" />
                    </div>

                    {/* Cardholder Question Placement */}
                    <div className="my-2.5 z-10 flex-1 flex flex-col justify-center">
                      <p className="text-[8px] sm:text-[9px] font-mono text-white/40 tracking-widest uppercase mb-1">Frequently Asked Question</p>
                      <p className="text-base sm:text-lg font-bold text-white tracking-wide leading-snug drop-shadow-sm line-clamp-2">
                        {card.q}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="flex justify-between items-end z-10 pt-2 border-t border-white/15">
                      <div>
                        <p className="text-[8px] font-mono text-white/40 tracking-widest uppercase">Click Card To Flip</p>
                        <span className="text-xs sm:text-sm font-mono text-white/80 tracking-widest mt-0.5 block">•••• •••• •••• 000{i + 1}</span>
                      </div>
                      
                      {/* Card Network Symbol */}
                      <div className="flex items-center">
                        {card.network === 'mastercard' && (
                          <div className="flex -space-x-2.5">
                            <div className="w-6 h-6 rounded-full bg-rose-500 opacity-90"></div>
                            <div className="w-6 h-6 rounded-full bg-amber-500 opacity-90"></div>
                          </div>
                        )}
                        {card.network === 'visa' && (
                          <span className="text-sm sm:text-base font-extrabold italic text-white/90 font-sans tracking-tight">Visa</span>
                        )}
                        {card.network === 'unionpay' && (
                          <div className="flex items-center gap-1 bg-white/15 px-1.5 py-0.5 rounded border border-white/10">
                            <div className="w-1.5 h-3 bg-red-500 rounded-sm"></div>
                            <div className="w-1.5 h-3 bg-blue-500 rounded-sm"></div>
                            <div className="w-1.5 h-3 bg-emerald-500 rounded-sm"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div 
                    className={`absolute inset-0 w-full h-full rounded-[2rem] bg-gradient-to-tr ${card.bg} border ${card.border} flex flex-col justify-between overflow-hidden`}
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    {/* Background Texture overlay */}
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

                    {/* Magnetic Stripe */}
                    <div className="w-full h-9 sm:h-11 bg-slate-950 mt-5 opacity-95"></div>

                    {/* Signature Panel containing Answer */}
                    <div className="px-5 sm:px-6 mt-3 flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-1 px-1">
                        <span className="text-[8px] font-mono text-white/50 tracking-widest uppercase">Authorized Signature / Response</span>
                        <span className="text-[8px] font-mono text-white/50 tracking-widest uppercase">CVV: {card.cvv}</span>
                      </div>
                      
                      {/* High-contrast response box styled as premium signature area */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 shadow-inner relative overflow-hidden min-h-[90px] sm:min-h-[105px] flex items-center">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[repeating-linear-gradient(45deg,#000,#000_10px,transparent_10px,transparent_20px)]"></div>
                        <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed font-sans relative z-10">
                          {card.a}
                        </p>
                      </div>
                    </div>

                    {/* Back side footer */}
                    <div className="p-5 sm:p-6 pt-0 flex justify-between items-center text-white/40">
                      <span className="text-[8px] font-mono tracking-wider">ECONEST BANK CUSTOMER SUPPORT & SECURE LOGOUT</span>
                      <div className="flex items-center gap-1.5 text-[8px] font-mono hover:text-white/75 transition-colors">
                        <RotateCw className="h-3 w-3 animate-spin-slow" />
                        <span>Tap to flip</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Leadership Team</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Guided by decades of expertise in global finance and digital innovation.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                name: 'Robert Sterling', 
                role: 'Chief Executive Officer', 
                image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&h=500&q=80' 
              },
              { 
                name: 'Katherine Glass', 
                role: 'Chief Operating Officer', 
                image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=500&q=80' 
              },
              { 
                name: 'Arthur Wellington', 
                role: 'Head of Global Markets', 
                image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=500&q=80' 
              },
              { 
                name: 'Margaret Vance', 
                role: 'Chief Strategy Officer', 
                image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=500&q=80' 
              }
            ].map((staff, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img 
                    src={staff.image} 
                    alt={staff.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{staff.name}</h3>
                  <p className="text-sm text-emerald-600 font-semibold tracking-wide uppercase">{staff.role}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <p className="text-white text-xs font-medium">30+ Years experience in commercial banking</p>
                </div>
              </motion.div>
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
                <span className="text-xl font-bold text-white tracking-tight">ECONEST BANK</span>
              </div>
              <p className="max-w-sm mb-6">
                Empowering individuals and businesses with modern financial solutions. 
                ECONEST BANK is a registered financial institution providing secure digital banking and instant loans.
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
            <p>&copy; 2026 ECONEST BANK. All rights reserved.</p>
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

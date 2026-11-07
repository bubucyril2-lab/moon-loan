import React from 'react';
import PublicNavbar from '../../components/layout/PublicNavbar';
// @ts-ignore
import bankersGroupImg from '../../assets/images/bankers_group_1793450954338.jpg';

const About = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar />
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-slate-900 mb-8 text-center">About ECONEST BANK</h1>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Founded in 2026, ECONEST BANK was built with a single mission: to redefine the digital banking experience. 
              We believe that banking should be transparent, secure, and accessible to everyone, everywhere.
            </p>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Our team of financial experts and technology innovators work tirelessly to provide you with the most advanced 
              tools to manage your wealth and achieve your financial goals.
            </p>
          </div>
          <img 
            src={bankersGroupImg} 
            alt="ECONEST Banking Executives" 
            className="rounded-3xl shadow-xl border border-slate-200/80 w-full object-cover aspect-[4/3]" 
            referrerPolicy="no-referrer" 
          />
        </div>
      </div>
    </div>
  );
};

export default About;

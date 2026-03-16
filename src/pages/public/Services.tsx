import React from 'react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { Shield, Zap, Globe, Landmark } from 'lucide-react';

const Services = () => {
  const services = [
    { icon: Landmark, title: 'Savings Accounts', desc: 'High-interest savings accounts with no hidden fees.' },
    { icon: Zap, title: 'Instant Transfers', desc: 'Send money globally in seconds with minimal fees.' },
    { icon: Shield, title: 'Secure Loans', desc: 'Flexible personal and business loans tailored to your needs.' },
    { icon: Globe, title: 'International Banking', desc: 'Multi-currency accounts for the global citizen.' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar />
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-slate-900 mb-16 text-center">Our Services</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((s, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <s.icon className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">{s.title}</h3>
              <p className="text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheckCircle, FiUpload, FiCpu, FiMessageSquare,
  FiTrendingUp, FiBell, FiChevronDown, FiPlus, FiArrowRight
} from 'react-icons/fi';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useTheme } from '../hooks/useTheme';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeFaq, setActiveFaq] = useState(null);

  const features = [
    {
      title: 'Easy Form Submission',
      desc: 'Raise complaints in under a minute with categories, priority tags, and location tracking details.',
      icon: FiPlus,
    },
    {
      title: 'Real-Time Tracking',
      desc: 'Watch your tickets progress from Submitted, to Assigned, to In Progress, and finally Resolved.',
      icon: FiCheckCircle,
    },
    {
      title: 'AI Priority Classification',
      desc: 'Smart algorithms automatically classify ticket urgency based on title and description contents.',
      icon: FiCpu,
    },
    {
      title: 'Photo Uploads',
      desc: 'Provide visual evidence by dropping photos and images directly into the complaint ticket.',
      icon: FiUpload,
    },
    {
      title: 'Real-Time Chat Logs',
      desc: 'Communicate directly with assigned technicians or central admins through ticket comment boards.',
      icon: FiMessageSquare,
    },
    {
      title: 'Analytics Dashboards',
      desc: 'Admins and staff get graphical summaries, category metrics, and resolution speed KPIs.',
      icon: FiTrendingUp,
    },
  ];

  const faqs = [
    {
      q: 'Who can use the CampusCare portal?',
      a: 'Our portal is custom-tailored for university students, hostel residents, apartment complexes, and office employees to raise maintenance, facility, IT, or security issues.'
    },
    {
      q: 'How does the priority detection work?',
      a: 'When a ticket is submitted, our simulated AI scans description keywords. Words like "leak", "fire", "locked out" trigger High or Critical priorities, notifying admins immediately.'
    },
    {
      q: 'Can I upload files from my mobile phone?',
      a: 'Yes, the drag-and-drop file upload is fully responsive and supports direct camera snaps on iOS and Android devices.'
    },
    {
      q: 'How long does a ticket usually take to resolve?',
      a: 'Low priority tickets are resolved within 48 hours. Critical tickets (like pipe bursts or power failures) are routed directly to active standby staff for resolution in under 3 hours.'
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className={isDark ? "bg-[#0B0F19]" : "bg-white"}>
      {/* Hero Section */}
      <section id="home" className={`relative pt-10 pb-20 md:py-32 overflow-hidden transition-colors duration-200 ${isDark ? 'bg-slate-900/35' : 'bg-slate-50'}`}>
        {/* Glow Background Spot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className={`inline-flex items-center gap-2 border px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${isDark ? 'bg-slate-900 text-white border-slate-800 shadow-premium' : 'bg-slate-100 text-slate-800 border-slate-200 shadow-sm'}`}>
              <span className="text-neon">✦</span> AI-Driven Ticket Allocation
            </div>
            
            <h1 className={`text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] font-sans ${isDark ? 'text-white' : 'text-slate-950'}`}>
              Track and Resolve <br />
              <span className={`bg-gradient-to-r bg-clip-text text-transparent ${isDark ? 'from-white via-slate-300 to-white' : 'from-slate-950 via-slate-800 to-slate-950'}`}>Complaints Smarter.</span>
            </h1>
            
            <p className={`text-lg leading-relaxed max-w-xl transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              A modern, unified portal helping students, apartment residents, and teams report issues, chat with staff, and track ticket resolutions in real time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="neon"
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="group"
              >
                Get Started Now
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const element = document.querySelector('#features');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Minimalist Tech Mockup Illustration */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`border p-5 rounded-card-lg shadow-2xl space-y-4 text-left transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              {/* Fake Window Controls */}
              <div className={`flex gap-1.5 pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-slate-500 font-mono ml-2">CampusCare System Status</span>
              </div>

              {/* Status Header */}
              <div className={`flex justify-between items-center p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800/60' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Water System Failure</h4>
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hostel B • Room 302</span>
                </div>
                <span className="bg-[#B6FF5C]/10 text-neon border border-neon/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  In Progress
                </span>
              </div>

              {/* Fake Progress */}
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-neon/10 text-neon border border-neon/30 flex items-center justify-center text-[10px]">✓</div>
                  <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Ticket Submitted</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-neon/10 text-neon border border-neon/30 flex items-center justify-center text-[10px]">✓</div>
                  <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Assigned to Marcus Wilson</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-neon text-slate-900 flex items-center justify-center text-[10px] shadow-glow">➔</div>
                  <span className="text-xs font-semibold text-neon">Technician Repairing Pipe leaks</span>
                </div>
              </div>

              {/* Visual Mini Chat box */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`border p-2.5 rounded-lg text-[11px] ${isDark ? 'bg-slate-900 border-slate-850 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                  <span className="font-bold text-neon block mb-0.5">Marcus Wilson (Staff)</span>
                  Replacement pipe arrived. Fixing basement lines now. ETA 3:00 PM.
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted Organizations */}
      <section className={`py-12 border-y transition-colors duration-200 ${isDark ? 'bg-slate-900/20 border-slate-800/60' : 'bg-white border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Trusted by modern organizations globally
          </p>
          <div className={`flex flex-wrap items-center justify-center gap-x-16 gap-y-6 ${isDark ? 'opacity-40' : 'opacity-60'}`}>
            <span className={`text-lg font-black tracking-tight font-sans ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>VERTEX ACADEMY</span>
            <span className={`text-lg font-black tracking-tight font-sans ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>NEXUS APARTMENTS</span>
            <span className={`text-lg font-black tracking-tight font-sans ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>CO-SPACE OFFICES</span>
            <span className={`text-lg font-black tracking-tight font-sans ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>ELEVATE SCHOLASTIC</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-20 md:py-28 transition-colors duration-200 ${isDark ? 'bg-[#0B0F19]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-neon bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              Core Capabilities
            </span>
            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
              Features Built for Speed
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>
              We redesigned the complaint management pipeline to focus on transparency, ease of communication, and dashboard analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Card
                  key={idx}
                  variant={isDark ? 'dark' : 'light'}
                  hoverable
                  className={`text-left flex flex-col justify-between group h-64 border ${isDark ? 'border-slate-800/60' : 'border-slate-100 shadow-sm'}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-neon text-slate-900 flex items-center justify-center text-xl font-bold mb-4 shadow-glow group-hover:scale-110 transition-transform">
                    <Icon />
                  </div>
                  <div>
                    <h3 className={`text-base font-bold mb-2 group-hover:text-neon transition-colors ${isDark ? 'text-white' : 'text-slate-950'}`}>
                      {feat.title}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {feat.desc}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className={`py-20 md:py-28 transition-colors duration-200 ${isDark ? 'bg-slate-900/10 border-y border-slate-800/40' : 'bg-slate-50 border-y border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-neon bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              Process Flow
            </span>
            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
              How CampusCare Works
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>
              From the moment an issue occurs to final verification, the pipeline is transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              { step: '01', title: 'File Ticket', desc: 'Describe the issue, add location details, and upload image files.' },
              { step: '02', title: 'Route & Assign', desc: 'AI suggests urgency, and administrators delegate to specialized staff.' },
              { step: '03', title: 'Track Progress', desc: 'Get notified of updates, read staff remarks, and chat in real-time.' },
              { step: '04', title: 'Verify Resolution', desc: 'Review resolution photos and comments, then mark ticket as closed.' },
            ].map((item, idx) => (
              <div key={idx} className={`text-left space-y-3 p-6 rounded-card relative z-10 border transition-all duration-200 ${isDark ? 'bg-[#111827] border-slate-800 shadow-premium' : 'bg-white border-slate-150 shadow-sm'}`}>
                <span className="text-3xl font-black text-neon block">{item.step}</span>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>{item.title}</h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`py-20 transition-colors duration-200 ${isDark ? 'bg-[#0B0F19]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-neon bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              Feedback
            </span>
            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-950'}`}>
              What Users Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: 'Using CampusCare, our hostel complaints get assigned and fixed in hours instead of days. The chat interface is extremely convenient.',
                author: 'Alex Johnson',
                role: 'Hostel B Student Resident',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
              },
              {
                quote: 'As administrative manager, managing hundreds of daily facility issues was a nightmare. This dashboard helps us track SLAs and allocate workloads seamlessly.',
                author: 'Sarah Jenkins',
                role: 'Central Office Administrator',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
              },
              {
                quote: 'I get clear details of issues and photographs of the problem before I arrive on-site. I can upload resolved pictures, marking my work complete in one tap.',
                author: 'Marcus Wilson',
                role: 'Maintenance Plumbing Staff',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus'
              }
            ].map((t, idx) => (
              <Card key={idx} variant={isDark ? 'dark' : 'light'} className={`text-left flex flex-col justify-between h-64 p-8 border ${isDark ? 'border-slate-800/60' : 'border-slate-100 shadow-sm'}`}>
                <p className={`text-xs italic leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  "{t.quote}"
                </p>
                <div className={`flex items-center gap-3.5 mt-6 pt-4 border-t ${isDark ? 'border-slate-800/40' : 'border-slate-150'}`}>
                  <img src={t.avatar} alt={t.author} className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900 object-cover" />
                  <div>
                    <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.author}</h4>
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.role}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className={`py-20 md:py-28 border-t transition-colors duration-200 ${isDark ? 'bg-slate-900/10 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
        <div className="max-w-3xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-neon bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              Help Center
            </span>
            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-950'}`}>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className={`border rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/60'}`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className={`w-full flex items-center justify-between p-5 text-left font-bold transition-colors text-sm ${isDark ? 'text-white hover:bg-slate-800/40' : 'text-slate-900 hover:bg-slate-50'}`}
                  >
                    <span>{faq.q}</span>
                    <FiChevronDown className={`text-lg transition-transform duration-200 ${isOpen ? 'rotate-180 text-neon' : 'text-slate-500'}`} />
                  </button>

                  <div className={`
                    transition-all duration-200 ease-in-out overflow-hidden
                    ${isOpen ? 'max-h-60 border-t p-5' : 'max-h-0'}
                    ${isDark ? 'border-slate-800' : 'border-slate-100'}
                  `}>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

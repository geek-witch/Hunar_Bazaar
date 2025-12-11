import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar
} from 'recharts';

import { Users, AlertCircle, Coins, Share2 } from 'lucide-react'; 

const data = [
  { name: 'Jan', users: 400, complaints: 24 },
  { name: 'Feb', users: 520, complaints: 30 },
  { name: 'Mar', users: 610, complaints: 38 },
  { name: 'Apr', users: 700, complaints: 39 },
  { name: 'May', users: 750, complaints: 48 },
  { name: 'Jun', users: 820, complaints: 38 },
  { name: 'Jul', users: 870, complaints: 43 },
  { name: 'Aug', users: 900, complaints: 40 },
  { name: 'Sep', users: 930, complaints: 33 },
  { name: 'Oct', users: 960, complaints: 28 },
  { name: 'Nov', users: 990, complaints: 20 },
  { name: 'Dec', users: 1000, complaints: 25 },
];

const revenueData = [
  { name: 'Basic', value: 4000 },
  { name: 'Premium', value: 8500 },
  { name: 'Pro', value: 9000 },
];

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-[#E6EEF9] p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between transition-transform hover:-translate-y-1 duration-300 w-full relative z-10">
    <div>
      <p className="text-sm text-[#0E4B5B] font-bold uppercase tracking-wider mb-2 opacity-70">{title}</p>
      <h3 className="text-3xl font-bold text-[#0E4B5B]">{value}</h3>
    </div>
    <div className={`p-4 rounded-xl ${color} bg-opacity-10`}>
      <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

export const Dashboard = () => {
  return (
    <div className="relative">
    <div className="space-y-8 relative z-10">

        {/* BANNER */}
        <div className="bg-gradient-to-r from-[#0E4B5B] to-[#1a6b7d] rounded-2xl p-6 lg:p-8 border border-[#0E4B5B]/30 shadow-lg relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none" viewBox="0 0 1200 400">
            <defs>
              <style>
                {`
                  @keyframes wave1 { 0% { transform: translateX(0); } 100% { transform: translateX(1200px); }}
                  @keyframes wave2 { 0% { transform: translateX(-600px); } 100% { transform: translateX(600px); }}
                  @keyframes wave3 { 0% { transform: translateX(0); } 100% { transform: translateX(-1200px); }}
                  .wave-1 { animation: wave1 15s linear infinite; }
                  .wave-2 { animation: wave2 20s linear infinite; }
                  .wave-3 { animation: wave3 25s linear infinite; }
                `}
              </style>
            </defs>
            <path className="wave-1" d="M 0 200 Q 300 150 600 200 T 1200 200 L 1200 400 L 0 400 Z" fill="rgba(255, 255, 255, 0.15)" />
            <path className="wave-2" d="M 0 250 Q 300 200 600 250 T 1200 250 L 1200 400 L 0 400 Z" fill="rgba(16, 185, 129, 0.12)" />
            <path className="wave-3" d="M 0 280 Q 300 240 600 280 T 1200 280 L 1200 400 L 0 400 Z" fill="rgba(255, 255, 255, 0.1)" />
          </svg>

          <div className="relative z-10">
            <h1 className="text-2xl lg:text-3xl font-black text-white">Welcome to Hunar Bazaar</h1>
            <p className="text-sm lg:text-base text-white/90 mt-2 max-w-2xl">
              Manage users, subscriptions, and handle disputes efficiently from your control center.
            </p>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Users" value="12,345" icon={Users} color="bg-blue-600" />
          <StatCard title="Active Disputes" value="23" icon={AlertCircle} color="bg-red-500" />
          <StatCard title="Monthly Revenue" value="PKR 450k" icon={Coins} color="bg-[#0E4B5B]" /> 
          <StatCard title="Successful Skill Exchanges" value="8,942" icon={Share2} color="bg-green-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* USER GROWTH + COMPLAINTS CHART */}
          <div className="bg-[#E6EEF9] p-6 sm:p-8 rounded-2xl shadow-sm border border-blue-100">
            <h3 className="text-xl font-bold text-[#0E4B5B] mb-6">User Growth & Complaints</h3>

            <div className="h-[300px] sm:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 0, right: 0, left: 50, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0E4B5B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0E4B5B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>

                  <XAxis dataKey="name" tick={{ fill: "#0E4B5B", fontWeight: 600 }} />
                  <YAxis tick={{ fill: "#28474fff", fontWeight: 600 }} domain={[0, 1000]} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />

                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: "none", background: "#fff", padding: "10px" }}
                  />

                  <Area type="monotone" dataKey="users" stroke="#0E4B5B" strokeWidth={3} fill="url(#colorUsers)" />
                  <Area type="monotone" dataKey="complaints" stroke="#ef4444" strokeWidth={3} fill="url(#colorComplaints)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* REVENUE CHART */}
          <div className="bg-[#E6EEF9] p-6 sm:p-8 rounded-2xl shadow-sm border border-blue-100">
            <h3 className="text-xl font-bold text-[#0E4B5B] mb-6">Revenue by Plan</h3>

            <div className="h-[300px] sm:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 0, right: 0, left: 50, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />

                  <XAxis dataKey="name" tick={{ fill: "#0E4B5B", fontWeight: 600 }} />
                  <YAxis tick={{ fill: "#0E4B5B", fontWeight: 600 }} domain={[0, 10000]} />

                  <Tooltip
                    contentStyle={{ borderRadius: 10, background: "#fff", border: "none", padding: "10px" }}
                  />

                  <Bar dataKey="value" fill="#0E4B5B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* FIX CLIPPING */}
      <style>{`
        .recharts-surface {
          overflow: visible !important;
        }
        .recharts-cartesian-axis-tick text {
          overflow: visible !important;
        }
        .recharts-cartesian-axis-tick text,
        .recharts-text,
        text {
          fill: #0E4B5B !important;
        }
      `}</style>

    </div>
  );
};

import React from 'react';
import { useTranslation } from '../../../i18n/useTranslation';
import { ShieldCheck, Award, Globe, Briefcase, Sparkles } from 'lucide-react';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="space-y-6 animate-fade-in-up">
          {/* Hero Showcase Banner */}
          <div className="bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-navy-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

              <div className="relative z-10 space-y-4 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-orange-500 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                          National Cooperative Platform
                      </span>
                      <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Citizen & Worker First
                      </span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                      Empowering Skilled Workers, Delivering Trusted Home Services
                  </h2>

                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                      COOP HUB is India’s dedicated cooperative service platform built to connect households with certified, background-verified technicians. By operating on transparent cooperative tariffs with 0% middleman exploitation, we guarantee fair prices for customers and sustainable livelihoods for skilled workers.
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300">
                      <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> 100% Certified Specialists</span>
                      <span className="flex items-center gap-1.5"><Award size={14} className="text-orange-400" /> Fixed Cooperative Tariff (0% Surge)</span>
                      <span className="flex items-center gap-1.5"><Globe size={14} className="text-blue-400" /> 23 Official Indian Languages</span>
                  </div>
              </div>
          </div>

          {/* Four Core Values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-navy-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                      <Award size={20} />
                  </div>
                  <h4 className="font-bold text-navy-900 dark:text-white text-sm">Transparent Tariffs</h4>
                  <p className="text-xs text-navy-500 dark:text-slate-400 leading-relaxed">
                      Zero surge pricing and no hidden costs. Pay standard tariffs established by the Cooperative Board for every service.
                  </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-navy-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <Briefcase size={20} />
                  </div>
                  <h4 className="font-bold text-navy-900 dark:text-white text-sm">Certified Specialists</h4>
                  <p className="text-xs text-navy-500 dark:text-slate-400 leading-relaxed">
                      Every technician (electrician, plumber, carpenter) is trade-qualified, vetted, and registered under local cooperatives.
                  </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-navy-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <ShieldCheck size={20} />
                  </div>
                  <h4 className="font-bold text-navy-900 dark:text-white text-sm">Arrival OTP Security</h4>
                  <p className="text-xs text-navy-500 dark:text-slate-400 leading-relaxed">
                      Your safety is guaranteed with secure 6-digit Arrival OTP verification before any technician starts service in your home.
                  </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-navy-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      <Sparkles size={20} />
                  </div>
                  <h4 className="font-bold text-navy-900 dark:text-white text-sm">Fair Worker Support</h4>
                  <p className="text-xs text-navy-500 dark:text-slate-400 leading-relaxed">
                      100% of service payments go directly to local skilled technicians, providing fair compensation and social security.
                  </p>
              </div>
          </div>

          {/* Customer Service Guarantees */}
          <div className="bg-white dark:bg-slate-900 border border-navy-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-navy-100 dark:border-slate-800 pb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck size={22} className="text-orange-500" />
                      <span>COOP HUB Service Charter & Assurances</span>
                  </h3>
                  <p className="text-xs text-navy-500 dark:text-slate-400 mt-1">
                      Our public service commitments to every customer and cooperative pillar.
                  </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-navy-100 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-navy-600 dark:text-slate-300 font-bold border-b border-navy-100 dark:border-slate-800">
                          <tr>
                              <th className="py-3.5 px-4">Service Guarantee</th>
                              <th className="py-3.5 px-4">Standard Policy</th>
                              <th className="py-3.5 px-4">Protection</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-50 dark:divide-slate-800 font-medium text-navy-800 dark:text-slate-200">
                          <tr>
                              <td className="py-3 px-4 font-bold text-orange-600 dark:text-orange-400">Pricing Policy</td>
                              <td className="py-3 px-4">Standard Cooperative Tariff</td>
                              <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">0% Surge Pricing Guarantee</td>
                          </tr>
                          <tr>
                              <td className="py-3 px-4 font-bold text-orange-600 dark:text-orange-400">Technician Standards</td>
                              <td className="py-3 px-4">Trade Certified Specialists (ITI / NSDC)</td>
                              <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">Background Checked & Cooperative Vetted</td>
                          </tr>
                          <tr>
                              <td className="py-3 px-4 font-bold text-orange-600 dark:text-orange-400">Home Safety</td>
                              <td className="py-3 px-4">6-Digit Arrival OTP Handshake</td>
                              <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">Verified Specialist Identity Before Entry</td>
                          </tr>
                          <tr>
                              <td className="py-3 px-4 font-bold text-orange-600 dark:text-orange-400">Customer Support</td>
                              <td className="py-3 px-4">24/7 Dedicated Assistance</td>
                              <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">Local Cooperative Dispute Resolution</td>
                          </tr>
                          <tr>
                              <td className="py-3 px-4 font-bold text-orange-600 dark:text-orange-400">Social Responsibility</td>
                              <td className="py-3 px-4">Cooperative Societies Model</td>
                              <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">100% Direct Payouts to Workers</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    </div>
  );
}

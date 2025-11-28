import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiBriefcase, HiSearch, HiUserGroup, HiLightningBolt, HiSparkles } from 'react-icons/hi';
import { FaRocket, FaBrain, FaCheckCircle } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';

const Home = () => {
  const { isAuthorized } = useContext(AuthContext);

  const features = [
    {
      icon: HiBriefcase,
      title: 'Thousands of Jobs',
      description: 'Browse through thousands of job listings from top companies',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: FaBrain,
      title: 'AI-Powered Matching',
      description: 'Get personalized job recommendations based on your resume',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: HiLightningBolt,
      title: 'Quick Apply',
      description: 'Apply to multiple jobs with a single click',
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: HiUserGroup,
      title: 'Top Employers',
      description: 'Connect with leading companies hiring now',
      color: 'from-indigo-500 to-indigo-600',
    },
  ];

  const stats = [
    { label: 'Active Jobs', value: '10,000+', icon: HiBriefcase },
    { label: 'Companies', value: '5,000+', icon: HiUserGroup },
    { label: 'Success Rate', value: '95%', icon: FaCheckCircle },
    { label: 'AI Matches', value: '50,000+', icon: FaBrain },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <HiSparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  AI-Powered Job Matching
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Find Your Dream Job with{' '}
                <span className="gradient-text">AI Assistance</span>
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Upload your resume and let our AI chatbot recommend the perfect jobs for you. Get interview tips and career guidance.
              </p>
              
              <div className="flex flex-wrap gap-4">
                {isAuthorized ? (
                  <Link
                    to="/jobs"
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-purple-500/50 font-semibold flex items-center gap-2"
                  >
                    <HiSearch className="w-6 h-6" />
                    Browse Jobs
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-purple-500/50 font-semibold flex items-center gap-2"
                    >
                      <FaRocket className="w-5 h-5" />
                      Get Started
                    </Link>
                    <Link
                      to="/login"
                      className="px-8 py-4 glass border-2 border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 hover:scale-105 font-semibold"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 glass p-8 rounded-3xl shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                  alt="Team collaboration"
                  className="rounded-2xl w-full"
                />
              </div>
              <div className="absolute -z-10 top-10 right-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl"></div>
              <div className="absolute -z-10 bottom-10 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass p-6 rounded-2xl text-center hover:scale-105 transition-all duration-200"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose <span className="gradient-text">JobPortal</span>?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience the future of job hunting with AI-powered features
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass p-6 rounded-2xl hover:scale-105 transition-all duration-200 group"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass p-12 rounded-3xl text-center relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Find Your Dream Job?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Join thousands of job seekers who found their perfect match
              </p>
              {!isAuthorized && (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-purple-500/50 font-semibold"
                >
                  <FaRocket className="w-5 h-5" />
                  Sign Up Now
                </Link>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10"></div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;

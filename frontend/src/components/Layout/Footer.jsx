import React from 'react';
import { FaGithub, FaLinkedin, FaTwitter, FaHeart } from 'react-icons/fa';
import { HiBriefcase, HiMail } from 'react-icons/hi';

const Footer = () => {
  return (
    <footer className="glass border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <HiBriefcase className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <span className="text-2xl font-bold gradient-text">JobPortal</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
              Find your dream job or discover the perfect candidate with our AI-powered job matching platform. Get personalized recommendations based on your resume.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-purple-500 hover:text-white transition-all duration-200 hover:scale-110"
                aria-label="GitHub"
              >
                <FaGithub className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-purple-500 hover:text-white transition-all duration-200 hover:scale-110"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-purple-500 hover:text-white transition-all duration-200 hover:scale-110"
                aria-label="Twitter"
              >
                <FaTwitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/jobs" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Browse Jobs
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <HiMail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>support@jobportal.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              © {new Date().getFullYear()} JobPortal. All rights reserved.
            </p>
            <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
              Made with <FaHeart className="text-red-500" /> using AI & Modern Design
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

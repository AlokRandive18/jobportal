<<<<<<< HEAD
import React, { useContext, useState } from "react";
import { Context } from "../../main";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { GiHamburgerMenu } from "react-icons/gi";
import { AiOutlineClose } from "react-icons/ai"; // Import the close icon

const Navbar = () => {
  const [show, setShow] = useState(false);
  const { isAuthorized, setIsAuthorized, user } = useContext(Context);
  const navigateTo = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await axios.get(
        "http://localhost:4000/api/v1/user/logout",
        {
          withCredentials: true,
        }
      );
      toast.success(response.data.message);
      setIsAuthorized(false);
      navigateTo("/login");
    } catch (error) {
      toast.error(error.response.data.message), setIsAuthorized(true);
    }
  };

  return (
    <nav className={isAuthorized ? "navbarShow" : "navbarHide"}>
      <div className="container">
        <div className="logo">
          <img src="/careerconnect-white.png" alt="logo" />
        </div>
        <ul className={!show ? "menu" : "show-menu menu"}>
          <li>
            <Link to={"/"} onClick={() => setShow(false)}>
              HOME
            </Link>
          </li>
          <li>
            <Link to={"/job/getall"} onClick={() => setShow(false)}>
              ALL JOBS
            </Link>
          </li>
          <li>
            <Link to={"/applications/me"} onClick={() => setShow(false)}>
              {user && user.role === "Employer"
                ? "APPLICANT'S APPLICATIONS"
                : "MY APPLICATIONS"}
            </Link>
          </li>
          {user && user.role === "Employer" ? (
            <>
              <li>
                <Link to={"/job/post"} onClick={() => setShow(false)}>
                  POST NEW JOB
                </Link>
              </li>
              <li>
                <Link to={"/job/me"} onClick={() => setShow(false)}>
                  VIEW YOUR JOBS
                </Link>
              </li>
            </>
          ) : null}

          <button onClick={handleLogout}>LOGOUT</button>
        </ul>
        <div className="hamburger" onClick={() => setShow(!show)}>
          {show ? <AiOutlineClose /> : <GiHamburgerMenu />}
        </div>
=======
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { HiMenu, HiX, HiSun, HiMoon, HiBriefcase, HiLogin, HiUserAdd } from 'react-icons/hi';
import { MdWork, MdDashboard, MdFilePresent } from 'react-icons/md';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { isAuthorized, user, logout } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const NavLink = ({ to, children, icon: Icon }) => (
    <Link
      to={to}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200 hover:scale-105"
      onClick={() => setIsOpen(false)}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 glass border-b border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold gradient-text hover:scale-105 transition-transform"
          >
            <HiBriefcase className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <span>JobPortal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/jobs">Browse Jobs</NavLink>
            
            {isAuthorized ? (
              <>
                {user?.role === 'Employer' ? (
                  <>
                    <NavLink to="/job/post" icon={MdWork}>Post Job</NavLink>
                    <NavLink to="/job/me" icon={MdDashboard}>My Jobs</NavLink>
                  </>
                ) : (
                  <NavLink to="/applications/me" icon={MdFilePresent}>My Applications</NavLink>
                )}
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" icon={HiLogin}>Login</NavLink>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <HiUserAdd className="w-5 h-5" />
                  Register
                </Link>
              </>
            )}
            
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-110"
              aria-label="Toggle theme"
            >
              {darkMode ? <HiSun className="w-6 h-6 text-yellow-400" /> : <HiMoon className="w-6 h-6 text-gray-700" />}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              aria-label="Toggle theme"
            >
              {darkMode ? <HiSun className="w-5 h-5 text-yellow-400" /> : <HiMoon className="w-5 h-5 text-gray-700" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              aria-label="Toggle menu"
            >
              {isOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2 animate-fadeIn">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/jobs">Browse Jobs</NavLink>
            
            {isAuthorized ? (
              <>
                {user?.role === 'Employer' ? (
                  <>
                    <NavLink to="/job/post" icon={MdWork}>Post Job</NavLink>
                    <NavLink to="/job/me" icon={MdDashboard}>My Jobs</NavLink>
                  </>
                ) : (
                  <NavLink to="/applications/me" icon={MdFilePresent}>My Applications</NavLink>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" icon={HiLogin}>Login</NavLink>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
                >
                  <HiUserAdd className="w-5 h-5" />
                  Register
                </Link>
              </>
            )}
          </div>
        )}
>>>>>>> 7e588941524f722dc134e25bb81a301a215b05a3
      </div>
    </nav>
  );
};

export default Navbar;

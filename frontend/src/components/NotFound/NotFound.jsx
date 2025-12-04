<<<<<<< HEAD
import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <>
        <section className='page notfound'>
          <div className="content">
            <img src="/notfound.png" alt="notfound" />
            <Link to={'/'}>RETURN TO HOME PAGE</Link>
          </div>
        </section>
    </>
  )
}

export default NotFound
=======
import React from 'react';
import { Link } from 'react-router-dom';
import { HiHome } from 'react-icons/hi';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <h1 className="text-9xl font-bold gradient-text">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-lg font-semibold"
        >
          <HiHome className="w-5 h-5" />
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
>>>>>>> 7e588941524f722dc134e25bb81a301a215b05a3

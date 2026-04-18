import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'glass-panel py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="text-2xl font-black text-brand-600 dark:text-brand-500 tracking-tight">SmartDash</Link>
        <div className="flex items-center gap-6">
          <a href="/#features" className="hidden md:block text-gray-600 hover:text-brand-600 dark:text-gray-300 font-medium transition-colors">Features</a>
          <Link to="/login" className="text-gray-600 hover:text-brand-600 dark:text-gray-300 font-medium transition-colors">Login</Link>
          <Link to="/register" className="btn-primary py-2 text-sm shadow-md">Try for Free</Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

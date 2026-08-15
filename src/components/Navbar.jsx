import React, { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? 'glass' : ''}`}>
      <div className="nav-container">
        <a href="#" className="logo">Dev<span>.Portfolio</span></a>
        
        <div className={`nav-links ${menuOpen ? 'open glass' : ''}`}>
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#projects" onClick={() => setMenuOpen(false)}>Projects</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </div>

        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span className={menuOpen ? 'bar active' : 'bar'}></span>
          <span className={menuOpen ? 'bar active' : 'bar'}></span>
          <span className={menuOpen ? 'bar active' : 'bar'}></span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

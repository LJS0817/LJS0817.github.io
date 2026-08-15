import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section id="home" className="hero fade-in">
      <div className="hero-content">
        <h4 className="greeting">Hello, I'm</h4>
        <h1>A Creative Developer.</h1>
        <p>I build beautiful, responsive, and user-centric web applications.</p>
        <div className="hero-buttons">
          <a href="#projects" className="btn btn-primary">View My Work</a>
          <a href="#contact" className="btn btn-outline">Contact Me</a>
        </div>
      </div>
      <div className="hero-image">
        {/* Abstract shape instead of a real image to look cool */}
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>
    </section>
  );
};

export default Hero;

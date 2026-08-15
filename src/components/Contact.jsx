import React from 'react';
import { Mail, Github, Linkedin, Twitter } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  return (
    <section id="contact" className="contact">
      <div className="contact-container glass">
        <h2>Let's Work Together</h2>
        <p>I'm currently looking for new opportunities. Whether you have a question or just want to say hi, I'll try my best to get back to you!</p>
        
        <a href="mailto:hello@example.com" className="btn btn-primary contact-btn">
          Say Hello
        </a>

        <div className="social-links">
          <a href="#" className="social-icon"><Github /></a>
          <a href="#" className="social-icon"><Linkedin /></a>
          <a href="#" className="social-icon"><Twitter /></a>
          <a href="#" className="social-icon"><Mail /></a>
        </div>
      </div>
    </section>
  );
};

export default Contact;

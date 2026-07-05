// src/components/Footer.jsx
import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.topSection}>
        <div className={styles.brand}>
          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>T</div>
            <span className={styles.logoText}>Trevilo</span>
          </div>
          <p className={styles.tagline}>
            An AI travel concierge built for people who travel the way you do — with curiosity, not checklists.
          </p>
          <div className={styles.socials}>
            {/* Icons placeholders */}
            <span>[IG]</span>
            <span>[TW]</span>
            <span>[YT]</span>
          </div>
        </div>
        
        <div className={styles.linksGrid}>
          <div className={styles.linkColumn}>
            <h4>Product</h4>
            <ul>
              <li><a href="#aiplanner">AI Planner</a></li>
              <li><a href="#maps">Maps</a></li>
              <li><a href="#concierge">Concierge</a></li>
              <li><a href="#mobile">Mobile App</a></li>
            </ul>
          </div>
          <div className={styles.linkColumn}>
            <h4>Company</h4>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#press">Press</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div className={styles.linkColumn}>
            <h4>Resources</h4>
            <ul>
              <li><a href="#guides">Guides</a></li>
              <li><a href="#stories">Stories</a></li>
              <li><a href="#help">Help Center</a></li>
              <li><a href="#terms">Terms</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className={styles.bottomBar}>
        <p>© 2026 Trevilo. Designed for the modern explorer.</p>
        <div className={styles.legalLinks}>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
// src/components/Header.jsx
import React from 'react';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>T</div> {/* Simple representation */}
        <span className={styles.logoText}>Trevilo</span>
      </div>
      <nav className={styles.nav}>
        <ul>
          <li><a href="#home">Home</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#service">Service</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#plan">Plan</a></li>
        </ul>
      </nav>
      <div className={styles.authButtons}>
        <a href="#signup" className={styles.signUp}>Sign up</a>
        <a href="#login" className={styles.login}>Login</a>
      </div>
    </header>
  );
};

export default Header;
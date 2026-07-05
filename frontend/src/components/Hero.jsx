import React, { useState } from 'react';
import styles from './Hero.module.css';

const Hero = () => {
  const [activeTab, setActiveTab] = useState('Hotel');

  const tabs = [
    { id: 'Hotel', icon: '🏨' },
    { id: 'Flight', icon: '✈️' },
    { id: 'Car', icon: '🚗' },
    { id: 'Event', icon: '🎫' }
  ];

  return (
    <section className={styles.heroSection}>
      {/* The background image is applied in the CSS */}
      <div className={styles.overlay}></div>
      
      <div className={styles.content}>
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>✨</span> PONTON TREVILO
        </div>
        
        <h1 className={styles.title}>
          Discover the magic in <span className={styles.italic}>every</span><br />
          destination with us.
        </h1>
        
        <p className={styles.subtitle}>
          Enjoy exclusive offers and best prices on satisfying travel packages,<br />
          orchestrated by an AI that understands how you move.
        </p>

        <div className={styles.searchContainer}>
          {/* Top Tabs */}
          <div className={styles.tabs}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={styles.tabIcon}>{tab.icon}</span> {tab.id}
              </button>
            ))}
          </div>

          {/* Main Search Bar */}
          <div className={styles.searchInputs}>
            <div className={styles.inputGroup}>
              <span className={styles.icon}>📍</span>
              <div className={styles.inputText}>
                <label>DESTINATION</label>
                <input type="text" placeholder="City or destination" />
              </div>
            </div>
            
            <div className={styles.divider}></div>
            
            <div className={styles.inputGroup}>
              <span className={styles.icon}>📅</span>
              <div className={styles.inputText}>
                <label>CHECK-IN</label>
                <input type="text" placeholder="Add date" />
              </div>
            </div>
            
            <div className={styles.divider}></div>
            
            <div className={styles.inputGroup}>
              <span className={styles.icon}>📅</span>
              <div className={styles.inputText}>
                <label>CHECK-OUT</label>
                <input type="text" placeholder="Add date" />
              </div>
            </div>
            
            <div className={styles.divider}></div>
            
            <div className={styles.inputGroup}>
              <span className={styles.icon}>👥</span>
              <div className={styles.inputText}>
                <label>TRAVELERS</label>
                <input type="text" placeholder="Add guests" />
              </div>
            </div>
            
            <button className={styles.searchButton}>
              <span className={styles.searchIcon}>🔍</span> Search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
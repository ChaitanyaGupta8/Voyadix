// src/components/Features.jsx
import React from 'react';
import styles from './Features.module.css';

const featuresData = [
  {
    title: "Intelligent routing",
    description: "Every stop and street is optimized — less zig-zag, more discovery.",
    icon: "🌐", // Placeholder for actual icon
  },
  {
    title: "184 countries",
    description: "Local insights from people who actually live there, not algorithms.",
    icon: "📍",
  },
  {
    title: "Booked & protected",
    description: "Flexible bookings, instant rebooks, refund support if plans shift.",
    icon: "🛡️",
  },
  {
    title: "Concierge on call",
    description: "Real humans on standby, mid-trip — 24/7, in every timezone.",
    icon: "📞",
  },
];

const Features = () => {
  return (
    <section className={styles.features}>
      <div className={styles.intro}>
        <p className={styles.introSubtitle}>WHY TREVILO</p>
        <h2 className={styles.introTitle}>Built for the way travel actually feels.</h2>
        <p className={styles.introDescription}>
          We replaced the boring spreadsheet with an AI that understands context, mood, weather, queues, and the quiet hours in between.
        </p>
        <button className={styles.startPlanning}>Start planning →</button>
      </div>
      
      <div className={styles.grid}>
        {featuresData.map((feature, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.cardIcon}>{feature.icon}</div>
            <h3 className={styles.cardTitle}>{feature.title}</h3>
            <p className={styles.cardDescription}>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
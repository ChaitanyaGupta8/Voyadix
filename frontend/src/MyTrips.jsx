import React, { useEffect, useState } from 'react';
import './Plan.css';
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function MyTrips({ onNavigateHome }) {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    const fetchTrips = async () => {
      const token = localStorage.getItem('voyadix_token');
      const response = await fetch(`${API_URL}/api/trips/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTrips(data);
    };
    fetchTrips();
  }, []);

  return (
    <div className="plan-container">
      <header className="site-header">
        <div className="logo-container" onClick={onNavigateHome} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">V</div>
          <span className="logo-text">Voyadix</span>
        </div>
        <nav className="nav-menu">
          <button className="nav-link" onClick={onNavigateHome}>Home</button>
          <span className="nav-link active">My Trips</span>
        </nav>
      </header>

      <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Playfair Display' }}>My Saved Journeys</h1>
        <div className="trips-grid" style={{ display: 'grid', gap: '20px', marginTop: '30px' }}>
          {trips.map(trip => (
            <div key={trip.id} className="day-card" style={{ padding: '20px', borderRadius: '15px', border: '1px solid #EAEAEA' }}>
              <h3>{trip.destination}</h3>
              <p>{trip.duration} Day Adventure</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
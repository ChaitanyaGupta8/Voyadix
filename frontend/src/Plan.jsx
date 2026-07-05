import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; 
import './Plan.css';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const CATEGORIES = ['Adventure', 'Culture', 'Beaches', 'Culinary', 'Urban', 'Nature'];

function MapController({ coordinates }) {
  const map = useMap();
  if (coordinates && coordinates.length > 0) {
    const bounds = L.latLngBounds(coordinates);
    map.fitBounds(bounds, { padding: [50, 50] });
  }
  return null;
}


export default function Plan({ onNavigateHome, initialPrompt }) {
  
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [activeCategory, setActiveCategory] = useState('Culture');
  const [loading, setLoading] = useState(false);
  
  const [itinerary, setItinerary] = useState(null);
  
  const [streetRoutes, setStreetRoutes] = useState({});

  const handleOptimize = async () => {
    if (!prompt) return;
    setLoading(true);
    setItinerary(null);
    setStreetRoutes({});

    try {
      const response = await fetch(`${API_URL}/generate-itinerary` , {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_prompt: prompt })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (data.status === "success") {
        const constraints = data.extracted_constraints || {};
        const scheduleObj = data.itinerary || {};
        
        // Map Python dict to React array
        const formattedDays = Object.keys(scheduleObj).map((dayKey, index) => {
          const dayEvents = scheduleObj[dayKey] || [];
          return {
            day: index + 1,
            stops: dayEvents.length,
            walking: '~ Route Computed', 
            events: dayEvents.map(evt => ({
              time: evt.scheduled_time || 'TBD',
              title: evt.name || 'Notable Location',
              tag: (evt.category || 'EXPLORE').toUpperCase(),
              desc: evt.description || 'Details coming soon.',
              lat: evt.latitude,
              lng: evt.longitude,
              img: evt.image_url || `https://source.unsplash.com/150x150/?${encodeURIComponent(evt.name + ' ' + evt.category)}` 
            }))
          };
        });

        setItinerary({
          duration: constraints.duration_days || formattedDays.length,
          landmarks: formattedDays.reduce((acc, day) => acc + day.stops, 0),
          location: constraints.destination || 'Unknown Destination',
          days: formattedDays
        });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate itinerary. Check your backend server.");
    } finally {
      setLoading(false);
    }
  };

  // PASTE saveTrip HERE
  const saveTrip = async () => {
    const token = localStorage.getItem('voyadix_token');
    if (!token) {
      alert("Please log in to save your trips!");
      return;
    }

    const response = await fetch(`${API_URL}/api/trips/save`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        destination: itinerary.location,
        duration: itinerary.duration,
        itinerary: itinerary.days
      })
    });

    if (response.ok) alert("Voyadix journey saved!");
    else alert("Failed to save trip.");
  };


  useEffect(() => {
    if (!itinerary || !itinerary.days) return;

    const fetchStreetRoutes = async () => {
      const newRoutes = {};
      
      for (const dayData of itinerary.days) {
        if (dayData.events.length < 2) continue;

        const validEvents = dayData.events.filter(evt => evt.lat && evt.lng);
        if (validEvents.length < 2) continue;

        const coordinateString = validEvents
          .map(stop => `${stop.lng},${stop.lat}`)
          .join(';');

        try {
          const response = await axios.get(
            `https://router.project-osrm.org/route/v1/driving/${coordinateString}?geometries=geojson&overview=full`
          );

          if (response.data.routes && response.data.routes.length > 0) {
            const routeCoords = response.data.routes[0].geometry.coordinates.map(
              coord => [coord[1], coord[0]]
            );
            newRoutes[`Day ${dayData.day}`] = routeCoords;
          }
        } catch (error) {
          console.error(`Failed to fetch route for Day ${dayData.day}:`, error);
        }
      }
      setStreetRoutes(newRoutes);
    };

    fetchStreetRoutes();
  }, [itinerary]);

  const getAllCoordinates = () => {
    if (!itinerary || !itinerary.days) return [];
    const coords = [];
    itinerary.days.forEach(day => {
      day.events.forEach(evt => {
        if (evt.lat && evt.lng) coords.push([evt.lat, evt.lng]);
      });
    });
    return coords;
  };

  return (
    <div className="plan-container">
      {/* Header */}
      <header className="site-header">
        <div className="logo-container" onClick={onNavigateHome} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">V</div>
          <span className="logo-text">Voyadix</span>
        </div>
        
        <nav className="nav-menu">
          <button 
            type="button"
            className="nav-link" 
            onClick={onNavigateHome}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px' }}
          >
            Home
          </button>
          
          <button 
            type="button"
            className="nav-link active plan-pill" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px' }}
          >
            Plan
          </button>

          <button 
            type="button"
            className="nav-link" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px' }}
          >
            My Trips
          </button>
        </nav>
        
        <div className="auth-actions">
          <button className="btn-signup">Sign up</button>
          <button className="btn-login">Login</button>
        </div>
      </header>

      <main className="plan-main">
        {/* Title Section */}
        <div className="title-section">
          <span className="ai-label">AI CONCIERGE</span>
          <h1 className="main-title">
            Design your trip, <span className="highlight-italic">one prompt</span><br />at a time.
          </h1>
        </div>

        {/* Categories */}
        <div className="category-pills">
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat);
                if (!prompt.includes(cat.toLowerCase())) {
                   setPrompt(prev => prev ? `${prev} focusing on ${cat.toLowerCase()}` : `A trip exploring ${cat.toLowerCase()}`);
                }
              }}
            >
              <span className="cat-icon">✦</span> {cat}
            </button>
          ))}
        </div>

        {/* AI Prompt Input Card */}
        <div className="prompt-card">
          <div className="prompt-header">
            <span className="sparkle">✦</span> TREVILO AI · ITINERARY BRIEF
          </div>
          <input 
            type="text" 
            className="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A 3-day journey through Rome, exploring history and culture..."
          />
          <div className="prompt-footer">
            <span className="footer-info">🗓 Auto-scheduled · Real opening hours · Walking time</span>
            <button className="optimize-btn" onClick={handleOptimize} disabled={loading || !prompt}>
              {loading ? 'Optimizing...' : 'Optimize route →'}
            </button>
            
          </div>
        </div>

        {/* Dynamic Stats & Split Content only render if 'itinerary' has data */}
        {itinerary && (
          <>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">TRIP DURATION</span>
                  <span className="stat-icon">🕒</span>
                </div>
                <div className="stat-value">
                  <strong>{itinerary.duration}</strong>
                  <span>DAYS</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">LANDMARKS</span>
                  <span className="stat-icon">📍</span>
                </div>
                <div className="stat-value">
                  <strong>{itinerary.landmarks}</strong>
                  <span>STOPS</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">LOCATION</span>
                  <span className="stat-icon">📚</span>
                </div>
                <div className="stat-value text-value">
                  <strong>{itinerary.location}</strong>
                </div>
              </div>

              <button 
                className="save-trip-btn" 
                onClick={saveTrip}
                style={{
                    backgroundColor: '#0D9488',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600'
                }}
                >
                Save Trip 💾
                </button>
            </div>

            <div className="itinerary-split">
                
              {/* Left: Timeline */}
              <div className="timeline-section">
                {itinerary.days.map((dayData, idx) => (
                  <div key={idx} className="day-card">
                    <div className="day-header">
                      <div className="day-number">{dayData.day}</div>
                      <div className="day-info">
                        <h3>Day {dayData.day}</h3>
                        <span>{dayData.stops} STOPS</span>
                      </div>
                    </div>
                    
                    <div className="timeline-track">
                      {dayData.events.map((evt, eIdx) => (
                        <div key={eIdx} className="timeline-item">
                          <div className="time-marker">
                            <span className="time">{evt.time}</span>
                            <div className="dot"></div>
                          </div>
                          <div className="event-content">
                            <img src={evt.img} alt={evt.title} className="event-img" />
                            <div className="event-details">
                              <div className="event-title-row">
                                <h4>{evt.title}</h4>
                                {evt.tag && <span className="event-tag">{evt.tag}</span>}
                              </div>
                              <p>ⓘ {evt.desc}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Actual Leaflet Map Integration */}
              <div className="map-section">
                <div className="map-container-wrapper" style={{ height: '700px', width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}}>
                  <MapContainer 
                    center={getAllCoordinates()[0] || [0, 0]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <MapController coordinates={getAllCoordinates()} />
                    <TileLayer 
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                      attribution='&copy; <a href="https://carto.com/">Carto</a>'
                    />
                    
                    {/* Render Markers */}
                    {itinerary.days.map((dayData) => 
                      dayData.events.map((evt, i) => (
                        evt.lat && evt.lng && (
                          <Marker key={`marker-${dayData.day}-${i}`} position={[evt.lat, evt.lng]}>
                            <Popup>
                              <strong>{evt.title}</strong><br/>
                              Day {dayData.day} at {evt.time}
                            </Popup>
                          </Marker>
                        )
                      ))
                    )}
                    
                    {/* Render OSRM Street Routes */}
                    {Object.entries(streetRoutes).map(([dayKey, routeCoords], index) => {
                      const routeColor = index === 0 ? "#E46643" : index === 1 ? "#166534" : "#111111";
                      return (
                        <Polyline 
                          key={`route-${dayKey}`} 
                          positions={routeCoords} 
                          color={routeColor} 
                          weight={5} 
                          opacity={0.8} 
                        />
                      );
                    })}
                  </MapContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
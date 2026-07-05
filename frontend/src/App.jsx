import React, { useState, useRef } from 'react';
import MyTrips from './MyTrips';
import AuthModal from './AuthModal';
import './App.css'; 
import Plan from './Plan'; // 👈 FIXED: Added the import for your Plan page

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const DESTINATIONS = [
  { id: 1, tag: 'COASTAL', rating: '★ 4.8', name: 'Santorini', country: 'Greece', price: '$1,290', bg: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=600&q=80' },
  { id: 2, tag: 'CULTURE', rating: '★ 4.9', name: 'Kyoto', country: 'Japan', price: '$1,840', bg: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80' },
  { id: 3, tag: 'HERITAGE', rating: '★ 4.7', name: 'Marrakech', country: 'Morocco', price: '$970', bg: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80' },
  { id: 4, tag: 'NATURE', rating: '★ 4.9', name: 'Patagonia', country: 'Chile', price: '$2,300', bg: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=600&q=80' },
  { id: 5, tag: 'ALPINE', rating: '★ 4.8', name: 'Zermatt', country: 'Switzerland', price: '$2,150', bg: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
  { id: 6, tag: 'URBAN', rating: '★ 4.6', name: 'New York', country: 'USA', price: '$1,600', bg: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80' }
];

function App() {
    const [showAuth, setShowAuth] = useState(false);
    const [authMode, setAuthMode] = useState(null);
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [currentPage, setCurrentPage] = useState('home'); // 👈 FIXED: Added the missing state to track the page
  const [activeTab, setActiveTab] = useState('Hotel');
  const [formData, setFormData] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    travelers: ''
  });

  const [loading, setLoading] = useState(false);
  const carouselRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/itinerary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab.toLowerCase(),
          prompt_text: formData.destination,
          start_date: formData.checkIn,
          end_date: formData.checkOut,
          group_size: parseInt(formData.travelers) || 1
        })
      });

      const data = await response.json();
      console.log("AI Backend Response:", data);
    } catch (error) {
      console.error("Failed contacting routing engine:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 344; 
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

//   if (currentPage === 'plan') {
//     return <Plan onNavigateHome={() => setCurrentPage('home')} />;
//   }

  // Update your page switcher to pass the initialPrompt
  if (currentPage === 'plan') {
    return <Plan onNavigateHome={() => setCurrentPage('home')} initialPrompt={globalPrompt} />;
  }
  
  if (currentPage === 'my-trips') {
    return <MyTrips onNavigateHome={() => setCurrentPage('home')} />;
  }

  return (
    <div className="app-container">
      {/* Header */}
      {/* Header for App.jsx */}
      <header className="site-header">
        <div className="logo-container" onClick={() => setCurrentPage('home')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">V</div>
          <span className="logo-text">Voyadix</span>
        </div>
        
        <nav className="nav-menu">
          <button 
            type="button"
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`} 
            onClick={() => setCurrentPage('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px' }}
          >
            Home
          </button>
          
          <button 
            type="button"
            className={`nav-link ${currentPage === 'plan' ? 'active plan-pill' : ''}`} 
            onClick={() => setCurrentPage('plan')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px' }}
          >
            Plan
          </button>

          {/* FIXED: Added the onClick handler to switch to My Trips */}
          <button 
            type="button"
            className={`nav-link ${currentPage === 'my-trips' ? 'active' : ''}`} 
            onClick={() => setCurrentPage('my-trips')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px' }}
          >
            My Trips
          </button>
        </nav>
        
       <div className="auth-actions">
        <button className="btn-signup" onClick={() => setAuthMode('signup')}>Sign up</button>
        <button className="btn-login" onClick={() => setAuthMode('login')}>Login</button>
       </div>
      </header>

      {/* Hero Platform */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="pill-badge">✦ PONTON TREVILO ✦</span>
          <h1 className="hero-title">
            Discover the magic in <em>every</em><br />destination with us.
          </h1>
          <p className="hero-subtitle">
            Enjoy exclusive offers and best prices on satisfying travel packages,<br />
            orchestrated by an AI that understands how you move.
          </p>

          {/* <div className="search-container">
            <div className="tabs-row">
              {['Hotel', 'Flight', 'Car', 'Event'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'Hotel' && '🏨'}
                  {tab === 'Flight' && '✈️'}
                  {tab === 'Car' && '🚗'}
                  {tab === 'Event' && '🎫'} {tab}
                </button>
              ))}
            </div>

            <form className="search-bar" onSubmit={handleSearchSubmit}>
              <div className="input-group">
                <label>DESTINATION</label>
                <input
                  type="text"
                  name="destination"
                  placeholder="City or destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="ui-divider" />
              <div className="input-group">
                <label>CHECK-IN</label>
                <input
                  type="date"
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleInputChange}
                />
              </div>
              <div className="ui-divider" />
              <div className="input-group">
                <label>CHECK-OUT</label>
                <input
                  type="date"
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleInputChange}
                />
              </div>
              <div className="ui-divider" />
              <div className="input-group">
                <label>TRAVELERS</label>
                <input
                  type="number"
                  name="travelers"
                  placeholder="Add guests"
                  value={formData.travelers}
                  onChange={handleInputChange}
                />
              </div>
              <button type="submit" className="search-submit-btn" disabled={loading}>
                {loading ? 'Planning...' : 'Search'}
              </button>
            </form>
          </div> */}

          {/* Update your AI prompt wrapper with this code */}
            <div className="ai-prompt-wrapper">
            <span className="sparkle-icon">✨</span>
            <input 
                type="text" 
                className="ai-prompt-input" 
                placeholder="Tell Voyadix your dream trip (e.g., '4 days in Bali for a relaxing beach vibe')"
                value={globalPrompt}
                onChange={(e) => setGlobalPrompt(e.target.value)}
                onKeyDown={(e) => {
                if (e.key === 'Enter' && globalPrompt.trim() !== '') {
                    setCurrentPage('plan');
                }
                }}
            />
            <button 
                className="ai-plan-btn" 
                onClick={() => setCurrentPage('plan')}
            >
                Generate Itinerary
            </button>
            </div>
        </div>
      </section>

      {/* Stats Dashboard */}
      <section className="metrics-section">
        <div className="metric-block">
          <h2>184</h2>
          <p>COUNTRIES COVERED</p>
        </div>
        <div className="metric-block">
          <h2>4.9★</h2>
          <p>AVG. TRIP RATING</p>
        </div>
        <div className="metric-block">
          <h2>62k</h2>
          <p>ITINERARIES BUILT</p>
        </div>
        <div className="metric-block">
          <h2>24/7</h2>
          <p>CONCIERGE ON CALL</p>
        </div>
      </section>

      {/* Carousel */}
      <section className="carousel-section">
        <div className="carousel-header">
          <h2>Places worth packing for.</h2>
          <div className="carousel-controls">
            <button type="button" onClick={() => scrollCarousel('left')}>←</button>
            <button type="button" onClick={() => scrollCarousel('right')}>→</button>
          </div>
        </div>

        <div className="carousel-track" ref={carouselRef}>
          {DESTINATIONS.map((dest) => (
            <div key={dest.id} className="dest-card" style={{ backgroundImage: `url(${dest.bg})` }}>
              <div className="card-top-bar">
                <span className="card-tag">{dest.tag}</span>
                <span className="card-rating">{dest.rating}</span>
              </div>
              <div className="card-bottom-bar">
                <div>
                  <span className="country-label">{dest.country}</span>
                  <h3>{dest.name}</h3>
                  <p className="price-label">5 ROUTES FROM <br /><strong>{dest.price}</strong></p>
                </div>
                <button type="button" className="arrow-go-btn">↗</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {authMode && (
        <AuthModal 
            initialMode={authMode}
            onClose={() => setAuthMode(null)} 
            onLoginSuccess={() => {
            setAuthMode(null);
            alert("Successfully logged in!");
            }} 
        />
        )}
    </div>

    
  );
}

export default App;
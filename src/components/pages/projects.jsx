import React, { useEffect, useRef, useState } from 'react';

const HackathonMap = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [selectedView, setSelectedView] = useState('us');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState(null);

  // Real events based on your hackathon journey!
  const events = [
    // Texas Events
    { 
      id: 1, 
      name: 'HackUTD', 
      lat: 32.9857, 
      lng: -96.7500, 
      city: 'Richardson, TX', 
      type: 'competed', 
      year: 2023, 
      date: 'November 2023',
      description: 'Competed at UTD and built an awesome project!',
      details: 'This was an incredible 24-hour hackathon where I worked with a team to create an innovative solution. The energy was amazing and we learned so much.',
      team: '4 people',
      project: 'Built a project using React and Firebase'
    },
    { 
      id: 2, 
      name: 'HackUTD', 
      lat: 32.9857, 
      lng: -96.7500, 
      city: 'Richardson, TX', 
      type: 'organized', 
      year: 2024, 
      date: 'November 2024',
      description: 'Organized the next year - full circle moment!',
      details: 'Came back as an organizer to help make this event happen for hundreds of students. It was rewarding to give back to the community that gave me so much.',
      attendees: '500+ hackers',
      role: 'Lead Organizer'
    },
    
    // Your actual events
    { 
      id: 3, 
      name: 'Hackcon', 
      lat: 40.7128, 
      lng: -74.0060, 
      city: 'New York, NY', 
      type: 'conference', 
      year: 2024, 
      date: 'August 2024',
      description: 'MLH Conference in NYC - amazing organizer experience',
      details: 'Hackcon is MLH\'s annual conference for hackathon organizers. I learned best practices, networked with organizers from around the world, and attended workshops on event planning.',
      workshops: 'Attended 12+ workshops',
      networking: 'Connected with 50+ organizers'
    },
    { 
      id: 4, 
      name: 'WHACK', 
      lat: 42.3736, 
      lng: -72.5199, 
      city: 'Wellesley, MA', 
      type: 'competed', 
      year: 2024,
      date: 'March 2024',
      description: 'Competed at Wellesley College',
      details: 'WHACK at Wellesley College was an amazing all-gender hackathon focused on empowerment and innovation. Great community and inspiring projects.',
      project: 'Built an accessibility-focused web app',
      achievement: 'Top 10 finalist'
    },
    { 
      id: 5, 
      name: '&Hacks', 
      lat: 38.0293, 
      lng: -78.4767, 
      city: 'Charlottesville, VA', 
      type: 'organized', 
      year: 2024,
      date: 'April 2024',
      description: 'Helped organize this event in Virginia',
      details: 'Worked as part of the organizing team at UVA to create an inclusive and exciting hackathon experience. Coordinated logistics and mentored participants.',
      role: 'Logistics Coordinator',
      impact: 'Helped 300+ students'
    },
    { 
      id: 6, 
      name: 'Hack the North', 
      lat: 43.4723, 
      lng: -80.5449, 
      city: 'Waterloo, ON', 
      type: 'competed', 
      year: 2024,
      date: 'September 2024',
      description: 'Competed at Canada\'s biggest hackathon - University of Waterloo',
      details: 'Hack the North is Canada\'s largest hackathon with 1000+ hackers. The scale and quality of this event was incredible. Amazing sponsors, workshops, and the iconic Canadian hospitality!',
      size: '1000+ participants',
      project: 'Built an AI-powered tool',
      memorable: 'First international hackathon!'
    },
    { 
      id: 7, 
      name: 'SteelHacks', 
      lat: 40.4406, 
      lng: -79.9959, 
      city: 'Pittsburgh, PA', 
      type: 'organized', 
      year: 2024,
      date: 'February 2024',
      description: 'Helped organize at University of Pittsburgh',
      details: 'Contributed to organizing SteelHacks at Pitt. Helped with sponsor coordination and creating a welcoming environment for first-time hackers.',
      role: 'Sponsor Relations',
      firstTimers: '40% first-time hackers'
    },
  ];

  // Home base (Richardson, TX)
  const homeBase = { 
    lat: 32.9483, 
    lng: -96.7299,
    name: 'Home Base',
    city: 'Richardson, Texas',
    description: 'Where it all started',
    details: 'Based in the heart of the DFW tech scene, I\'ve been passionate about hackathons and building communities of developers.',
    role: 'MLH Coach & Hackathon Enthusiast'
  };

  // Color scheme for different event types
  const eventColors = {
    competed: '#3B82F6',      // Blue
    organized: '#10B981',     // Green
    coached: '#F59E0B',       // Amber/Orange
    conference: '#EC4899',    // Pink
    travel: '#8B5CF6'         // Purple
  };

  // Function to create curved arc between two points (flight path effect)
  const createArc = (start, end) => {
    const points = [];
    const steps = 100;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lng = start[0] + (end[0] - start[0]) * t;
      const lat = start[1] + (end[1] - start[1]) * t;
      const distance = Math.sqrt(
        Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
      );
      const arcHeight = distance * 0.25 * Math.sin(t * Math.PI);
      points.push([lng, lat + arcHeight]);
    }
    return points;
  };

  useEffect(() => {
    if (window.mapboxgl) {
      initializeMap();
      return;
    }

    const link = document.createElement('link');
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.async = true;
    
    script.onload = () => {
      initializeMap();
    };

    script.onerror = () => {
      setError('Failed to load Mapbox. Please check your internet connection.');
    };

    document.head.appendChild(script);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  const initializeMap = () => {
    try {
      const mapboxgl = window.mapboxgl;
      mapboxgl.accessToken = 'pk.eyJ1IjoiYXlyb2NvZGVzIiwiYSI6ImNtZ2s2ZjI0YTB0MWYyc3BxZTVsdmxmOGQifQ.SXyZnk3ND10QYNtl_Wa7qg';
      
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-95.7129, 37.0902],
        zoom: 4,
        pitch: 45,
      });

      mapRef.current = map;

      map.on('load', () => {
        // Add markers for each event with click handlers
        events.forEach(event => {
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.backgroundColor = eventColors[event.type];
          el.style.width = '20px';
          el.style.height = '20px';
          el.style.borderRadius = '50%';
          el.style.border = '3px solid white';
          el.style.cursor = 'pointer';
          el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
          el.style.transition = 'transform 0.2s';
          
          el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.4)';
          });
          
          el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
          });

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedEvent(event);
          });

          new mapboxgl.Marker(el)
            .setLngLat([event.lng, event.lat])
            .addTo(map);
        });

        // Add curved flight paths
        const routes = events.map(event => {
          return {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: createArc([homeBase.lng, homeBase.lat], [event.lng, event.lat])
            },
            properties: {
              color: eventColors[event.type]
            }
          };
        });

        map.addSource('routes', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: routes
          }
        });

        map.addLayer({
          id: 'route-layer',
          type: 'line',
          source: 'routes',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2.5,
            'line-opacity': 0.7
          }
        });

        // Add home base marker
        const homeEl = document.createElement('div');
        homeEl.style.backgroundColor = '#EF4444';
        homeEl.style.width = '24px';
        homeEl.style.height = '24px';
        homeEl.style.borderRadius = '50%';
        homeEl.style.border = '4px solid white';
        homeEl.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.8)';
        homeEl.style.animation = 'pulse 2s infinite';
        homeEl.style.cursor = 'pointer';

        homeEl.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedEvent(homeBase);
        });

        new mapboxgl.Marker(homeEl)
          .setLngLat([homeBase.lng, homeBase.lat])
          .addTo(map);
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map: ' + err.message);
    }
  };

  const zoomToTexas = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [-99.9018, 31.9686],
        zoom: 6,
        pitch: 50,
        duration: 2000
      });
      setSelectedView('texas');
    }
  };

  const zoomToUS = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [-95.7129, 37.0902],
        zoom: 4,
        pitch: 45,
        duration: 2000
      });
      setSelectedView('us');
    }
  };

  const zoomToNorthAmerica = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [-95.7129, 42.0902],
        zoom: 3.2,
        pitch: 35,
        duration: 2500
      });
      setSelectedView('na');
    }
  };

  const eventCounts = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        minHeight: '600px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: 'white',
        fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '40px' }}>
          <h2 style={{ color: '#EF4444', marginBottom: '16px' }}>⚠️ Map Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const containerStyle = isFullscreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#1a1a1a'
  } : {
    width: '100%',
    height: '700px',
    position: 'relative',
    backgroundColor: '#1a1a1a',
    borderRadius: '20px',
    overflow: 'hidden',
    margin: '20px 0',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
  };

  return (
    <div style={containerStyle}>
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Fullscreen Toggle */}
      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          padding: '12px 16px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 10,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s',
          fontFamily: 'system-ui'
        }}
      >
        {isFullscreen ? '✕ Exit Fullscreen' : '⛶ Fullscreen'}
      </button>

      {/* Control Panel */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: '20px',
        borderRadius: '16px',
        color: 'white',
        fontFamily: 'system-ui',
        backdropFilter: 'blur(10px)',
        maxWidth: '280px',
        maxHeight: isFullscreen ? 'calc(100vh - 100px)' : '600px',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '800' }}>
          My Journey
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#888' }}>
          MLH Coach • Competitor
        </p>
        
        {/* View Controls */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '700', color: '#666', textTransform: 'uppercase' }}>
            View
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button onClick={zoomToTexas} style={{
              padding: '10px 12px',
              backgroundColor: selectedView === 'texas' ? '#3B82F6' : '#2a2a2a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'left'
            }}>
              🤠 Texas
            </button>
            <button onClick={zoomToUS} style={{
              padding: '10px 12px',
              backgroundColor: selectedView === 'us' ? '#3B82F6' : '#2a2a2a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'left'
            }}>
              🇺🇸 US
            </button>
            <button onClick={zoomToNorthAmerica} style={{
              padding: '10px 12px',
              backgroundColor: selectedView === 'na' ? '#3B82F6' : '#2a2a2a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'left'
            }}>
              🌎 US + Canada
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '700', color: '#666', textTransform: 'uppercase' }}>
            Types
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(eventColors).map(([type, color]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: '2px solid white',
                    flexShrink: 0
                  }} />
                  <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>
                    {type}
                  </span>
                </div>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#666',
                  backgroundColor: '#2a2a2a',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {eventCounts[type] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          padding: '14px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{ fontSize: '11px', color: '#60A5FA', marginBottom: '4px', fontWeight: '600' }}>
            TOTAL EVENTS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#3B82F6' }}>
            {events.length}
          </div>
        </div>
      </div>

      {/* Event Details Panel */}
      {selectedEvent && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          padding: '24px',
          borderRadius: '16px',
          color: 'white',
          fontFamily: 'system-ui',
          backdropFilter: 'blur(10px)',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
          border: '2px solid ' + (eventColors[selectedEvent.type] || '#EF4444'),
          animation: 'slideUp 0.3s ease-out'
        }}>
          <style>{`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: '800',
              color: eventColors[selectedEvent.type] || '#EF4444'
            }}>
              {selectedEvent.name}
            </h3>
            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#888',
                fontSize: '24px',
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#999' }}>
            📍 {selectedEvent.city}
          </p>
          
          {selectedEvent.date && (
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#999' }}>
              📅 {selectedEvent.date}
            </p>
          )}
          
          {selectedEvent.type && (
            <div style={{
              display: 'inline-block',
              padding: '6px 12px',
              backgroundColor: eventColors[selectedEvent.type] + '20',
              border: '1px solid ' + eventColors[selectedEvent.type],
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '16px',
              textTransform: 'capitalize'
            }}>
              {selectedEvent.type}
            </div>
          )}
          
          <p style={{ margin: '0 0 16px 0', fontSize: '15px', lineHeight: '1.6', color: '#ccc' }}>
            {selectedEvent.details || selectedEvent.description}
          </p>
          
          {/* Additional details */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
            {selectedEvent.team && (
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#888' }}>
                <strong style={{ color: '#fff' }}>Team:</strong> {selectedEvent.team}
              </p>
            )}
            {selectedEvent.project && (
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#888' }}>
                <strong style={{ color: '#fff' }}>Project:</strong> {selectedEvent.project}
              </p>
            )}
            {selectedEvent.role && (
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#888' }}>
                <strong style={{ color: '#fff' }}>Role:</strong> {selectedEvent.role}
              </p>
            )}
            {selectedEvent.achievement && (
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#888' }}>
                <strong style={{ color: '#fff' }}>Achievement:</strong> {selectedEvent.achievement}
              </p>
            )}
            {selectedEvent.attendees && (
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#888' }}>
                <strong style={{ color: '#fff' }}>Attendees:</strong> {selectedEvent.attendees}
              </p>
            )}
            {selectedEvent.size && (
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#888' }}>
                <strong style={{ color: '#fff' }}>Size:</strong> {selectedEvent.size}
              </p>
            )}
            {selectedEvent.memorable && (
              <p style={{ margin: '0', fontSize: '13px', color: '#888' }}>
                <strong style={{ color: '#fff' }}>Memorable:</strong> {selectedEvent.memorable}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HackathonMap;
import React, { useState, useEffect } from 'react'
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useHackathons, useAllTestimonials } from '../../hooks/useFirestore'

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState('hackathons')

  // Data hooks
  const { data: hackathons, loading: hackathonsLoading } = useHackathons()
  const { data: testimonials, loading: testimonialsLoading } = useAllTestimonials()

  // Hackathon form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'competed',
    date: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)

  const eventTypes = [
    { value: 'competed', label: 'Competed', color: '#3B82F6' },
    { value: 'organized', label: 'Organized', color: '#10B981' },
    { value: 'coached', label: 'Coached', color: '#F59E0B' },
    { value: 'conference', label: 'Conference', color: '#EC4899' }
  ]

  // Check if already authenticated
  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    // Simple client-side check - sufficient for personal portfolio admin
    // Real security would require Firebase Auth
    if (password === '#4isLucky') {
      setIsAuthenticated(true)
      sessionStorage.setItem('adminAuth', 'true')
      setAuthError('')
    } else {
      setAuthError('Incorrect password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('adminAuth')
  }

  // Geocode location using Mapbox
  const geocodeLocation = async (location) => {
    const token = import.meta.env.MAPBOX_TOKEN
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${token}&limit=1`
    const response = await fetch(url)
    const data = await response.json()
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center
      return { lat, lng, city: data.features[0].place_name }
    }
    throw new Error('Location not found')
  }

  // Hackathon handlers
  const handleHackathonSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    try {
      const { lat, lng, city } = await geocodeLocation(formData.location)
      const hackathonData = { name: formData.name, city, lat, lng, type: formData.type, date: formData.date }

      if (editingId) {
        await updateDoc(doc(db, 'hackathons', editingId), hackathonData)
        setMessage('Hackathon updated!')
        setEditingId(null)
      } else {
        await addDoc(collection(db, 'hackathons'), hackathonData)
        setMessage('Hackathon added!')
      }
      setFormData({ name: '', location: '', type: 'competed', date: '' })
    } catch (error) {
      setMessage('Error: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleHackathonEdit = (hackathon) => {
    setFormData({ name: hackathon.name, location: hackathon.city, type: hackathon.type, date: hackathon.date })
    setEditingId(hackathon.id)
  }

  const handleHackathonDelete = async (id) => {
    if (window.confirm('Delete this hackathon?')) {
      await deleteDoc(doc(db, 'hackathons', id))
      setMessage('Hackathon deleted!')
    }
  }

  // Testimonial handlers
  const handleTestimonialApprove = async (id, currentStatus) => {
    await updateDoc(doc(db, 'testimonials', id), { approved: !currentStatus })
  }

  const handleTestimonialDelete = async (id) => {
    if (window.confirm('Delete this testimonial?')) {
      await deleteDoc(doc(db, 'testimonials', id))
    }
  }

  // Styles
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: 'white',
    fontSize: '16px'
  }

  const cardStyle = {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '16px 20px',
    border: '1px solid #333'
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <div style={{ ...cardStyle, padding: '40px', width: '100%', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', textAlign: 'center' }}>Admin Access</h1>
          <p style={{ color: '#666', marginBottom: '24px', textAlign: 'center' }}>Enter password to continue</p>
          <form onSubmit={handleLogin}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ ...inputStyle, marginBottom: '16px' }} />
            {authError && <p style={{ color: '#EF4444', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{authError}</p>}
            <button type="submit" style={{ width: '100%', padding: '12px 24px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>Login</button>
          </form>
        </div>
      </div>
    )
  }

  const pendingCount = testimonials?.filter(t => !t.approved).length || 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700' }}>Admin Dashboard</h1>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>Logout</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid #333', paddingBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('hackathons')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'hackathons' ? '#3B82F6' : 'transparent',
              color: activeTab === 'hackathons' ? 'white' : '#888',
              border: activeTab === 'hackathons' ? 'none' : '1px solid #333',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Hackathons ({hackathons?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('testimonials')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'testimonials' ? '#3B82F6' : 'transparent',
              color: activeTab === 'testimonials' ? 'white' : '#888',
              border: activeTab === 'testimonials' ? 'none' : '1px solid #333',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            Testimonials ({testimonials?.length || 0})
            {pendingCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#EF4444',
                color: 'white',
                fontSize: '12px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '10px'
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Hackathons Tab */}
        {activeTab === 'hackathons' && (
          <>
            {/* Add Form */}
            <div style={{ ...cardStyle, padding: '24px', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                {editingId ? 'Edit Hackathon' : 'Add New Hackathon'}
              </h2>
              <form onSubmit={handleHackathonSubmit}>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#888', marginBottom: '6px' }}>Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. HackUTD" required style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#888', marginBottom: '6px' }}>Location</label>
                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Richardson, TX" required style={inputStyle} />
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Coordinates found automatically</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: '#888', marginBottom: '6px' }}>Type</label>
                      <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={inputStyle}>
                        {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: '#888', marginBottom: '6px' }}>Date</label>
                      <input type="text" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} placeholder="e.g. November 2024" required style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" disabled={isSubmitting} style={{ padding: '12px 24px', backgroundColor: isSubmitting ? '#333' : '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                      {isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Add')}
                    </button>
                    {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', location: '', type: 'competed', date: '' }) }} style={{ padding: '12px 24px', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>}
                  </div>
                </div>
              </form>
              {message && <p style={{ marginTop: '16px', padding: '12px', backgroundColor: message.includes('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${message.includes('Error') ? '#EF4444' : '#10B981'}`, borderRadius: '8px', color: message.includes('Error') ? '#EF4444' : '#10B981' }}>{message}</p>}
            </div>

            {/* Hackathons List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {hackathonsLoading ? <p style={{ color: '#666' }}>Loading...</p> : hackathons?.map(h => (
                <div key={h.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: eventTypes.find(t => t.value === h.type)?.color || '#666' }} />
                    <div>
                      <div style={{ fontWeight: '600' }}>{h.name}</div>
                      <div style={{ fontSize: '14px', color: '#888' }}>{h.city} • {h.date}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleHackathonEdit(h)} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#3B82F6', border: '1px solid #3B82F6', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleHackathonDelete(h.id)} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Testimonials Tab */}
        {activeTab === 'testimonials' && (
          <>
            <p style={{ color: '#888', marginBottom: '24px' }}>
              Approve or reject testimonials submitted via /review. Approved testimonials appear on your site.
            </p>

            {testimonialsLoading ? (
              <p style={{ color: '#666' }}>Loading...</p>
            ) : testimonials?.length === 0 ? (
              <p style={{ color: '#666' }}>No testimonials yet. Share your /review link to collect feedback!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {testimonials?.map(t => (
                  <div key={t.id} style={{ ...cardStyle, padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '16px' }}>{t.name}</div>
                        <div style={{ fontSize: '14px', color: '#888' }}>{t.role}</div>
                      </div>
                      <div style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: t.approved ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: t.approved ? '#10B981' : '#F59E0B',
                        border: `1px solid ${t.approved ? '#10B981' : '#F59E0B'}`
                      }}>
                        {t.approved ? 'Approved' : 'Pending'}
                      </div>
                    </div>

                    <p style={{ color: '#ccc', lineHeight: '1.6', marginBottom: '16px', fontSize: '15px' }}>
                      "{t.message}"
                    </p>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleTestimonialApprove(t.id, t.approved)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: t.approved ? 'transparent' : '#10B981',
                          color: t.approved ? '#F59E0B' : 'white',
                          border: t.approved ? '1px solid #F59E0B' : 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        {t.approved ? 'Unapprove' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleTestimonialDelete(t.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'transparent',
                          color: '#EF4444',
                          border: '1px solid #EF4444',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Admin

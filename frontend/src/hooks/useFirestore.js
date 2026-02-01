// Firestore hooks for fetching data
// These hooks use real-time listeners for instant updates

import { useState, useEffect } from 'react'
import { collection, query, orderBy, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

// Generic hook with real-time listener
export function useCollection(collectionName, options = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let q = collection(db, collectionName)

    // Build query with constraints
    const constraints = []

    if (options.where) {
      constraints.push(where(options.where.field, options.where.op, options.where.value))
    }

    if (options.orderBy) {
      constraints.push(orderBy(options.orderBy, options.orderDirection || 'asc'))
    }

    if (constraints.length > 0) {
      q = query(q, ...constraints)
    }

    // Real-time listener
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setData(results)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error(`Error fetching ${collectionName}:`, err)
        setError(err)
        setLoading(false)
      }
    )

    // Cleanup listener on unmount
    return () => unsubscribe()
  }, [collectionName, options.orderBy, options.orderDirection, options.where?.field, options.where?.value])

  return { data, loading, error }
}

// Hook for fetching projects
export function useProjects() {
  return useCollection('projects', {
    orderBy: 'order',
    orderDirection: 'asc'
  })
}

// Hook for fetching skills
export function useSkills() {
  return useCollection('skills', {
    orderBy: 'category',
    orderDirection: 'asc'
  })
}

// Hook for fetching hackathons (for the map)
export function useHackathons() {
  return useCollection('hackathons', {
    orderBy: 'date',
    orderDirection: 'desc'
  })
}

// Hook for fetching leadership experiences
export function useLeadership() {
  return useCollection('leadership', {
    orderBy: 'order',
    orderDirection: 'asc'
  })
}

// Hook for fetching approved testimonials (public)
export function useTestimonials() {
  return useCollection('testimonials', {
    where: {
      field: 'approved',
      op: '==',
      value: true
    },
    orderBy: 'date',
    orderDirection: 'desc'
  })
}

// Hook for fetching ALL testimonials (admin)
export function useAllTestimonials() {
  return useCollection('testimonials', {
    orderBy: 'date',
    orderDirection: 'desc'
  })
}

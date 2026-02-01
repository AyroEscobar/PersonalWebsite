// Firestore hooks for fetching data
// These hooks will fetch data from your Firebase collections

import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import { db } from '../firebase/config'

// Generic hook to fetch a collection
export function useCollection(collectionName, options = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        let q = collection(db, collectionName)

        // Apply ordering if specified
        if (options.orderBy) {
          q = query(q, orderBy(options.orderBy, options.orderDirection || 'asc'))
        }

        // Apply where clause if specified
        if (options.where) {
          q = query(q, where(options.where.field, options.where.op, options.where.value))
        }

        const querySnapshot = await getDocs(q)
        const results = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        setData(results)
        setError(null)
      } catch (err) {
        console.error(`Error fetching ${collectionName}:`, err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [collectionName, options.orderBy, options.orderDirection])

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

// Hook for fetching approved testimonials
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

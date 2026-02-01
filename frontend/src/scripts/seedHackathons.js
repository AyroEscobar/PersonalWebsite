// Run this script once to populate your hackathons collection
// Usage: Open your app in browser, open console, and run: seedHackathons()

import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const hackathons = [
  {
    name: 'HackUTD',
    city: 'Richardson, TX',
    lat: 32.9857,
    lng: -96.7500,
    type: 'competed',
    date: 'November 2023'
  },
  {
    name: 'HackUTD',
    city: 'Richardson, TX',
    lat: 32.9857,
    lng: -96.7500,
    type: 'organized',
    date: 'November 2024'
  },
  {
    name: 'Hackcon',
    city: 'New York, NY',
    lat: 40.7128,
    lng: -74.0060,
    type: 'conference',
    date: 'August 2024'
  },
  {
    name: 'WHACK',
    city: 'Wellesley, MA',
    lat: 42.3736,
    lng: -72.5199,
    type: 'competed',
    date: 'March 2024'
  },
  {
    name: '&Hacks',
    city: 'Charlottesville, VA',
    lat: 38.0293,
    lng: -78.4767,
    type: 'organized',
    date: 'April 2024'
  },
  {
    name: 'Hack the North',
    city: 'Waterloo, ON',
    lat: 43.4723,
    lng: -80.5449,
    type: 'competed',
    date: 'September 2024'
  },
  {
    name: 'SteelHacks',
    city: 'Pittsburgh, PA',
    lat: 40.4406,
    lng: -79.9959,
    type: 'organized',
    date: 'February 2024'
  }
]

export async function seedHackathons() {
  console.log('Starting to seed hackathons...')

  const hackathonsRef = collection(db, 'hackathons')

  for (const hackathon of hackathons) {
    try {
      const docRef = await addDoc(hackathonsRef, hackathon)
      console.log(`Added: ${hackathon.name} (${hackathon.date}) - ID: ${docRef.id}`)
    } catch (error) {
      console.error(`Failed to add ${hackathon.name}:`, error)
    }
  }

  console.log('Done seeding hackathons!')
}

// Make it available globally for easy console access
if (typeof window !== 'undefined') {
  window.seedHackathons = seedHackathons
}

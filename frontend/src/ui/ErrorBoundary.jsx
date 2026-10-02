import { Component } from 'react'

/*
  Contains a failing island (a WebGL context, a lazy chunk that failed to
  load) so the rest of the page keeps working. Renders `fallback` instead.
*/
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    this.props.onError?.(error)
    if (import.meta.env.DEV) console.warn('[ErrorBoundary]', error)
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}

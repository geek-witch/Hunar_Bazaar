import React from 'react'

interface State { hasError: boolean }

export default class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-brand-light-blue min-h-screen flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <h3 className="text-lg font-semibold text-red-600">Something went wrong</h3>
            <p className="mt-2 text-gray-600">An unexpected error occurred while rendering this page.</p>
          </div>
        </div>
      )
    }

    // @ts-ignore allow children
    return this.props.children
  }
}

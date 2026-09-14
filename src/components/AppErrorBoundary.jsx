import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    try {
      console.error('TORNADO-UI-001', error instanceof Error ? error.name : 'RenderError')
    } catch {
      // Recovery UI must remain usable even if diagnostics fail.
    }
  }

  reload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <main className="content" role="alert">
        <section className="panel">
          <p className="eyebrow">TORNADO RECOVERY</p>
          <h1>Tornado hit an unexpected display error.</h1>
          <p>Your saved launcher data has not been deleted. Reload Tornado to retry startup.</p>
          <p className="field-help">Error: TORNADO-UI-001</p>
          <button onClick={this.reload}>Reload Tornado</button>
        </section>
      </main>
    )
  }
}

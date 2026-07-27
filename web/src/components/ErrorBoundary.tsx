import React from 'react'
import useStrings from 'hooks/useStrings'

type FallbackProps = {
    error: Error
    onBack: () => void
}

const ErrorFallback: React.FC<FallbackProps> = ({ error, onBack }) => {
    const { t } = useStrings()
    const c = t.crash

    const details = `${error.name}: ${error.message}\n${error.stack ?? ''}`.trim()

    return (
        <div className="module module-crash">
            <tc-section-card title={c.title} icon="TriangleAlert" variant="danger">
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{c.body}</tc-text>

                    <details className="module-crash__details">
                        <summary>{c.detailsLabel}</summary>
                        <pre className="module-crash__stack">{details}</pre>
                    </details>

                    <div className="module-crash__actions">
                        <tc-button variant="primary" onClick={() => window.location.reload()}>
                            {c.reload}
                        </tc-button>
                        <tc-button variant="secondary" outline onClick={onBack}>
                            {c.back}
                        </tc-button>
                    </div>
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

type Props = {
    children: React.ReactNode

    resetKey: string

    onBack: () => void
}

type State = {
    error: Error | null
}

class ErrorBoundary extends React.Component<Props, State> {
    state: State = { error: null }

    static getDerivedStateFromError(error: Error): State {
        return { error }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        console.error('render error', error, info.componentStack)
    }

    componentDidUpdate(previous: Props): void {
        if (this.state.error && previous.resetKey !== this.props.resetKey) {
            this.setState({ error: null })
        }
    }

    render(): React.ReactNode {
        if (this.state.error) {
            return <ErrorFallback error={this.state.error} onBack={this.props.onBack} />
        }
        return this.props.children
    }
}

export default ErrorBoundary

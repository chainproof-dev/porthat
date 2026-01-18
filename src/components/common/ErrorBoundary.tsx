import { Component, type ReactNode, type ErrorInfo } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface ErrorBoundaryProps {
    /** Child components to render */
    children: ReactNode;
    /** Custom fallback component */
    fallback?: ReactNode;
    /** Callback when an error is caught */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

// =============================================================================
// ERROR BOUNDARY COMPONENT
// =============================================================================

/**
 * Error Boundary component that catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the whole application.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error for debugging
        console.error("[ErrorBoundary] Caught error:", error, errorInfo);

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <ErrorFallback
                    error={this.state.error}
                    onReset={this.handleReset}
                />
            );
        }

        return this.props.children;
    }
}

// =============================================================================
// DEFAULT FALLBACK UI
// =============================================================================

interface ErrorFallbackProps {
    error: Error | null;
    onReset: () => void;
}

/**
 * Default fallback UI shown when an error is caught.
 * Provides error information and a reset button.
 */
function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
    return (
        <div
            role="alert"
            className="min-h-screen flex items-center justify-center p-6"
            style={{ backgroundColor: "#0a0a0a" }}
        >
            <div
                className="max-w-md w-full rounded-2xl p-8 text-center"
                style={{
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                {/* Error Icon */}
                <div
                    className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
                >
                    <svg
                        className="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="#ef4444"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                {/* Error Message */}
                <h1
                    className="text-xl font-semibold mb-2"
                    style={{ color: "#fafafa" }}
                >
                    Something went wrong
                </h1>
                <p
                    className="text-sm mb-6"
                    style={{ color: "rgba(250,250,250,0.6)" }}
                >
                    An unexpected error occurred. The error has been logged for investigation.
                </p>

                {/* Error Details (Development Only) */}
                {error && import.meta.env.DEV && (
                    <details
                        className="mb-6 text-left"
                        style={{ color: "rgba(250,250,250,0.5)" }}
                    >
                        <summary className="cursor-pointer text-xs mb-2 hover:opacity-80">
                            Error Details
                        </summary>
                        <pre
                            className="text-xs p-3 rounded-lg overflow-auto max-h-32"
                            style={{
                                backgroundColor: "rgba(255,255,255,0.05)",
                                color: "#ef4444",
                            }}
                        >
                            {error.message}
                            {error.stack && `\n\n${error.stack}`}
                        </pre>
                    </details>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={onReset}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                        style={{
                            backgroundColor: "#fafafa",
                            color: "#0a0a0a",
                        }}
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                        style={{
                            backgroundColor: "transparent",
                            color: "#fafafa",
                            border: "1px solid rgba(255,255,255,0.2)",
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        </div>
    );
}

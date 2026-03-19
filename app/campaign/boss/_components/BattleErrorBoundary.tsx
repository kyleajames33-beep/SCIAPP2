"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class BattleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this would report to Sentry/similar
    console.error("[BattleErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-sm">
            <div className="text-6xl">⚗️</div>
            <h1 className="text-2xl font-bold text-white">
              Something went wrong
            </h1>
            <p className="text-gray-400">
              The battle encountered an unexpected error. Your progress has been saved.
            </p>
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs text-red-400 font-mono bg-gray-900 p-3 rounded-lg text-left">
                {this.state.errorMessage}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, errorMessage: "" })}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/campaign"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Return to Campaign
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

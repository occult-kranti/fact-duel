/**
 * shell/error-boundary.tsx — one screen failing never blanks the app: "File missing. Babu is on
 * leave." + Retry (a failed lazy chunk usually means a new deploy; Retry reloads the page).
 */
import { Component, type ReactNode } from 'react';
import { ErrorState, Page } from '../ui/page';

type Props = { children: ReactNode; resetKey: string };
type State = { error: Error | null; key: string };

export class ScreenBoundary extends Component<Props, State> {
  state: State = { error: null, key: this.props.resetKey };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    // A new route gets a fresh chance.
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }
  componentDidCatch(error: Error) {
    console.warn('[hisaab] screen failed:', error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    const chunk = /dynamically imported module|Failed to fetch|Importing a module script failed|ChunkLoadError/i.test(this.state.error.message);
    return (
      <Page screen="error">
        <ErrorState
          detail={chunk ? 'The connection dropped while this file was loading.' : 'Something on this screen broke. Your progress is safe on this device.'}
          onRetry={() => (chunk ? location.reload() : this.setState({ error: null }))}
        />
      </Page>
    );
  }
}

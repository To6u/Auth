import { Component, ReactNode } from 'react';

interface Props {
    /** Что показать вместо упавшего дерева. null = тихо скрыть (для canvas) */
    fallback: ReactNode;
    /** Опциональный label для логов (например 'WavesBackground') */
    name?: string;
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Универсальный Error Boundary.
 *
 * Использование:
 *   // Canvas — тихо скрыть при краше WebGL
 *   <ErrorBoundary fallback={null} name="WavesBackground">
 *     <WavesBackground />
 *   </ErrorBoundary>
 *
 *   // Страница — показать UI с кнопкой перезагрузки
 *   <ErrorBoundary fallback={<PageErrorFallback />} name="ProfilePage">
 *     <ProfilePage />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: { componentStack: string }) {
        const label = this.props.name ?? 'Unknown';
        console.error(`[ErrorBoundary:${label}] ${error.message}`, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

import {
    createContext,
    type ReactNode,
    useContext,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { useLocation } from 'react-router-dom';

type NavDirection = 'forward' | 'backward';

// Иерархия маршрутов: чем выше индекс — тем "глубже"
const ROUTE_ORDER: Record<string, number> = {
    '/': 0,
    '/login': 1,
    '/dashboard': 2,
};

const NavigationDirectionContext = createContext<NavDirection>('forward');

export function NavigationDirectionProvider({ children }: { children: ReactNode }) {
    const location = useLocation();
    const prevPathRef = useRef(location.pathname);
    const [direction, setDirection] = useState<NavDirection>('forward');

    // useLayoutEffect — синхронно до paint, AnimatePresence получает верное направление
    useLayoutEffect(() => {
        const prev = prevPathRef.current;
        const curr = location.pathname;
        if (prev !== curr) {
            const prevIdx = ROUTE_ORDER[prev] ?? 0;
            const currIdx = ROUTE_ORDER[curr] ?? 0;
            setDirection(currIdx >= prevIdx ? 'forward' : 'backward');
            prevPathRef.current = curr;
        }
    }, [location.pathname]);

    return (
        <NavigationDirectionContext.Provider value={direction}>
            {children}
        </NavigationDirectionContext.Provider>
    );
}

export function useNavigationDirection(): NavDirection {
    return useContext(NavigationDirectionContext);
}

import { useEffect, RefObject, useCallback, useRef } from 'react';

interface ScrollAnimationConfig {
    element: RefObject<HTMLElement | null>;
    properties: {
        name: string;
        calculate: (scrollProgress: number) => string | number;
    }[];
    startThreshold?: number;
    endThreshold?: number;
}

export const useScrollAnimation = (configs: ScrollAnimationConfig[]) => {
    const rafRef = useRef<number | null>(null);
    const lastUpdateRef = useRef(0);
    const configsRef = useRef(configs);

    // Обновляем ref при изменении configs
    useEffect(() => {
        configsRef.current = configs;
    }, [configs]);

    useEffect(() => {
        const handleScroll = () => {
            // Отменяем предыдущий RAF
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }

            rafRef.current = requestAnimationFrame(() => {
                const now = performance.now();

                // Throttle до ~60fps (16ms)
                if (now - lastUpdateRef.current < 16) {
                    rafRef.current = null;
                    return;
                }

                lastUpdateRef.current = now;
                const windowHeight = window.innerHeight;

                configsRef.current.forEach(({ element, properties, startThreshold = 0, endThreshold = 1 }) => {
                    const el = element.current;
                    if (!el) return;

                    const rect = el.getBoundingClientRect();

                    // Проверяем видимость
                    if (rect.top < windowHeight && rect.bottom > 0) {
                        const visibleFromBottom = windowHeight - rect.top;
                        const rawProgress = visibleFromBottom / windowHeight;

                        const adjustedProgress = Math.max(
                            0,
                            Math.min(
                                (endThreshold - startThreshold) * 2,
                                (rawProgress - startThreshold) / (endThreshold - startThreshold)
                            )
                        );

                        // Батчим все setProperty в одном вызове
                        properties.forEach(({ name, calculate }) => {
                            const value = calculate(adjustedProgress);
                            el.style.setProperty(name, String(value));
                        });
                    }
                });

                rafRef.current = null;
            });
        };

        handleScroll(); // Initial call
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []); // ✅ Пустые зависимости - используем ref
};

export const useElementVisibility = <T extends HTMLElement = HTMLElement>(
    elementRef: RefObject<T | null>,
    onVisibilityChange: (isVisible: boolean, visibilityProgress: number) => void,
    offset: number = 0
) => {
    const rafRef = useRef<number | null>(null);
    const lastUpdateRef = useRef(0);
    const callbackRef = useRef(onVisibilityChange);

    useEffect(() => {
        callbackRef.current = onVisibilityChange;
    }, [onVisibilityChange]);

    useEffect(() => {
        const handleScroll = () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }

            rafRef.current = requestAnimationFrame(() => {
                const now = performance.now();

                // Throttle до 16ms (60fps)
                if (now - lastUpdateRef.current < 16) {
                    rafRef.current = null;
                    return;
                }

                lastUpdateRef.current = now;

                const element = elementRef.current;
                if (!element) {
                    rafRef.current = null;
                    return;
                }

                const rect = element.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                const isVisible = rect.bottom > offset && rect.top < windowHeight;
                const visibilityProgress = isVisible
                    ? Math.max(0, Math.min(1, (windowHeight - rect.top) / windowHeight))
                    : 0;

                callbackRef.current(isVisible, visibilityProgress);
                rafRef.current = null;
            });
        };

        handleScroll(); // Initial call
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [elementRef, offset]);
};

// Остальные хуки без изменений...
export const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const targetScroll = window.scrollY + rect.top;

    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
};

// Хук для управления модальным окном с анимацией
export const useAnimatedDialog = (dialogRef: RefObject<HTMLDialogElement | null>, animationDuration: number = 300) => {
    const showDialog = useCallback(() => {
        dialogRef.current?.showModal();
    }, [dialogRef]);

    const hideDialog = useCallback(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        dialog.classList.add('closing');
        setTimeout(() => {
            dialog.close();
            dialog.classList.remove('closing');
        }, animationDuration);
    }, [dialogRef, animationDuration]);

    // Обработчик клика по backdrop
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleBackdropClick = (e: MouseEvent) => {
            const rect = dialog.getBoundingClientRect();
            if (
                e.clientX < rect.left ||
                e.clientX > rect.right ||
                e.clientY < rect.top ||
                e.clientY > rect.bottom
            ) {
                hideDialog();
            }
        };

        dialog.addEventListener('click', handleBackdropClick);
        return () => dialog.removeEventListener('click', handleBackdropClick);
    }, [dialogRef, hideDialog]);

    return { showDialog, hideDialog };
};

// Хук для управления кликом вне элемента
export const useClickOutside = <T extends HTMLElement = HTMLElement>(
    elementRef: RefObject<T | null>,
    onClickOutside: () => void,
    enabled: boolean = true,
    excludeSelectors: string[] = []
) => {
    useEffect(() => {
        if (!enabled) return;

        const handleClickOutside = (e: MouseEvent) => {
            const element = elementRef.current;
            if (!element) return;

            const target = e.target as HTMLElement;

            // Проверяем исключения
            if (excludeSelectors.some(selector => target.classList.contains(selector))) {
                return;
            }

            const rect = element.getBoundingClientRect();
            const isOutside =
                e.clientX < rect.left ||
                e.clientX > rect.right ||
                e.clientY < rect.top ||
                e.clientY > rect.bottom;

            if (isOutside) {
                onClickOutside();
            }
        };

        document.addEventListener('click', handleClickOutside, true);
        return () => document.removeEventListener('click', handleClickOutside, true);
    }, [elementRef, onClickOutside, enabled, excludeSelectors]);
};

// Хук для блокировки прокрутки body
export const useBodyScrollLock = (locked: boolean) => {
    useEffect(() => {
        if (locked) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [locked]);
};

// Хук для управления классами с анимацией
export const useAnimatedClass = <T extends HTMLElement = HTMLElement>(
    elementRef: RefObject<T | null>,
    className: string,
    isActive: boolean,
    animationDuration: number = 300
) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        if (isActive) {
            element.classList.add(className);
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), animationDuration);
            return () => clearTimeout(timer);
        } else {
            element.classList.add('hiding');
            setIsAnimating(true);
            const timer = setTimeout(() => {
                element.classList.remove(className, 'hiding');
                setIsAnimating(false);
            }, animationDuration);
            return () => clearTimeout(timer);
        }
    }, [elementRef, className, isActive, animationDuration]);

    return isAnimating;
};

// Хук для отслеживания прогресса скролла страницы (ОПТИМИЗИРОВАННЫЙ)
export const useScrollProgress = (
    startOffset: number = 0,
    endOffset: number = 0.5
) => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const rafRef = useRef<number | null>(null);
    const lastUpdateRef = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            // Отменяем предыдущий RAF если есть
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }

            rafRef.current = requestAnimationFrame(() => {
                const now = Date.now();

                // Throttle до 60fps (16ms)
                if (now - lastUpdateRef.current < 16) {
                    return;
                }

                lastUpdateRef.current = now;

                const scrollY = window.scrollY;
                const windowHeight = window.innerHeight;

                // Вычисляем прогресс от 0 до 1
                const scrollRange = windowHeight * (endOffset - startOffset);
                const progress = Math.max(
                    0,
                    Math.min(1, (scrollY - windowHeight * startOffset) / scrollRange)
                );

                // Обновляем только если изменение значительное (>0.001)
                setScrollProgress(prev => {
                    if (Math.abs(prev - progress) < 0.001) {
                        return prev;
                    }
                    return progress;
                });
            });
        };

        handleScroll(); // вызываем сразу при монтировании
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [startOffset, endOffset]);

    return scrollProgress;
};
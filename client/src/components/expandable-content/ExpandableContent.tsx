import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { Children, isValidElement, memo, useMemo, useState } from 'react';
import './expandable-content.css';
import type { BezierDefinition } from 'motion-utils';

interface ExpandableContentProps {
    children: React.ReactNode;
    className?: string;
}

const ANIMATION_EASE = [0.215, 0.61, 0.355, 1] as BezierDefinition;

export const ExpandableContent = memo(({ children, className = '' }: ExpandableContentProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const { visibleContent, hiddenContent } = useMemo(() => {
        const childArray = Children.toArray(children).filter(isValidElement);

        // Находим первый <p> и все элементы до него (включая <span> перед ним)
        let firstPIndex = childArray.findIndex(
            (child) => typeof child.type === 'string' && child.type === 'p'
        );

        if (firstPIndex === -1) firstPIndex = childArray.length;

        // Включаем первый <p> в видимый контент
        const cutIndex = firstPIndex + 1;

        return {
            visibleContent: childArray.slice(0, cutIndex),
            hiddenContent: childArray.slice(cutIndex),
        };
    }, [children]);

    const hasHiddenContent = hiddenContent.length > 0;

    return (
        <div className={`expandable-content ${className}`}>
            {/* Всегда видимая часть */}
            <div className="expandable-content__visible">{visibleContent}</div>

            {/* Скрываемая часть */}
            <AnimatePresence initial={false}>
                {isExpanded && hasHiddenContent && (
                    <motion.div
                        className="expandable-content__hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: ANIMATION_EASE }}
                    >
                        {hiddenContent}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Кнопка */}
            {hasHiddenContent && (
                <button
                    type="button"
                    className="expandable-content__toggle"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    aria-expanded={isExpanded}
                >
                    {isExpanded ? 'Скрыть' : 'Показать больше'}
                </button>
            )}
        </div>
    );
});

ExpandableContent.displayName = 'ExpandableContent';

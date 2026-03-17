import { motion } from 'framer-motion';
import { memo } from 'react';
import type { TabSelectorProps } from './tab-selector.types';
import './tab-selector.css';

const SPRING_CONFIG = {
    stiffness: 380,
    damping: 30,
    mass: 1,
};

function TabSelectorInner<T extends string>({
    tabs,
    activeTab,
    onTabChange,
    name = 'tab-selector',
    showLabels = false,
    centered = false,
    className = '',
}: TabSelectorProps<T>) {
    const selectorClass = ['tab-selector', centered && 'tab-selector--centered', className]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={selectorClass}>
            {tabs.map(({ value, label, icon: Icon }) => {
                const isActive = activeTab === value;
                const hasIcon = Boolean(Icon);
                const labelClass = [
                    'tab-label',
                    isActive && 'active',
                    (showLabels || !hasIcon) && 'tab-label--with-text',
                ]
                    .filter(Boolean)
                    .join(' ');

                return (
                    <div key={value} className="tab-item">
                        <label className={labelClass}>
                            <input
                                type="radio"
                                name={name}
                                value={value}
                                checked={isActive}
                                onChange={() => onTabChange(value)}
                                className="tab-radio"
                            />
                            {Icon && <Icon className="tab-icon" />}
                            {(showLabels || !hasIcon) && <span className="tab-text">{label}</span>}
                            {hasIcon && !showLabels && <span className="tab-tooltip">{label}</span>}
                            {isActive && (
                                <motion.div
                                    className="tab-indicator"
                                    layoutId={`${name}-indicator`}
                                    transition={{
                                        type: 'spring',
                                        ...SPRING_CONFIG,
                                    }}
                                />
                            )}
                        </label>
                    </div>
                );
            })}
        </div>
    );
}

export const TabSelector = memo(TabSelectorInner) as typeof TabSelectorInner;

import type { FC, SVGProps } from 'react';

export interface Tab<T extends string = string> {
    value: T;
    label: string;
    icon?: FC<SVGProps<SVGSVGElement>>;
}

export interface TabSelectorProps<T extends string = string> {
    tabs: Tab<T>[];
    activeTab: T;
    onTabChange: (tab: T) => void;
    name?: string;
    showLabels?: boolean;
    centered?: boolean;
    className?: string;
}

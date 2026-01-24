declare module 'react' {
    interface HTMLAttributes {
        popover?: 'auto' | 'manual';
        popoverTarget?: string;
        popoverTargetAction?: 'toggle' | 'show' | 'hide';
    }
}

interface HTMLElement {
    showPopover(): void;
    hidePopover(): void;
    togglePopover(): void;
}
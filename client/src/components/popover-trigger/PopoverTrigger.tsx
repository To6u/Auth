import { useRef } from 'react';
import './popover-trigger.css';

interface PopoverTriggerProps {
    id: string;
    children: React.ReactNode;
    content: string;
}

export const PopoverTrigger = ({ id, children, content }: PopoverTriggerProps) => {
    const triggerRef = useRef<HTMLElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        const trigger = triggerRef.current;
        const popover = popoverRef.current;
        if (!trigger || !popover) return;

        const rect = trigger.getBoundingClientRect();
        popover.style.top = `${rect.bottom + window.scrollY + 8}px`;
        popover.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
        popover.style.transform = 'translateX(-50%)';
    };

    const handleMouseEnter = () => {
        updatePosition();
        popoverRef.current?.showPopover();
    };

    const handleMouseLeave = () => {
        popoverRef.current?.hidePopover();
    };

    return (
        <>
            <b
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </b>
            <div
                ref={popoverRef}
                popover="manual"
                id={id}
                className="popover-trigger"
            >
                {content}
            </div>
        </>
    );
};
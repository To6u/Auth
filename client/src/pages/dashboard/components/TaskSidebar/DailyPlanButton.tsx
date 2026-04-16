import { Check, ClipboardList } from 'lucide-react';
import { useCallback, useState } from 'react';

interface DailyPlanButtonProps {
    onCopy: () => void;
}

export function DailyPlanButton({ onCopy }: DailyPlanButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleClick = useCallback(() => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [onCopy]);

    return (
        <button
            type="button"
            className="daily-plan-btn"
            onClick={handleClick}
            title="Скопировать план дня"
        >
            {copied ? <Check size={16} /> : <ClipboardList size={16} />}
            <span>План дня</span>
        </button>
    );
}

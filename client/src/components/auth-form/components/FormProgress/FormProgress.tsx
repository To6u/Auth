import './form-progress.css';

export type SegmentStatus = 'empty' | 'filling' | 'valid' | 'error';

interface FormProgressProps {
    segments: SegmentStatus[];
}

export const FormProgress = ({ segments }: FormProgressProps) => {
    const validCount = segments.filter((s) => s === 'valid').length;

    return (
        <div
            className="form-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={segments.length}
            aria-valuenow={validCount}
            aria-label="Прогресс заполнения формы"
        >
            {segments.map((status, i) => (
                <div
                    key={i}
                    className={`form-progress__segment form-progress__segment--${status}`}
                />
            ))}
        </div>
    );
};

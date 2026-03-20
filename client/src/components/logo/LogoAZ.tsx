import './logo.css';

interface LogoProps {
    onAnimationEnd?: () => void;
    fading?: boolean;
}

const LogoAZ = ({ onAnimationEnd, fading }: LogoProps) => (
    <div className={`logo-wrapper${fading ? ' logo-wrapper--fading' : ''}`}>
        <div className="logo" onAnimationEnd={onAnimationEnd} />
    </div>
);

export default LogoAZ;

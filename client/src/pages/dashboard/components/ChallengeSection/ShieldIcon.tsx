const shieldConfigs = [
    {
        name: 'Pentagon',
        topRadius: '12px 12px 0 0',
        topHeight: '55%',
        bottomRadius: '0 0 80% 0',
        bottomRadiusR: '0 0 0 80%',
        gradient: 'linear-gradient(160deg, #f6d365 0%, #d4a017 50%, #b8860b 100%)',
        accent: '#f6d365',
        ornament: 'rgba(246,211,101,0.55)',
    },
    {
        name: 'Classic',
        topRadius: '16px 16px 0 0',
        topHeight: '50%',
        bottomRadius: '0 0 100% 0',
        bottomRadiusR: '0 0 0 100%',
        gradient:
            'linear-gradient(160deg, rgb(179 134 254) 0%, rgb(98, 126, 255) 50%, rgb(63, 81, 181) 100%)',
        gradientBottom:
            'linear-gradient(160deg, rgb(168, 174, 255) 0%, rgb(98, 126, 255) 50%, rgb(18, 9, 148) 100%)',
        gradientBottomRight:
            'linear-gradient(160deg, rgb(168, 174, 255) 0%, rgb(98, 126, 255) 50%, rgb(63, 152, 181) 100%)',
        accent: '#a8c0ff',
        ornament: 'rgba(168,192,255,0.55)',
    },
    {
        name: 'Royal',
        topRadius: '50% 50% 0 0 / 35% 35% 0 0',
        topHeight: '48%',
        bottomRadius: '0 0 90% 0 / 0 0 100% 0',
        bottomRadiusR: '0 0 0 90% / 0 0 0 100%',
        gradient: 'linear-gradient(160deg, #f093fb 0%, #c850c0 50%, #8e24aa 100%)',
        accent: '#f093fb',
        ornament: 'rgba(240,147,251,0.55)',
    },
    {
        name: 'Knight',
        topRadius: '50% 50% 0 0 / 45% 45% 0 0',
        topHeight: '45%',
        bottomRadius: '0 0 70% 0 / 0 0 100% 0',
        bottomRadiusR: '0 0 0 70% / 0 0 0 100%',
        gradient: 'linear-gradient(160deg, #ffecd2 0%, #e67e22 50%, #d35400 100%)',
        accent: '#ffecd2',
        ornament: 'rgba(255,236,210,0.55)',
    },
    {
        name: 'Guardian',
        topRadius: '50% 50% 0 0 / 55% 55% 0 0',
        topHeight: '42%',
        bottomRadius: '0 0 60% 0 / 0 0 100% 0',
        bottomRadiusR: '0 0 0 60% / 0 0 0 100%',
        gradient: 'linear-gradient(160deg, #84fab0 0%, #2ecc71 50%, #1a8a4a 100%)',
        accent: '#84fab0',
        ornament: 'rgba(132,250,176,0.55)',
    },
    {
        name: 'Dome',
        topRadius: '50% 50% 0 0 / 65% 65% 0 0',
        topHeight: '40%',
        bottomRadius: '0 0 50% 0 / 0 0 100% 0',
        bottomRadiusR: '0 0 0 50% / 0 0 0 100%',
        gradient: 'linear-gradient(160deg, #fbc2eb 0%, #e91e63 50%, #ad1457 100%)',
        accent: '#fbc2eb',
        ornament: 'rgba(251,194,235,0.55)',
    },
];

type ShieldConfig = (typeof shieldConfigs)[number];

function FlowerBud({
    size = 40,
    color = 'rgba(255,255,255,0.85)',
}: {
    size?: number;
    color?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 120"
            fill="none"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))' }}
        >
            <ellipse cx="50" cy="38" rx="13" ry="28" fill={color} opacity="0.95" />
            <ellipse
                cx="37"
                cy="44"
                rx="10"
                ry="22"
                fill={color}
                opacity="0.65"
                transform="rotate(-20 37 44)"
            />
            <ellipse
                cx="63"
                cy="44"
                rx="10"
                ry="22"
                fill={color}
                opacity="0.65"
                transform="rotate(20 63 44)"
            />
            <ellipse
                cx="28"
                cy="52"
                rx="8"
                ry="17"
                fill={color}
                opacity="0.4"
                transform="rotate(-40 28 52)"
            />
            <ellipse
                cx="72"
                cy="52"
                rx="8"
                ry="17"
                fill={color}
                opacity="0.4"
                transform="rotate(40 72 52)"
            />
            <path d="M40 62 Q50 52 60 62 Q56 78 50 88 Q44 78 40 62Z" fill={color} opacity="0.5" />
            <path d="M38 65 Q30 72 26 68 Q32 58 38 65Z" fill={color} opacity="0.35" />
            <path d="M62 65 Q70 72 74 68 Q68 58 62 65Z" fill={color} opacity="0.35" />
            <line
                x1="50"
                y1="88"
                x2="50"
                y2="110"
                stroke={color}
                strokeWidth="2.5"
                opacity="0.3"
                strokeLinecap="round"
            />
            <path d="M50 96 Q42 90 38 94 Q44 96 50 96Z" fill={color} opacity="0.25" />
            <path d="M50 102 Q58 96 62 100 Q56 102 50 102Z" fill={color} opacity="0.25" />
            <ellipse cx="50" cy="34" rx="5" ry="12" fill="white" opacity="0.15" />
        </svg>
    );
}

function EdgeOrnaments({
    width,
    height,
    color,
    topRatio = 0.5,
}: {
    width: number;
    height: number;
    color: string;
    topRatio?: number;
}) {
    const cx = width / 2;
    const splitY = height * topRatio;
    const botH = height - splitY;

    // Дуга идёт от (cx, splitY) к внешнему нижнему углу — совпадает с border-radius: 0 0 100% 0
    const curvePoints = (steps: number, side: 'left' | 'right') => {
        const pts = [];
        for (let i = 1; i <= steps; i++) {
            const t = i / (steps + 1);
            const angle = (t * Math.PI) / 2;
            const px =
                side === 'left'
                    ? cx * Math.cos(angle) // cx → 0
                    : cx + cx * (1 - Math.cos(angle)); // cx → width
            const py = splitY + botH * Math.sin(angle);
            pts.push({ x: px, y: py, t });
        }
        return pts;
    };

    const leftCurve = curvePoints(5, 'left');
    const rightCurve = curvePoints(5, 'right');

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            fill="none"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}
        >
            <g transform={`translate(${cx}, 12)`}>
                <circle r="2.5" fill={color} />
                <path
                    d="M-14 1 Q-7 -5 0 -2 Q7 -5 14 1"
                    stroke={color}
                    strokeWidth="1"
                    fill="none"
                    opacity="0.7"
                />
                <path
                    d="M-20 3 Q-10 -3 0 0 Q10 -3 20 3"
                    stroke={color}
                    strokeWidth="0.7"
                    fill="none"
                    opacity="0.4"
                />
                <ellipse
                    cx="-10"
                    cy="-1"
                    rx="3"
                    ry="1.5"
                    fill={color}
                    opacity="0.5"
                    transform="rotate(-15 -10 -1)"
                />
                <ellipse
                    cx="10"
                    cy="-1"
                    rx="3"
                    ry="1.5"
                    fill={color}
                    opacity="0.5"
                    transform="rotate(15 10 -1)"
                />
            </g>
            <g transform="translate(10, 16)">
                <path
                    d="M0 18 Q0 0 18 0"
                    stroke={color}
                    strokeWidth="1.2"
                    fill="none"
                    opacity="0.55"
                />
                <path
                    d="M4 14 Q4 4 14 4"
                    stroke={color}
                    strokeWidth="0.7"
                    fill="none"
                    opacity="0.35"
                />
                <circle cx="1" cy="18" r="1.8" fill={color} opacity="0.6" />
                <circle cx="18" cy="1" r="1.8" fill={color} opacity="0.6" />
                <path d="M9 0 Q12 -4 16 -1 Q12 1 9 0Z" fill={color} opacity="0.35" />
            </g>
            <g transform={`translate(${width - 10}, 16) scale(-1,1)`}>
                <path
                    d="M0 18 Q0 0 18 0"
                    stroke={color}
                    strokeWidth="1.2"
                    fill="none"
                    opacity="0.55"
                />
                <path
                    d="M4 14 Q4 4 14 4"
                    stroke={color}
                    strokeWidth="0.7"
                    fill="none"
                    opacity="0.35"
                />
                <circle cx="1" cy="18" r="1.8" fill={color} opacity="0.6" />
                <circle cx="18" cy="1" r="1.8" fill={color} opacity="0.6" />
                <path d="M9 0 Q12 -4 16 -1 Q12 1 9 0Z" fill={color} opacity="0.35" />
            </g>
            {[0.05, 0.14, 0.24, 0.34, 0.44, 0.54, 0.64, 0.74, 0.84].map((p, i) => (
                <g key={`le${i}`} transform={`translate(7, ${height * p})`}>
                    <path
                        d={`M0 -5 Q${5 + (i % 3)} 0 0 5`}
                        stroke={color}
                        strokeWidth="1"
                        fill="none"
                        opacity={0.52 - i * 0.04}
                    />
                    <circle cx="0" cy="0" r="1.3" fill={color} opacity={0.55 - i * 0.04} />
                    {i % 2 === 0 && <path d="M2 -3 Q6 -5 5 -1" fill={color} opacity="0.25" />}
                    {i % 3 === 1 && (
                        <ellipse cx="4" cy="0" rx="2" ry="1" fill={color} opacity="0.2" />
                    )}
                </g>
            ))}
            {[0.05, 0.14, 0.24, 0.34, 0.44, 0.54, 0.64, 0.74, 0.84].map((p, i) => (
                <g key={`re${i}`} transform={`translate(${width - 7}, ${height * p}) scale(-1,1)`}>
                    <path
                        d={`M0 -5 Q${5 + (i % 3)} 0 0 5`}
                        stroke={color}
                        strokeWidth="1"
                        fill="none"
                        opacity={0.52 - i * 0.04}
                    />
                    <circle cx="0" cy="0" r="1.3" fill={color} opacity={0.55 - i * 0.04} />
                    {i % 2 === 0 && <path d="M2 -3 Q6 -5 5 -1" fill={color} opacity="0.25" />}
                    {i % 3 === 1 && (
                        <ellipse cx="4" cy="0" rx="2" ry="1" fill={color} opacity="0.2" />
                    )}
                </g>
            ))}
            {leftCurve.map((pt, i) => {
                const angle =
                    Math.atan2(
                        (i < leftCurve.length - 1 ? leftCurve[i + 1].y : height) - pt.y,
                        (i < leftCurve.length - 1 ? leftCurve[i + 1].x : 0) - pt.x
                    ) *
                    (180 / Math.PI);
                const op = 0.55 - i * 0.08;
                return (
                    <g key={`bl${i}`} transform={`translate(${pt.x}, ${pt.y}) rotate(${angle})`}>
                        <path
                            d="M-4 0 Q0 -5 4 0"
                            stroke={color}
                            strokeWidth="0.9"
                            fill="none"
                            opacity={op}
                        />
                        <path
                            d="M-2.5 0 Q0 -3 2.5 0"
                            stroke={color}
                            strokeWidth="0.6"
                            fill="none"
                            opacity={op * 0.6}
                        />
                        <circle r="1.2" fill={color} opacity={op} />
                        {i % 2 === 0 && (
                            <ellipse
                                cx="0"
                                cy="-4"
                                rx="2.5"
                                ry="1.2"
                                fill={color}
                                opacity={op * 0.5}
                                transform="rotate(-15)"
                            />
                        )}
                        {i % 2 === 1 && (
                            <>
                                <circle cx="-3" cy="-1" r="0.7" fill={color} opacity={op * 0.5} />
                                <circle cx="3" cy="-1" r="0.7" fill={color} opacity={op * 0.5} />
                            </>
                        )}
                    </g>
                );
            })}
            {rightCurve.map((pt, i) => {
                const angle =
                    Math.atan2(
                        (i < rightCurve.length - 1 ? rightCurve[i + 1].y : height) - pt.y,
                        (i < rightCurve.length - 1 ? rightCurve[i + 1].x : width) - pt.x
                    ) *
                    (180 / Math.PI);
                const op = 0.55 - i * 0.08;
                return (
                    <g key={`br${i}`} transform={`translate(${pt.x}, ${pt.y}) rotate(${angle})`}>
                        <path
                            d="M-4 0 Q0 -5 4 0"
                            stroke={color}
                            strokeWidth="0.9"
                            fill="none"
                            opacity={op}
                        />
                        <path
                            d="M-2.5 0 Q0 -3 2.5 0"
                            stroke={color}
                            strokeWidth="0.6"
                            fill="none"
                            opacity={op * 0.6}
                        />
                        <circle r="1.2" fill={color} opacity={op} />
                        {i % 2 === 0 && (
                            <ellipse
                                cx="0"
                                cy="-4"
                                rx="2.5"
                                ry="1.2"
                                fill={color}
                                opacity={op * 0.5}
                                transform="rotate(15)"
                            />
                        )}
                        {i % 2 === 1 && (
                            <>
                                <circle cx="-3" cy="-1" r="0.7" fill={color} opacity={op * 0.5} />
                                <circle cx="3" cy="-1" r="0.7" fill={color} opacity={op * 0.5} />
                            </>
                        )}
                    </g>
                );
            })}
            <g transform={`translate(${cx}, ${height - 10})`}>
                <path
                    d="M-18 0 Q-9 -7 0 -2 Q9 -7 18 0"
                    stroke={color}
                    strokeWidth="1"
                    fill="none"
                    opacity="0.5"
                />
                <path
                    d="M-11 3 Q-5 -2 0 2 Q5 -2 11 3"
                    stroke={color}
                    strokeWidth="0.7"
                    fill="none"
                    opacity="0.35"
                />
                <circle cx="0" cy="0" r="2" fill={color} opacity="0.5" />
                <circle cx="-18" cy="0" r="1.2" fill={color} opacity="0.45" />
                <circle cx="18" cy="0" r="1.2" fill={color} opacity="0.45" />
                <ellipse
                    cx="-5"
                    cy="3"
                    rx="2"
                    ry="1"
                    fill={color}
                    opacity="0.3"
                    transform="rotate(-20 -5 3)"
                />
                <ellipse
                    cx="5"
                    cy="3"
                    rx="2"
                    ry="1"
                    fill={color}
                    opacity="0.3"
                    transform="rotate(20 5 3)"
                />
            </g>
            <rect
                x="12"
                y="14"
                width={width - 24}
                height={height - 32}
                rx="5"
                stroke={color}
                strokeWidth="0.5"
                fill="none"
                opacity="0.18"
                strokeDasharray="3 4"
            />
        </svg>
    );
}

function Shield({ config, size = 160 }: { config: ShieldConfig; size?: number }) {
    const h = size * 1.25;
    const topRatio = parseFloat(config.topHeight) / 100;

    return (
        <div
            style={{
                width: size,
                height: h,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.4))`,
            }}
        >
            <div
                style={{
                    width: '100%',
                    height: config.topHeight,
                    background: config.gradient,
                    borderRadius: config.topRadius,
                    position: 'relative',
                    zIndex: 1,
                }}
            />
            <div style={{ width: '100%', flex: 1, display: 'flex', marginTop: -1 }}>
                <div
                    style={{
                        width: '50%',
                        height: '100%',
                        background: config.gradientBottom ?? config.gradient,
                        borderRadius: config.bottomRadius,
                    }}
                />
                <div
                    style={{
                        width: '50%',
                        height: '100%',
                        background:
                            config.gradientBottomRight ?? config.gradientBottom ?? config.gradient,
                        borderRadius: config.bottomRadiusR,
                    }}
                />
            </div>
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    pointerEvents: 'none',
                    zIndex: 2,
                }}
            >
                <div
                    style={{
                        width: '100%',
                        height: config.topHeight,
                        borderRadius: config.topRadius,
                        background:
                            'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 55%)',
                    }}
                />
            </div>
            <EdgeOrnaments width={size} height={h} color={config.ornament} topRatio={topRatio} />
            <div
                style={{
                    position: 'absolute',
                    top: '30%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 4,
                }}
            >
                <FlowerBud size={size * 0.32} color={config.ornament} />
            </div>
        </div>
    );
}

export function ShieldIcon({ variant = 1, size = 160 }: { variant?: number; size?: number }) {
    const config = shieldConfigs[variant % shieldConfigs.length];
    return <Shield config={config} size={size} />;
}

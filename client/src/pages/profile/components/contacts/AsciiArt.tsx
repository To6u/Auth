import { useMemo } from 'react';

interface Props {
    text: string;
    className?: string;
}

interface CharData {
    ch: string;
    i: number;
    style: React.CSSProperties | undefined;
}

export function AsciiArt({ text, className }: Props) {
    const chars = useMemo<CharData[]>(
        () =>
            text.split('').map((ch, i) => ({
                ch,
                i,
                style:
                    ch !== ' ' && ch !== '\n'
                        ? ({ '--delay': Math.random() * 10 } as React.CSSProperties)
                        : undefined,
            })),
        [text]
    );

    return (
        <pre className={className} aria-hidden="true">
            {chars.map(({ ch, i, style }) =>
                style ? (
                    <span key={i} style={style}>
                        {ch}
                    </span>
                ) : (
                    ch
                )
            )}
        </pre>
    );
}

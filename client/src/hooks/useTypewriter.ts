import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTypewriterOptions {
    words: string[];
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseAfterTyping?: number;
    pauseAfterDeleting?: number;
    enabled?: boolean;
    onFirstWordComplete?: () => void;
}

interface TypewriterState {
    text: string;
    wordIndex: number;
    isDeleting: boolean;
}

export const useTypewriter = ({
    words,
    typingSpeed = 50,
    deletingSpeed = 50,
    pauseAfterTyping = 1000,
    pauseAfterDeleting = 300,
    enabled = true,
    onFirstWordComplete,
}: UseTypewriterOptions) => {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstWordRef = useRef(true);

    const [state, setState] = useState<TypewriterState>({
        text: '',
        wordIndex: 0,
        isDeleting: false,
    });

    const clearTimeout_ = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        clearTimeout_();
        isFirstWordRef.current = true;
        setState({ text: '', wordIndex: 0, isDeleting: false });
    }, [clearTimeout_]);

    useEffect(() => {
        if (!enabled) return;

        const { text, wordIndex, isDeleting } = state;
        const word = words[wordIndex];

        if (!isDeleting) {
            if (text.length < word.length) {
                timeoutRef.current = setTimeout(() => {
                    setState((prev) => ({
                        ...prev,
                        text: word.slice(0, prev.text.length + 1),
                    }));
                }, typingSpeed);
            } else {
                if (isFirstWordRef.current) {
                    isFirstWordRef.current = false;
                    onFirstWordComplete?.();
                }
                timeoutRef.current = setTimeout(() => {
                    setState((prev) => ({ ...prev, isDeleting: true }));
                }, pauseAfterTyping);
            }
        } else {
            if (text.length > 0) {
                timeoutRef.current = setTimeout(() => {
                    setState((prev) => ({
                        ...prev,
                        text: word.slice(0, prev.text.length - 1),
                    }));
                }, deletingSpeed);
            } else {
                timeoutRef.current = setTimeout(() => {
                    setState({
                        text: '',
                        wordIndex: (wordIndex + 1) % words.length,
                        isDeleting: false,
                    });
                }, pauseAfterDeleting);
            }
        }

        return clearTimeout_;
    }, [
        enabled,
        state,
        words,
        typingSpeed,
        deletingSpeed,
        pauseAfterTyping,
        pauseAfterDeleting,
        onFirstWordComplete,
        clearTimeout_,
    ]);

    return { text: state.text, reset };
};

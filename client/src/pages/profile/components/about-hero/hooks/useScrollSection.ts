import { MotionValue, useTransform } from 'framer-motion';

type ValueRange = readonly number[];

interface PropConfig {
    /** Output values, e.g. [0, 1] or [0, 0, -200] */
    values: ValueRange;
    /** Per-property progress range override, e.g. [0, 0.6] */
    range?: [number, number];
}

/** Shorthand: просто массив значений или полный конфиг */
type PropValue = ValueRange | PropConfig;

interface AnimationProps {
    x?: PropValue;
    y?: PropValue;
    opacity?: PropValue;
    scale?: PropValue;
}

interface PhaseConfig {
    progress: MotionValue<number>;
    /** Дефолтный диапазон прогресса для всех свойств фазы */
    range?: [number, number];
    props: AnimationProps;
}

interface ScrollSectionConfig {
    enter: PhaseConfig;
    exit: PhaseConfig;
}

/** Нормализует PropValue в { values, range } */
function normalizeProp(
    prop: PropValue | undefined,
    defaultRange: [number, number]
): { values: ValueRange; range: [number, number] } | null {
    if (!prop) return null;

    if (Array.isArray(prop) || (typeof prop === 'object' && !('values' in prop))) {
        return { values: prop as ValueRange, range: defaultRange };
    }

    const config = prop as PropConfig;
    return { values: config.values, range: config.range ?? defaultRange };
}

/**
 * Создаёт MotionValue для одного свойства одной фазы.
 * Вызывается всегда (rules of hooks), возвращает null если prop не задан.
 */
function usePhaseValue(
    progress: MotionValue<number>,
    prop: { values: ValueRange; range: [number, number] } | null
): MotionValue<number> | null {
    const range = prop?.range ?? [0, 1];
    const values = prop?.values ?? [0, 0];

    const inputRange = values.length === 3 ? [range[0], (range[0] + range[1]) / 2, range[1]] : [range[0], range[1]];

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const mv = useTransform(progress, inputRange, values as number[]);

    return prop ? mv : null;
}

/** Комбинирует enter и exit MotionValue */
function useCombined(
    enter: MotionValue<number> | null,
    exit: MotionValue<number> | null,
    mode: 'add' | 'multiply'
): MotionValue<number> | null {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const combined = useTransform(() => {
        if (enter && exit) {
            return mode === 'add' ? enter.get() + exit.get() : enter.get() * exit.get();
        }
        if (enter) return enter.get();
        if (exit) return exit.get();
        return mode === 'multiply' ? 1 : 0;
    });

    return enter || exit ? combined : null;
}

type StyleKey = 'x' | 'y' | 'opacity' | 'scale';

/**
 * Заменяет повторяющийся паттерн enter/exit useTransform.
 *
 * Каждое свойство можно задать как массив значений (shorthand)
 * или как объект { values, range } для per-property range override.
 *
 * @example
 * const section = useScrollSection({
 *   enter: { progress: enterProgress, props: { x: [-300, 0], opacity: [0, 1] } },
 *   exit: {
 *     progress: exitProgress,
 *     range: [0, 1],
 *     props: {
 *       x: [0, -200],
 *       opacity: { values: [1, 0], range: [0, 0.6] }, // свой range
 *     },
 *   },
 * });
 * <motion.div style={section.style} />
 */
export function useScrollSection(config: ScrollSectionConfig) {
    const { enter, exit } = config;
    const enterRange = enter.range ?? [0, 1];
    const exitRange = exit.range ?? [0, 1];

    // Нормализуем все свойства
    const eX = normalizeProp(enter.props.x, enterRange);
    const xX = normalizeProp(exit.props.x, exitRange);
    const eY = normalizeProp(enter.props.y, enterRange);
    const xY = normalizeProp(exit.props.y, exitRange);
    const eO = normalizeProp(enter.props.opacity, enterRange);
    const xO = normalizeProp(exit.props.opacity, exitRange);
    const eS = normalizeProp(enter.props.scale, enterRange);
    const xS = normalizeProp(exit.props.scale, exitRange);

    // Все хуки вызываются безусловно (rules of hooks)
    const enterX = usePhaseValue(enter.progress, eX);
    const exitX = usePhaseValue(exit.progress, xX);
    const combinedX = useCombined(enterX, exitX, 'add');

    const enterY = usePhaseValue(enter.progress, eY);
    const exitY = usePhaseValue(exit.progress, xY);
    const combinedY = useCombined(enterY, exitY, 'add');

    const enterOpacity = usePhaseValue(enter.progress, eO);
    const exitOpacity = usePhaseValue(exit.progress, xO);
    const combinedOpacity = useCombined(enterOpacity, exitOpacity, 'multiply');

    const enterScale = usePhaseValue(enter.progress, eS);
    const exitScale = usePhaseValue(exit.progress, xS);
    const combinedScale = useCombined(enterScale, exitScale, 'multiply');

    const style: Partial<Record<StyleKey, MotionValue<number>>> = {};

    if (combinedX) style.x = combinedX;
    if (combinedY) style.y = combinedY;
    if (combinedOpacity) style.opacity = combinedOpacity;
    if (combinedScale) style.scale = combinedScale;

    return { style };
}

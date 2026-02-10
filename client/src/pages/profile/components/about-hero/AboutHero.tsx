import { memo, useState, useRef, useCallback } from 'react';
import { motion, useInView, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useTypewriter } from '@/hooks/useTypewriter';
import { PopoverTrigger } from '@/components/popover-trigger/PopoverTrigger';
import { fadeInUp } from './animations';
import { TYPEWRITER_WORDS, TYPEWRITER_CONFIG } from './constants';
import './about-hero.css';
import ScrollProgressIndicator from '@/pages/profile/components/about-hero/ScrollProgressIndicator.tsx';
import { ExpandableContent } from '@/components/expandable-content/ExpandableContent.tsx';
import { CardGallery } from '@/components/card-gallery/CardGallery.tsx';
import FilmStrip, { FilmFrame } from '@/components/film-strip/FilmStrip.tsx';
const images = import.meta.glob('@/assets/about-images/*.jpg', { eager: true, import: 'default' }) as Record<
    string,
    string
>;

// превратить в массив
const gallery = Object.values(images);

/** Хелпер для комбинирования MotionValue (enter * exit) */
const useCombinedOpacity = (enter: MotionValue<number>, exit: MotionValue<number>) => {
    return useTransform(() => enter.get() * exit.get());
};

export const AboutHero = memo(() => {
    const nameRef = useRef<HTMLDivElement>(null);
    const sectionOneRef = useRef<HTMLDivElement>(null);
    const sectionThreeRef = useRef<HTMLDivElement>(null);

    const isNameInView = useInView(nameRef, { once: true, margin: '-100px' });

    // ═══════════════════════════════════════════════════════════════
    // SCROLL PROGRESS
    // ═══════════════════════════════════════════════════════════════

    // Section One: появление (от входа в viewport до полного появления)
    const { scrollYProgress: sectionOneEnterProgress } = useScroll({
        target: sectionOneRef,
        offset: ['40% end', 'start 20%'], // появляется когда верх секции доходит до 60% viewport
    });

    // Section One: выход (когда секция уходит вверх за viewport)
    const { scrollYProgress: sectionOneExitProgress } = useScroll({
        target: sectionOneRef,
        offset: ['start 160px', 'end start'],
    });

    // Section Three: выход
    const { scrollYProgress: sectionThreeExitProgress } = useScroll({
        target: sectionThreeRef,
        offset: ['start 160px', 'end start'],
    });

    // Section Three: появление
    const { scrollYProgress: sectionThreeEnterProgress } = useScroll({
        target: sectionThreeRef,
        offset: ['start end', 'start 20%'],
    });

    // ═══════════════════════════════════════════════════════════════
    // SECTION ONE — полностью scroll-driven (без variants)
    // ═══════════════════════════════════════════════════════════════

    // Enter анимация
    const sectionOneEnterX = useTransform(sectionOneEnterProgress, [0, 1], [-300, 0]);
    const sectionOneEnterOpacity = useTransform(sectionOneEnterProgress, [0, 1], [0, 1]);

    // Exit анимация
    const sectionOneExitOpacity = useTransform(sectionOneExitProgress, [0, 1], [1, 0.2]);
    const sectionOneExitX = useTransform(sectionOneExitProgress, [0, 1], [0, -200]);

    // Комбинированная opacity (enter * exit)
    const sectionOneOpacity = useCombinedOpacity(sectionOneEnterOpacity, sectionOneExitOpacity);
    const sectionOneX = useTransform(() => sectionOneEnterX.get() + sectionOneExitX.get());

    // ═══════════════════════════════════════════════════════════════
    // SECTION TWO — полностью scroll-driven
    // ═══════════════════════════════════════════════════════════════

    // Enter анимация (появляется из правого нижнего угла)
    const sectionTwoEnterScale = useTransform(sectionOneEnterProgress, [0.3, 1], [0, 1]);
    const sectionTwoEnterX = useTransform(sectionOneEnterProgress, [0.3, 1], [600, 0]);
    const sectionTwoEnterY = useTransform(sectionOneEnterProgress, [0.3, 1], [200, 0]);
    const sectionTwoEnterOpacity = useTransform(sectionOneEnterProgress, [0.3, 1], [0, 1]);

    // Exit анимация
    const sectionTwoExitScale = useTransform(sectionOneExitProgress, [0, 1], [1, 0.8]);
    const sectionTwoExitX = useTransform(sectionOneExitProgress, [0, 1], [0, 0, -200]);
    const sectionTwoExitY = useTransform(sectionOneExitProgress, [0, 1], [0, 0, 200]);
    const sectionTwoExitOpacity = useTransform(sectionOneExitProgress, [0, 0.6], [1, 0]);

    // Комбинированные значения
    const sectionTwoOpacity = useCombinedOpacity(sectionTwoEnterOpacity, sectionTwoExitOpacity);
    const sectionTwoScale = useTransform(() => sectionTwoEnterScale.get() * sectionTwoExitScale.get());
    const sectionTwoX = useTransform(() => sectionTwoEnterX.get() + sectionTwoExitX.get());
    const sectionTwoY = useTransform(() => sectionTwoEnterY.get() + sectionTwoExitY.get());

    // ═══════════════════════════════════════════════════════════════
    // GALLERY — scroll-driven (с задержкой относительно heading)
    // ═══════════════════════════════════════════════════════════════

    const galleryEnterScale = useTransform(sectionOneEnterProgress, [0.4, 1], [0, 1]);
    const galleryEnterOpacity = useTransform(sectionOneEnterProgress, [0.4, 1], [0, 1]);

    const galleryExitScale = useTransform(sectionOneExitProgress, [0, 1], [1, 0.7]);
    const galleryExitOpacity = useTransform(sectionOneExitProgress, [0, 0.6], [1, 0]);

    const galleryOpacity = useCombinedOpacity(galleryEnterOpacity, galleryExitOpacity);
    const galleryScale = useTransform(() => galleryEnterScale.get() * galleryExitScale.get());

    // ═══════════════════════════════════════════════════════════════
    // SECTION THREE — полностью scroll-driven
    // ═══════════════════════════════════════════════════════════════

    // Enter анимация (появляется из левого нижнего угла)
    const sectionThreeEnterX = useTransform(sectionThreeEnterProgress, [0, 1], [600, 0]);
    const sectionThreeEnterOpacity = useTransform(sectionThreeEnterProgress, [0, 1], [0, 1]);

    // Exit анимация
    const sectionThreeExitX = useTransform(sectionThreeExitProgress, [0, 0.7, 1], [0, 0, 200]);
    const sectionThreeExitOpacity = useTransform(sectionThreeExitProgress, [0, 0.6], [1, 1, 0.2]);

    // Комбинированные значения
    const sectionThreeOpacity = useCombinedOpacity(sectionThreeEnterOpacity, sectionThreeExitOpacity);
    const sectionThreeX = useTransform(() => sectionThreeEnterX.get() + sectionThreeExitX.get());

    // ═══════════════════════════════════════════════════════════════
    // SECTION TITLE — полностью scroll-driven
    // ═══════════════════════════════════════════════════════════════

    // Enter анимация (появляется когда Section Two начинает исчезать)
    const sectionTitleEnterScale = useTransform(sectionOneExitProgress, [0, 1], [0, 1]);
    const sectionTitleEnterX = useTransform(sectionOneExitProgress, [0, 1], [-200, 0]);
    const sectionTitleEnterY = useTransform(sectionOneExitProgress, [0, 1], [200, 0]);
    const sectionTitleEnterOpacity = useTransform(sectionOneExitProgress, [0, 1], [0, 1]);

    // ═══════════════════════════════════════════════════════════════
    // STATE & CALLBACKS
    // ═══════════════════════════════════════════════════════════════

    const [showFrontend, setShowFrontend] = useState(false);

    const handleFirstWordComplete = useCallback(() => setShowFrontend(true), []);

    const { text: typewriterText } = useTypewriter({
        words: TYPEWRITER_WORDS,
        ...TYPEWRITER_CONFIG,
        enabled: isNameInView,
        onFirstWordComplete: handleFirstWordComplete,
    });

    const frames: FilmFrame[] = gallery.map((src, index) => ({
        id: index,
        image: src,
    }));

    return (
        <section id="aboutHero" className="about-hero">
            <FilmStrip
                frames={frames}
                frameSize={80} // размер кадра в px
                frameGap={8} // расстояние между кадрами (% от path)
                duration={200}
            />
            {/* Name Section */}
            <div className="about-name" ref={nameRef}>
                <motion.span
                    className="name"
                    variants={fadeInUp}
                    initial="hidden"
                    animate={isNameInView ? 'visible' : 'hidden'}
                    transition={{ duration: 1, ease: 'easeOut' }}
                >
                    Niyaz
                </motion.span>

                <span className="typewriter" style={{ opacity: isNameInView ? 1 : 0, transition: 'opacity 0.3s' }}>
                    {typewriterText}
                    <span className="typewriter__cursor">|</span>
                </span>

                <motion.span
                    variants={fadeInUp}
                    initial="hidden"
                    animate={showFrontend ? 'visible' : 'hidden'}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    Frontend
                </motion.span>
            </div>

            {/* Sections */}
            <div className="about-hero-sections">
                {/* Section One - Glass Card (полностью scroll-driven) */}
                <motion.div
                    ref={sectionOneRef}
                    className="glass-card about-hero-section-one"
                    style={{
                        x: sectionOneX,
                        opacity: sectionOneOpacity,
                    }}
                >
                    <SectionOneContent />
                </motion.div>

                {/* Section Two - Sticky Title (полностью scroll-driven) */}
                <div className="about-hero-right">
                    <motion.div
                        className="about-hero-section-heading"
                        style={{
                            transformOrigin: 'left bottom',
                            scale: sectionTwoScale,
                            x: sectionTwoX,
                            y: sectionTwoY,
                            opacity: sectionTwoOpacity,
                        }}
                    >
                        <h2>Откуда я такой взялся</h2>
                        <span>немного о местности</span>
                    </motion.div>
                    {/*<CardGallery*/}
                    {/*    images={gallery}*/}
                    {/*    enterProgress={sectionOneEnterProgress}*/}
                    {/*    exitProgress={sectionOneExitProgress}*/}
                    {/*/>*/}
                </div>

                {/* Section Title (полностью scroll-driven) */}
                <div className="about-hero-left">
                    <motion.div
                        className="about-hero-section-heading about-hero-section-heading--right"
                        style={{
                            transformOrigin: 'left bottom',
                            scale: sectionTitleEnterScale,
                            x: sectionTitleEnterX,
                            y: sectionTitleEnterY,
                            opacity: sectionTitleEnterOpacity,
                        }}
                    >
                        <h2>Дорога длиною в жизнь</h2>
                        <span>некоторые моменты</span>
                    </motion.div>
                </div>

                {/* Section Three (полностью scroll-driven) */}
                <motion.div
                    ref={sectionThreeRef}
                    className="glass-card about-hero-section-three"
                    style={{
                        transformOrigin: 'right bottom',
                        x: sectionThreeX,
                        opacity: sectionThreeOpacity,
                    }}
                >
                    <SectionThreeContent />
                </motion.div>
            </div>
        </section>
    );
});

AboutHero.displayName = 'AboutHero';

/* Контент секций вынесен для читаемости */
const SectionOneContent = memo(() => (
    <div className="about-section">
        <div className="about-section__content">
            <span>Откуда?</span>
            <p>
                Меня зовут Нияз. Я из{' '}
                <PopoverTrigger id="popover-barda" content="Село в Пермском крае, основано в 1740 году">
                    Барды
                </PopoverTrigger>
                — села в двух часах от{' '}
                <PopoverTrigger id="popover-perm" content="Город-миллионник на Урале">
                    Перми
                </PopoverTrigger>
                .
            </p>

            <span>И чё там есть?</span>
            <p>
                Природа, пруд, речка{' '}
                <PopoverTrigger id="popover-kazmakty" content="Небольшая речка в Бардымском районе">
                    Казмакты
                </PopoverTrigger>
                , которая впадает в{' '}
                <PopoverTrigger id="popover-tulva" content="Река длиной 118 км, приток Камы">
                    Тулву
                </PopoverTrigger>
                . Хорошее место выдохнуть от города.
            </p>

            <span>Для кого-то «дыра дырой». Мне — родной край.</span>
        </div>
    </div>
));

SectionOneContent.displayName = 'SectionOneContent';

const SectionThreeContent = memo(() => {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <div className="about-section about-section--with-progress" ref={contentRef}>
            {/* Индикатор прогресса */}
            <ScrollProgressIndicator containerRef={contentRef} headingSelector=".about-section__title" />

            <h2 className="about-section__title">Детство</h2>
            <ExpandableContent className="about-section__content">
                <span>Совсем мелкий</span>
                <p>Помню смутно. В основном — как с братом делили всё подряд.</p>
                <span>До школы</span>
                <p>Родители на работе — мы у соседей. То этажом выше, то ниже. Нормальная схема.</p>
                <span>Сломал руку на площадке. Орал так, что до сих пор помню.</span>
            </ExpandableContent>

            <h2 className="about-section__title">Школьные годы</h2>
            <ExpandableContent className="about-section__content">
                <p>
                    <PopoverTrigger
                        id="popover-barda-gimnaziyasi"
                        content="Сейчас называется «Бардымская гимназия имени Габдуллы Тукая»"
                    >
                        Бардымская гимназия
                    </PopoverTrigger>
                    . Учился средне. Не ботан, не раздолбай — золотая середина.
                </p>
                <span>Начальная школа</span>
                <p>Ничего особенного. Раз словил тряпкой от учительницы — сам виноват, нечего ворон считать.</p>
                <p>Школа, дом, школа, дом. Повторять до пятого класса.</p>
                <span>Старшие классы</span>
                <p>С девятого стало интереснее. Воспоминания — цветные.</p>
                <span>Интерес к вебу</span>
                <p>
                    В 11 классе на информатике показали{' '}
                    <PopoverTrigger id="popover-html" content="HyperText Markup Language — язык разметки веб-страниц">
                        HTML
                    </PopoverTrigger>
                    . Всё, пропал. Ночами смотрел уроки по{' '}
                    <PopoverTrigger id="popover-css" content="Cascading Style Sheets — язык стилей">
                        CSS
                    </PopoverTrigger>{' '}
                    и{' '}
                    <PopoverTrigger id="popover-php" content="PHP: Hypertext Preprocessor — серверный язык">
                        PHP
                    </PopoverTrigger>
                    .{' '}
                    <PopoverTrigger id="popover-js" content="JavaScript — язык для интерактивности на сайтах">
                        JS
                    </PopoverTrigger>{' '}
                    не заходил — мозг отказывался. Зашёл только в универе, когда вышел первый{' '}
                    <PopoverTrigger
                        id="popover-angular"
                        content="JavaScript-фреймворк от Google, первая версия вышла в 2010 году"
                    >
                        Angular
                    </PopoverTrigger>
                    .
                </p>

                <span>
                    Летом — скейт по убитому асфальту. Зимой — сноуборд на{' '}
                    <PopoverTrigger id="popover-utar" content="Небольшая гора в Барде">
                        «Утаре»
                    </PopoverTrigger>
                    . Вечерами —{' '}
                    <PopoverTrigger id="popover-la2" content="Lineage 2 — популярная MMORPG">
                        LA2
                    </PopoverTrigger>
                    . Первый сайт — про{' '}
                    <PopoverTrigger
                        id="popover-tmnt"
                        content="Teenage Mutant Ninja Turtles — культовая франшиза о черепахах-мутантах"
                    >
                        черепашек-ниндзя
                    </PopoverTrigger>
                    . Гита не знал — сайт сдох.
                </span>
            </ExpandableContent>

            <h2 className="about-section__title">Студенчество</h2>
            <ExpandableContent className="about-section__content">
                <span>Бакалавриат</span>
                <p>
                    <PopoverTrigger
                        id="popover-pnipu"
                        content="Пермский национальный исследовательский политехнический университет"
                    >
                        ПНИПУ
                    </PopoverTrigger>
                    , электротех, кафедра{' '}
                    <PopoverTrigger id="popover-itas" content="Информационные технологии и автоматизированные системы">
                        ИТАС
                    </PopoverTrigger>
                    , специальность{' '}
                    <PopoverTrigger id="popover-ivt" content="Информатика и вычислительная техника">
                        ИВТ
                    </PopoverTrigger>
                    . Четыре года в общаге с братом. Пролетело мгновенно.
                </p>

                <span>Магистратура</span>
                <p>
                    Та же кафедра, специальность{' '}
                    <PopoverTrigger id="popover-ris" content="Разработка информационных систем">
                        РИС
                    </PopoverTrigger>
                    . Ещё два года. Повезло с общагой, повезло с людьми.
                </p>

                <span>Первая работа за деньги</span>
                <p>
                    Четвёртый курс. Устроился в какую-то веб-студию — название уже не вспомню. Неделя. Там был{' '}
                    <PopoverTrigger
                        id="popover-1c"
                        content="1С:Предприятие — платформа для автоматизации бизнеса, со своим языком программирования"
                    >
                        1С
                    </PopoverTrigger>
                    . Я в нём ни черта. Ушёл (выгнали).
                </p>

                <span>Ещё попытки</span>
                <p>Пара мест не по специальности: техподдержка и веб-дизайнер. В каждом — около полугода.</p>

                <span>Подтянулся</span>
                <p>
                    Немного прокачал оформление страниц — ну, не бомба, но и не стыдно. Год фриланса. Устал от
                    нестабильных денег — пошёл искать найм.
                </p>

                <span>Собесы</span>
                <p>
                    Ходил, не особо успешно. Однажды сами нашли: «Будешь делать личный кабинет Ростелекома» (ага, прям
                    так и сказали). Взяли, чему я был очень рад.{' '}
                    <PopoverTrigger
                        id="popover-react"
                        content="JavaScript-библиотека от Meta* для создания пользовательских интерфейсов"
                    >
                        React
                    </PopoverTrigger>
                    ,{' '}
                    <PopoverTrigger
                        id="popover-ts"
                        content="TypeScript — надстройка над JavaScript с типизацией от Microsoft"
                    >
                        TypeScript
                    </PopoverTrigger>{' '}
                    — то, что искал.
                </p>

                <span>
                    Веб не бросал. В бакалавриате был{' '}
                    <PopoverTrigger id="popover-cpp" content="Язык программирования общего назначения, расширение C">
                        C++
                    </PopoverTrigger>{' '}
                    — не зашёл. Диплом сделал на вебе. В магистратуре — больше кода, язык на выбор. Диплом писал на{' '}
                    <PopoverTrigger
                        id="popover-csharp"
                        content="Объектно-ориентированный язык от Microsoft, часть платформы .NET"
                    >
                        C#
                    </PopoverTrigger>
                    , что-то с 3D-моделями.
                </span>
            </ExpandableContent>

            <h2 className="about-section__title">Реальность</h2>
            <ExpandableContent className="about-section__content">
                <span>Работа</span>
                <p></p>
            </ExpandableContent>
        </div>
    );
});

SectionThreeContent.displayName = 'SectionThreeContent';

export default AboutHero;

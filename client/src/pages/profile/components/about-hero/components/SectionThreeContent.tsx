import type { MotionValue } from 'framer-motion';
import { memo, useRef } from 'react';
import { ExpandableContent } from '@/components/expandable-content/ExpandableContent.tsx';
import { PopoverTrigger } from '@/components/popover-trigger/PopoverTrigger';
import ScrollProgressIndicator from '@/pages/profile/components/about-hero/ScrollProgressIndicator.tsx';

interface SectionThreeContentProps {
    gateProgress?: MotionValue<number>;
}

export const SectionThreeContent = memo(({ gateProgress }: SectionThreeContentProps) => {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <div className="about-section about-section--with-progress" ref={contentRef}>
            <ScrollProgressIndicator
                containerRef={contentRef}
                headingSelector=".about-section__title"
                gateProgress={gateProgress}
            />

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
                <p>
                    Ничего особенного. Раз словил тряпкой от учительницы — сам виноват, нечего ворон
                    считать.
                </p>
                <p>Школа, дом, школа, дом. Повторять до пятого класса.</p>
                <span>Старшие классы</span>
                <p>С девятого стало интереснее. Воспоминания — цветные.</p>
                <span>Интерес к вебу</span>
                <p>
                    В 11 классе на информатике показали{' '}
                    <PopoverTrigger
                        id="popover-html"
                        content="HyperText Markup Language — язык разметки веб-страниц"
                    >
                        HTML
                    </PopoverTrigger>
                    . Всё, пропал. Ночами смотрел уроки по{' '}
                    <PopoverTrigger id="popover-css" content="Cascading Style Sheets — язык стилей">
                        CSS
                    </PopoverTrigger>{' '}
                    и{' '}
                    <PopoverTrigger
                        id="popover-php"
                        content="PHP: Hypertext Preprocessor — серверный язык"
                    >
                        PHP
                    </PopoverTrigger>
                    .{' '}
                    <PopoverTrigger
                        id="popover-js"
                        content="JavaScript — язык для интерактивности на сайтах"
                    >
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
                    <PopoverTrigger
                        id="popover-itas"
                        content="Информационные технологии и автоматизированные системы"
                    >
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
                    Четвёртый курс. Устроился в какую-то веб-студию — название уже не вспомню.
                    Неделя. Там был{' '}
                    <PopoverTrigger
                        id="popover-1c"
                        content="1С:Предприятие — платформа для автоматизации бизнеса, со своим языком программирования"
                    >
                        1С
                    </PopoverTrigger>
                    . Я в нём ни черта. Ушёл (выгнали).
                </p>

                <span>Ещё попытки</span>
                <p>
                    Пара мест не по специальности: техподдержка и веб-дизайнер. В каждом — около
                    полугода.
                </p>

                <span>Подтянулся</span>
                <p>
                    Немного прокачал оформление страниц — ну, не бомба, но и не стыдно. Год
                    фриланса. Устал от нестабильных денег — пошёл искать найм.
                </p>

                <span>Собесы</span>
                <p>
                    Ходил, не особо успешно. Однажды сами нашли: «Будешь делать личный кабинет
                    Ростелекома» (ага, прям так и сказали). Взяли, чему я был очень рад.{' '}
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
                    <PopoverTrigger
                        id="popover-cpp"
                        content="Язык программирования общего назначения, расширение C"
                    >
                        C++
                    </PopoverTrigger>{' '}
                    — не зашёл. Диплом сделал на вебе. В магистратуре — больше кода, язык на выбор.
                    Диплом писал на{' '}
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
                <p>
                    Последние 5,5 лет развиваю личный кабинет. За это время вырос от выполнения
                    задач до понимания всей кухни большой компании: от аналитики и проектирования до
                    тестирования и релизов. Вижу продукт целиком и понимаю, как решения проходят
                    путь от идеи до продакшена — и где они обычно дают сбой.
                </p>
                <p>
                    Мне интересно не просто писать код, а выстраивать систему. Программист по
                    природе всё упрощает и структурирует — я делаю это осознанно. В последнее время
                    активно работаю с ИИ и автоматизацией разработки: ускоряю рутину, собираю
                    процессы в понятную логику и делаю так, чтобы меньше было магии, а больше
                    предсказуемости.
                </p>
                <span>Код должен работать. Остальное — лирика.</span>
            </ExpandableContent>
        </div>
    );
});

SectionThreeContent.displayName = 'SectionThreeContent';

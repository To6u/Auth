import { memo } from 'react';
import { PopoverTrigger } from '@/components/popover-trigger/PopoverTrigger';

export const SectionOneContent = memo(() => (
    <div className="about-section">
        <div className="about-section__content">
            <span>Откуда?</span>
            <p>
                Меня зовут Нияз. Я из{' '}
                <PopoverTrigger
                    id="popover-barda"
                    content="Село в Пермском крае, основано в 1740 году"
                >
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

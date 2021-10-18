/** Created by Andrey Gayvoronsky on 13/04/16. */

import CalendarLocale from 'rc-picker/lib/locale/ru_RU';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Выберите дату',
    yearPlaceholder: 'Выберите год',
    quarterPlaceholder: 'Выберите квартал',
    monthPlaceholder: 'Выберите месяц',
    weekPlaceholder: 'Выберите неделю',
    rangePlaceholder: ['Начальная дата', 'Конечная дата'],
    rangeYearPlaceholder: ['Начальный год', 'Год окончания'],
    rangeMonthPlaceholder: ['Начальный месяц', 'Конечный месяц'],
    rangeWeekPlaceholder: ['Начальная неделя', 'Конечная неделя'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Выберите время',
    rangePlaceholder: ['Время начала', 'Время окончания'],
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

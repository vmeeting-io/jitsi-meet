import CalendarLocale from 'rc-picker/lib/locale/ga_IE';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Roghnaigh dáta',
    yearPlaceholder: 'Roghnaigh bliain',
    quarterPlaceholder: 'Roghnaigh ráithe',
    monthPlaceholder: 'Roghnaigh mí',
    weekPlaceholder: 'Roghnaigh seachtain',
    rangePlaceholder: ['Dáta tosaigh', 'Dáta deiridh'],
    rangeYearPlaceholder: ['Tús na bliana', 'Deireadh na bliana'],
    rangeMonthPlaceholder: ['Tosaigh mhí', 'Deireadh mhí'],
    rangeWeekPlaceholder: ['Tosaigh an tseachtain', 'Deireadh na seachtaine'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Roghnaigh am',
    rangePlaceholder: ['Am tosaigh', 'Am deiridh'],
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

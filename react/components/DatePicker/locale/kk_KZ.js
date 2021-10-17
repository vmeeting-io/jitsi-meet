import CalendarLocale from 'rc-picker/lib/locale/kk_KZ';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Күнді таңдаңыз',
    yearPlaceholder: 'Жылды таңдаңыз',
    quarterPlaceholder: 'Тоқсанды таңдаңыз',
    monthPlaceholder: 'Айды таңдаңыз',
    weekPlaceholder: 'Аптаны таңдаңыз',
    rangePlaceholder: ['Бастау күні', 'Аяқталу күні'],
    rangeYearPlaceholder: ['Бастау жылы', 'Аяқталу жылы'],
    rangeMonthPlaceholder: ['Бастау айы', 'Аяқталу айы'],
    rangeWeekPlaceholder: ['Бастау апта', 'Аяқталу апта'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Уақытты таңдаңыз',
    rangePlaceholder: ['Бастау уақыты', 'Аяқталу уақыты'],
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

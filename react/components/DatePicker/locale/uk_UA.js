import CalendarLocale from 'rc-picker/lib/locale/uk_UA';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Оберіть дату',
    rangePlaceholder: ['Початкова дата', 'Кінцева дата'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Оберіть час',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

import CalendarLocale from 'rc-picker/lib/locale/de_DE';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Datum auswählen',
    rangePlaceholder: ['Startdatum', 'Enddatum'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Zeit auswählen',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/issues/424

export default locale;

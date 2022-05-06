import CalendarLocale from 'rc-picker/lib/locale/fi_FI';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Valitse päivä',
    rangePlaceholder: ['Alku päivä', 'Loppu päivä'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Valitse aika',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

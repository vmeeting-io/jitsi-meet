import CalendarLocale from 'rc-picker/lib/locale/pl_PL';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Wybierz datę',
    rangePlaceholder: ['Data początkowa', 'Data końcowa'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Wybierz godzinę',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

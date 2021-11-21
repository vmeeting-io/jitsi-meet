import CalendarLocale from 'rc-picker/lib/locale/cs_CZ';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Vybrat datum',
    rangePlaceholder: ['Od', 'Do'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Vybrat čas',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

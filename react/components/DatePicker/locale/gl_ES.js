import CalendarLocale from 'rc-picker/lib/locale/gl_ES';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Escolla data',
    rangePlaceholder: ['Data inicial', 'Data final'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Escolla hora',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

import CalendarLocale from 'rc-picker/lib/locale/ca_ES';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Seleccionar data',
    rangePlaceholder: ['Data inicial', 'Data final'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Seleccionar hora',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

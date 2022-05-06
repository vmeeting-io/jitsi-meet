import CalendarLocale from 'rc-picker/lib/locale/pt_BR';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Selecionar data',
    rangePlaceholder: ['Data inicial', 'Data final'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Hora',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

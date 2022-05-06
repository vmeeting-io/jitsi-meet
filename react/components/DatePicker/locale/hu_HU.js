import CalendarLocale from 'rc-picker/lib/locale/hu_HU';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Válasszon dátumot',
    rangePlaceholder: ['Kezdő dátum', 'Befejezés dátuma'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Válasszon időt',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

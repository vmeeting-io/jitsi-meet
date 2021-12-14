import CalendarLocale from 'rc-picker/lib/locale/he_IL';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'בחר תאריך',
    rangePlaceholder: ['תאריך התחלה', 'תאריך סיום'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'בחר שעה',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

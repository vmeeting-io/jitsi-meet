import CalendarLocale from 'rc-picker/lib/locale/ms_MY';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Pilih tarikh',
    rangePlaceholder: ['Tarikh mula', 'Tarikh akhir'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Sila pilih masa',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

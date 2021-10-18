import CalendarLocale from 'rc-picker/lib/locale/sr_RS';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Izaberite datum',
    rangePlaceholder: ['Početni datum', 'Krajnji datum'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Izaberite vreme',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

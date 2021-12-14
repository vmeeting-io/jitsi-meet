import CalendarLocale from 'rc-picker/lib/locale/kmr_IQ';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Dîrok hilbijêre',
    rangePlaceholder: ['Dîroka destpêkê', 'Dîroka dawîn'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Demê hilbijêre',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json
export default locale;

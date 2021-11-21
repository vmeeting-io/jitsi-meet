import CalendarLocale from 'rc-picker/lib/locale/mn_MN';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Огноо сонгох',
    rangePlaceholder: ['Эхлэх огноо', 'Дуусах огноо'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Цаг сонгох',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

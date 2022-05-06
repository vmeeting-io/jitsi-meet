import CalendarLocale from 'rc-picker/lib/locale/ja_JP';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: '日付を選択',
    rangePlaceholder: ['開始日付', '終了日付'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: '時間を選択',
    rangePlaceholder: ['開始時間', '終了時間'],
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

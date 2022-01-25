import CalendarLocale from 'rc-picker/lib/locale/ko_KR';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: '날짜 선택',
    rangePlaceholder: ['시작일', '종료일'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: '시간 선택',
    rangePlaceholder: ['시작 시간', '종료 시간'],
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

import CalendarLocale from 'rc-picker/lib/locale/vi_VN';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Chọn thời điểm',
    rangePlaceholder: ['Ngày bắt đầu', 'Ngày kết thúc'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Chọn thời gian',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

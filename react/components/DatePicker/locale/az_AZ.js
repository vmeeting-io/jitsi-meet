import CalendarLocale from 'rc-picker/lib/locale/az_AZ';

const locale = {
  lang: {
    placeholder: 'Tarix seçin',
    rangePlaceholder: ['Başlama tarixi', 'Bitmə tarixi'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Vaxtı seç',
  },
};

export default locale;

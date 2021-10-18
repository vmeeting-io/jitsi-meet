import CalendarLocale from 'rc-picker/lib/locale/sv_SE';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Välj datum',
    yearPlaceholder: 'Välj år',
    quarterPlaceholder: 'Välj kvartal',
    monthPlaceholder: 'Välj månad',
    weekPlaceholder: 'Välj vecka',
    rangePlaceholder: ['Startdatum', 'Slutdatum'],
    rangeYearPlaceholder: ['Startår', 'Slutår'],
    rangeMonthPlaceholder: ['Startmånad', 'Slutmånad'],
    rangeWeekPlaceholder: ['Startvecka', 'Slutvecka'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Välj tid',
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

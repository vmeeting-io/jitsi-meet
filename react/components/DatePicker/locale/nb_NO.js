import CalendarLocale from 'rc-picker/lib/locale/nb_NO';

// Merge into a locale object
const locale = {
  lang: {
    placeholder: 'Velg dato',
    yearPlaceholder: 'Velg år',
    quarterPlaceholder: 'Velg kvartal',
    monthPlaceholder: 'Velg måned',
    weekPlaceholder: 'Velg uke',
    rangePlaceholder: ['Startdato', 'Sluttdato'],
    rangeYearPlaceholder: ['Startår', 'Sluttår'],
    rangeMonthPlaceholder: ['Startmåned', 'Sluttmåned'],
    rangeWeekPlaceholder: ['Start uke', 'Sluttuke'],
    ...CalendarLocale,
  },
  timePickerLocale: {
    placeholder: 'Velg tid',
    rangePlaceholder: ['Starttid', 'Sluttid'],
  },
};

// All settings at:
// https://github.com/ant-design/ant-design/blob/master/components/date-picker/locale/example.json

export default locale;

import moment from 'moment'

const dateFormat = 'YY.MM.DD HH:mm:ss';
const timeFormat = 'HH:mm:ss';

export function formatDate(date) {
    return date ? moment(date).format(dateFormat) : '-';
}

export function formatTime(time) {
    return time ? moment(time).format(timeFormat) : '-';
}

export function formatDuration(duration) {
    return duration ? moment.duration(duration).humanize() : '-';
}

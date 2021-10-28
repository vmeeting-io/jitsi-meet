// @flow

import aliases from 'react-emoji-render/data/aliases';
import emojiAsciiAliases from 'react-emoji-render/data/asciiAliases';
import { getAuthUrl } from '../../api/url';
import { showToast } from '../../features/notifications';
import { i18next } from '../base/i18n';
import { getConferenceName } from '../base/conference';
import moment from 'moment';
import axios from 'axios';
import { escapeRegexp, getBaseUrl } from '../base/util';
import { sendMessage, setFileUploadedPercentageValue } from './actions.any';

/**
 * An ASCII emoticon regexp array to find and replace old-style ASCII
 * emoticons (such as :O) to new Unicode representation, so then devices
 * and browsers that support them can render these natively without
 * a 3rd party component.
 *
 * NOTE: this is currently only used on mobile, but it can be used
 * on web too once we drop support for browsers that don't support
 * unicode emoji rendering.
 */
const EMOTICON_REGEXP_ARRAY: Array<Array<Object>> = [];

(function() {
    for (const [ key, value ] of Object.entries(aliases)) {
        let escapedValues;
        const asciiEmojies = emojiAsciiAliases[key];

        // Adding ascii emoticons
        if (asciiEmojies) {
            escapedValues = asciiEmojies.map(v => escapeRegexp(v));
        } else {
            escapedValues = [];
        }

        // Adding slack-type emoji format
        escapedValues.push(escapeRegexp(`:${key}:`));

        const regexp = `\\B(${escapedValues.join('|')})\\B`;

        EMOTICON_REGEXP_ARRAY.push([ new RegExp(regexp, 'g'), value ]);
    }
})();

/**
 * Replaces ascii and other non-unicode emoticons with unicode emojis to let the emojis be rendered
 * by the platform native renderer.
 *
 * @param {string} message - The message to parse and replace.
 * @returns {string}
 */
export function replaceNonUnicodeEmojis(message: string) {
    let replacedMessage = message;

    for (const [ regexp, replaceValue ] of EMOTICON_REGEXP_ARRAY) {
        replacedMessage = replacedMessage.replace(regexp, replaceValue);
    }

    return replacedMessage;
}

/**
 * Selector for calculating the number of unread chat messages.
 *
 * @param {Object} state - The redux state.
 * @returns {number} The number of unread messages.
 */
export function getUnreadCount(state: Object) {
    const { lastReadMessage, messages } = state['features/chat'];
    const messagesCount = messages.length;

    if (!messagesCount) {
        return 0;
    }

    if (navigator.product === 'ReactNative') {
        // React native stores the messages in a reversed order.
        return messages.indexOf(lastReadMessage);
    }

    const lastReadIndex = messages.lastIndexOf(lastReadMessage);

    return messagesCount - (lastReadIndex + 1);
}

/**
 * Selector for calculating the number of unread chat messages.
 *
 * @param {Object} state - The redux state.
 * @returns {number} The number of unread messages.
 */
export function getUnreadMessagesCount(state: Object) {
    const { nbUnreadMessages } = state['features/chat'];

    return nbUnreadMessages;
}

/**
 * Get whether the chat smileys are disabled or not.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} The disabled flag.
 */
export function areSmileysDisabled(state: Object) {
    const disableChatSmileys = state['features/base/config']?.disableChatSmileys === true;

    return disableChatSmileys;
}

export async function uploadFile(file, store, fileUploadInProgress) {

    const MAX_FILE_SIZE_FOR_UPLOAD = 314572800; // 300 MB = 300 X 1024 X 1024 bytes
    const NOTIFICATION_TIMEOUT = 3000;

    // use the option fileUploadInProgress if we wish to allow only one file upload at a time
    // and unless the file is completely uploaded, new files cannot be uploaded
    if(fileUploadInProgress) {
        alert(i18next.t('fileupload.fileuploadinprogress'));
        return;
    }

    if(file.size > MAX_FILE_SIZE_FOR_UPLOAD) {
        alert(i18next.t('fileupload.maxfilesizeexceeded'));
        return;
    }

    let _apiBase = getAuthUrl(store.getState());

    const serverURL = getBaseUrl();
    const dispatch = store.dispatch;
    const formData = new FormData();

    

    const roomName =  getConferenceName(store.getState()).replace(/\s+/g, '').toLowerCase() // strip all spaces and case convert to lowercase
    
    // we use moment data to append timestamp while uploading a file
    const ts = moment().format('YYYYMMDDhhmmss');
    const extn = file.name.split('.').pop();
    const fname = file.name.split(`.${extn}`)[0];
    const fileSize = file.size;
    const fnameWithTS = fname + '_' + ts + '.' + extn;

    let config = {
        onUploadProgress: (progressEvent) => {
            let percent = Math.round( (progressEvent.loaded * 100) / progressEvent.total);

            // redux magic here
            dispatch(setFileUploadedPercentageValue(percent, fnameWithTS, fileSize));
            
        }
    }
    
    // update the formdata object
    formData.append(file.name, file);

    // name that includes the timestamp during which file was uploaded
    formData.append('filename', fnameWithTS);

    // attach the roomName to the file upload button
    formData.append('roomName', roomName);

    // code to send to vmapi
    try {
        const resp = await axios.post(`${_apiBase}/uploads`, formData, config);

        if(resp.status === 200) {
            // the URL of the server should be adjusted accordingly

            // we use encodeURIComponent to ensure that spaces and special characters in filename is well-replaced to represent a URL
            const newFileUrl = `${serverURL}download/files/${roomName}/${encodeURIComponent(resp.data.fileName)}`;

            // dispatch sendMessage action to display the URL of the uploaded file as a message
            dispatch(sendMessage(newFileUrl));

            // reset fileUploadPercentage to 0;
            // dispatch a new action for this, right now it is just resetting the original values
            dispatch(setFileUploadedPercentageValue(0, '', 0));
        }
        
    } catch(err) {
        // show a toast error message in case of file upload error
        console.log("Error is: ", err);
        showToast({
            title: i18next.t('fileupload.error'), // need to use translated strings here
            timeout: NOTIFICATION_TIMEOUT,
            icon: 'error',
            animation: false });
    }
}
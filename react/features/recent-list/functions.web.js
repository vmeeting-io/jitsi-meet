/* global interfaceConfig */

import { parseURIString, safeDecodeURIComponent } from '../base/util';


/**
 * Transforms the history list to a displayable list.
 *
 * @private
 * @param {Array<Object>} recentList - The recent list form the redux store.
 * @returns {Array<Object>}
 */
export function toDisplayableList(recentList) {
    return (
        [ ...recentList ].reverse()
            .map(item => {
                const conf = parseURIString(item.conference);
                return {
                    date: item.date,
                    duration: item.duration,
                    time: [ item.date ],
                    title: `${conf.tenant} / ${safeDecodeURIComponent(conf.room)}`,
                    url: item.conference
                };
            }));
}

/**
 * Returns <tt>true</tt> if recent list is enabled and <tt>false</tt> otherwise.
 *
 * @returns {boolean} <tt>true</tt> if recent list is enabled and <tt>false</tt>
 * otherwise.
 */
export function isRecentListEnabled() {
    return interfaceConfig.RECENT_LIST_ENABLED;
}

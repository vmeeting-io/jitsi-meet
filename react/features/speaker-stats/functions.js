import { find, max, min } from 'lodash';
import moment from 'moment';

export function getDuration(item) {
    if (!item.leaveTime || !item.joinTime) return 0;

    const t2 = item.leaveTime;
    const t1 = item.lastJoinTime || item.joinTime;

    return moment.duration(moment(t2).diff(t1)).as('milliseconds');
}

export function getOverlap(log1, log2) {
    const t2 = min([log1.leaveTime, log2.leaveTime]);
    const t1 = max([log1.joinTime, log2.joinTime]);

    // not overlapped
    if (t2 <= t1) return 0;

    return moment.duration(moment(t2).diff(t1)).as('milliseconds');
}

export function mergeStats(state) {
    const data = [];

    state.forEach(s => {
        const item = { ...s };

        item.key = item.nick;
        item.duration = getDuration(item);

        // 참석자 없으면 drop
        if (!item.stats_id) {
            return;
        }

        // 참석자 stats_id가 일치하지 않으면 걍 추가
        const found = find(data, { stats_id: item.stats_id });
        if (!found) {
            data.push(item);
            return;
        }

        // ---======>
        if (!found.leaveTime && !item.leaveTime) {
            // add log
            data.push(item);
            return;
        }

        if (!found.children) {
            found.children = [ { ...found, name: '', email: '' } ];
        }

        // --- ----
        // --=-----
        // --====--
        if (found.leaveTime && item.leaveTime) {
            // merge with before
            found.duration += item.duration;
            found.duration -= getOverlap(found, item);
            found.leaveTime = max([found.leaveTime, item.leaveTime]);
            found.nick = item.nick;
        }
        // --- ---->
        // --=----->
        else if (found.leaveTime && !item.leaveTime) {
            // merge with before
            found.lastJoinTime = item.joinTime;
            found.leaveTime = '';
            found.nick = item.nick;
        }
        // ---====-->
        else {
            // drop log
        }

        found.children.push({ ...item, name: '', email: '' });
    });

    return data;
}

/**
 * Gets whether participants in speaker stats should be ordered or not, and with what priority.
 *
 * @param {*} state - The redux state.
 * @returns {Array<string>} - The speaker stats order array or an empty array.
 */
export function getSpeakerStatsOrder(state: Object) {
    return state['features/base/config']?.speakerStatsOrder ?? [
        'role',
        'name',
        'hasLeft'
    ];
}

/**
 * Gets speaker stats.
 *
 * @param {*} state - The redux state.
 * @returns {Object} - The speaker stats.
 */
export function getSpeakerStats(state: Object) {
    return state['features/speaker-stats']?.stats ?? {};
}

/**
 * Gets speaker stats search criteria.
 *
 * @param {*} state - The redux state.
 * @returns {string} - The search criteria.
 */
export function getSearchCriteria(state: Object) {
    return state['features/speaker-stats']?.criteria ?? '';
}

/**
 * Gets if speaker stats reorder is pending.
 *
 * @param {*} state - The redux state.
 * @returns {boolean} - The pending reorder flag.
 */
export function getPendingReorder(state: Object) {
    return state['features/speaker-stats']?.pendingReorder ?? false;
}

/**
 * Get sorted speaker stats based on a configuration setting.
 *
 * @param {Object} state - The redux state.
 * @param {Object} stats - The current speaker stats.
 * @returns {Object} - Ordered speaker stats.
 * @public
 */
export function getSortedSpeakerStats(state: Object, stats: Object) {
    const orderConfig = getSpeakerStatsOrder(state);

    if (orderConfig) {
        const enhancedStats = getEnhancedStatsForOrdering(state, stats, orderConfig);
        const sortedStats = objectSort(enhancedStats, (currentParticipant, nextParticipant) => {
            if (orderConfig.includes('hasLeft')) {
                if (nextParticipant.hasLeft() && !currentParticipant.hasLeft()) {
                    return -1;
                } else if (currentParticipant.hasLeft() && !nextParticipant.hasLeft()) {
                    return 1;
                }
            }

            let result;

            for (const sortCriteria of orderConfig) {
                switch (sortCriteria) {
                case 'role':
                    if (!nextParticipant.isModerator && currentParticipant.isModerator) {
                        result = -1;
                    } else if (!currentParticipant.isModerator && nextParticipant.isModerator) {
                        result = 1;
                    } else {
                        result = 0;
                    }
                    break;
                case 'name':
                    result = (currentParticipant.displayName || '').localeCompare(
                        nextParticipant.displayName || ''
                    );
                    break;
                }

                if (result !== 0) {
                    break;
                }
            }

            return result;
        });

        return sortedStats;
    }
}

/**
 * Enhance speaker stats to include data needed for ordering.
 *
 * @param {Object} state - The redux state.
 * @param {Object} stats - Speaker stats.
 * @param {Array<string>} orderConfig - Ordering configuration.
 * @returns {Object} - Enhanced speaker stats.
 * @public
 */
function getEnhancedStatsForOrdering(state, stats, orderConfig) {
    if (!orderConfig) {
        return stats;
    }

    for (const id in stats) {
        if (stats[id].hasOwnProperty('_hasLeft') && !stats[id].hasLeft()) {
            if (orderConfig.includes('name')) {
                const localParticipant = getLocalParticipant(state);

                if (stats[id].isLocalStats()) {
                    stats[id].setDisplayName(localParticipant.name);
                }
            }

            if (orderConfig.includes('role')) {
                const participant = getParticipantById(state, stats[id].getUserId());

                stats[id].isModerator = participant && participant.role === PARTICIPANT_ROLE.MODERATOR;
            }
        }
    }

    return stats;
}

/**
 * Filter stats by search criteria.
 *
 * @param {Object} state - The redux state.
 * @param {Object | undefined} stats - The unfiltered stats.
 *
 * @returns {Object} - Filtered speaker stats.
 * @public
 */
export function filterBySearchCriteria(state: Object, stats: ?Object) {
    const filteredStats = _.cloneDeep(stats ?? getSpeakerStats(state));
    const criteria = getSearchCriteria(state);

    if (criteria) {
        const searchRegex = new RegExp(criteria, 'gi');

        for (const id in filteredStats) {
            if (filteredStats[id].hasOwnProperty('_isLocalStats')) {
                const name = filteredStats[id].getDisplayName();

                if (!name || !name.match(searchRegex)) {
                    filteredStats[id].hidden = true;
                }
            }
        }
    }

    return filteredStats;
}

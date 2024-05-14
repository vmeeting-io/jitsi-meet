import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { createPollEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { getParticipantById, getParticipantDisplayName } from '../../base/participants/functions';
import { useBoundSelector } from '../../base/util/hooks';
import { setVoteChanging } from '../actions';
import { getPoll } from '../functions';


/**
 * Higher Order Component taking in a concrete PollResult component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.AbstractComponent} Component - The concrete component.
 * @returns {React.AbstractComponent}
 */
const AbstractPollResults = (Component) => (props) => {
    const { pollId } = props;

    const pollDetails = useSelector(getPoll(pollId));
    const participant = useBoundSelector(getParticipantById, pollDetails.senderId);

    const [ showDetails, setShowDetails ] = useState(false);
    const toggleIsDetailed = useCallback(() => {
        sendAnalytics(createPollEvent('vote.detailsViewed'));
        setShowDetails(details => !details);
    }, []);

    const answers = useMemo(() => {
        const voterSet = new Set();

        // Getting every voters ID that participates to the poll
        for (const answer of pollDetails.answers) {
            for (const [ voterId ] of answer.voters) {
                voterSet.add(voterId);
            }
        }

        const totalVotes = pollDetails.answers.reduce((sum, { voters: { size } }) => sum + size, 0);

        return pollDetails.answers.map(answer => {
            const percentage = totalVotes === 0 ? 0 : Math.round(answer.voters.size / totalVotes * 100);

            let voters = null;

            if (showDetails) {
                voters = [ ...answer.voters ].map(([ id, name ]) => {
                    return {
                        id,
                        name
                    };
                });
            }

            return {
                name: answer.name,
                percentage,
                voters,
                voterCount: answer.voters.size
            };
        });
    }, [ pollDetails.answers, showDetails ]);

    const dispatch = useDispatch();
    const changeVote = useCallback(() => {
        dispatch(setVoteChanging(pollId, true));
        sendAnalytics(createPollEvent('vote.changed'));
    }, [ dispatch, pollId ]);

    const { t } = useTranslation();

    return (
        <Component
            answers = { answers }
            changeVote = { changeVote }
            creatorName = { participant ? participant.name : '' }
            haveVoted = { pollDetails.lastVote !== null }
            question = { pollDetails.question }
            showDetails = { showDetails }
            t = { t }
            toggleIsDetailed = { toggleIsDetailed } />
    );
};

export default AbstractPollResults;

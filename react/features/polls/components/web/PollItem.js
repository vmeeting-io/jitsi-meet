import React from 'react';
import { useSelector } from 'react-redux';

import { shouldShowResults } from '../../functions';

import PollAnswer from './PollAnswer';
import PollResults from './PollResults';


const PollItem = React.forwardRef(({ pollId }, ref) => {
    const showResults = useSelector(shouldShowResults(pollId));

    return (
        <div ref = { ref }>
            { showResults
                ? <PollResults
                    key = { pollId }
                    pollId = { pollId } />
                : <PollAnswer
                    pollId = { pollId } />
            }

        </div>
    );
});

export default PollItem;

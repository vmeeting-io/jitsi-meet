import React from 'react';
import { useSelector } from 'react-redux';

function TimerOffGif() {
    const isChatOpen = useSelector(state => state['features/chat'].isOpen);

    return (
        <div className='new-toolbox visible'>
            <div
                className={`timer-off-gif reaction-emoji${isChatOpen ? ' shift-right' : ''}`}
                id='timer-off-gif'>
                <img src='/static/clock-buzz.gif' />
            </div>
        </div>
    );
};

export default TimerOffGif;

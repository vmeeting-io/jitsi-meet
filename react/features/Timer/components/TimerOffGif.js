import React from 'react';

const TimerOffGif = () => (
    <div className='new-toolbox visible'>
        <div
            className={`reaction-emoji${false ? ' shift-right' : ''}`}
            id='timer-off-gif'>
            <img src='/static/clock-buzz.gif' />
        </div>
    </div>
);

export default TimerOffGif;

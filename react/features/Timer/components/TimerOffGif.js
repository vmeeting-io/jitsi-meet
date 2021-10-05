import React from 'react';
export const TimerOffGif = () => {

    return (
        <div className='new-toolbox visible'>
                <div
                    className={`reaction-emoji${false ? ' shift-right' : ''}`}
                    id='timer-off-gif'>
                    <img src='/static/clock-buzz.gif' />
                </div>
        </div>
    )
}
// @flow

import React, { Component } from 'react';

/**
 * Abstract class to encapsulate the platform common code of the {@code BirthdayApprove}.
 */
class BirthdayApproveDialog extends Component {
    constructor(props){
        super(props);
    }

    render(){
        return (
            <div id="notification-participant-list">
                <div className="knocking-participant-list">
                    <div className="title">Wear AR Birthday hat</div>
                    <ul className="knocking-participants-container">
                        <li className="knocking-participant">
                            <button className="reject" onClick={this.props.onReject}>Reject</button>
                            <button className="accept" onClick={this.props.onApprove}>Approve</button>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}

export default BirthdayApproveDialog;
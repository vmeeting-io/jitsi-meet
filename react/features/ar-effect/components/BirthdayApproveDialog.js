// @flow

import React, { Component } from 'react';

import { translate } from '../../base/i18n';
/**
 * Abstract class to encapsulate the platform common code of the {@code BirthdayApprove}.
 */
class BirthdayApproveDialog extends Component {
    constructor(props){
        super(props);
    }

    render(){
        const { t } = this.props;
        return (
            <div id="notification-participant-list">
                <div className="knocking-participant-list">
                    <div className="title">{ t('lobby.birthdayARHat') }</div>
                    <ul className="knocking-participants-container">
                        <li className="knocking-participant">
                            <button className="accept" onClick={this.props.onApprove}> { t('lobby.birthdayARHatKeep') } </button>
                            <button className="reject" onClick={this.props.onReject}> { t('lobby.birthdayARHatReject') } </button>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}

export default translate(BirthdayApproveDialog);
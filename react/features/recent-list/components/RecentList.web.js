// @flow

import React from 'react';
import type { Dispatch } from 'redux';

import { translate } from '../../base/i18n';
import { MeetingsList } from '../../base/react';
import { connect } from '../../base/redux';
import { deleteRecentListEntry } from '../actions';
import { isRecentListEnabled, toDisplayableList } from '../functions';

import AbstractRecentList from './AbstractRecentList';

import axios from 'axios';

import Modal, { ModalTransition } from '@atlaskit/modal-dialog';

/**
 * The type of the React {@code Component} props of {@link RecentList}.
 */
type Props = {

    email: string,

    baseURL: Object,

    /**
     * Renders the list disabled.
     */
    disabled: boolean,

    /**
     * The redux store's {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * The translate function.
     */
    t: Function,

    /**
     * The recent list from the Redux store.
     */
    _recentList: Array<Object>
};

type State = {
    setting: Boolean,
    isModalOpen: boolean,
    targetEntry: Object,
    displayableList: Object,
    isFailedModalOpen: boolean
};

/**
 * The cross platform container rendering the list of the recently joined rooms.
 *
 */
class RecentList extends AbstractRecentList<Props, State> {
    _updateInterval: IntervalID;
    _getRenderListEmptyComponent: () => React$Node;
    _onPress: string => {};

    _closeModal = () => this.setState({ isModalOpen: false });
    _openModal = () => this.setState({ isModalOpen: true });
    _closeDeleteFailModal = () => this.setState({ isFailedModalOpen: false });
    _openDeleteFailModal = () => this.setState({ isFailedModalOpen: true });

    _proceedDelete = () => {
        this.setState({ isModalOpen: false });

        const title = this.state.targetEntry.title;
        const {
            email,
            baseURL
        } = this.props;

        const AUTH_API_BASE = process.env.VMEETING_API_BASE;
        const apiBaseUrl = `${baseURL.origin}${AUTH_API_BASE}`;
        
        try {
            axios.post(`${apiBaseUrl}/conferences/delete-conference-by-name`, {
                name: title,
                mail_owner: email
            }).then(resp => {
                this.props.dispatch(deleteRecentListEntry(this.state.targetEntry));
                this.setState({setting: false});
            }).catch(err => {
                console.log(err);
                //Pop-up error message and reload
                this._openDeleteFailModal();
                this.setState({setting: false});
            });
        } catch(err) {
            console.log(err);
            //Pop-up with Delete Failed Message
            this._openDeleteFailModal();
            this.setState({setting: false});
        }
    }

    /**
     * Initializes a new {@code RecentList} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            setting: false,
            isModalOpen: false,
            targetEntry: null,
            isFailedModalOpen: false
        }

        this._getRenderListEmptyComponent
            = this._getRenderListEmptyComponent.bind(this);
        this._onPress = this._onPress.bind(this);
        this._onItemDelete = this._onItemDelete.bind(this);
    }

    _onItemDelete: Object => void;

    /**
     * Deletes a recent entry.
     *
     * @param {Object} entry - The entry to be deleted.
     * @inheritdoc
     */
    _onItemDelete(entry) {
        this.props.dispatch(deleteRecentListEntry(entry));
    }

    /**
     * Implements the React Components's render method.
     *
     * @inheritdoc
     */
    render() {
        if (!isRecentListEnabled()) {
            return null;
        }
        const { t } = this.props;
        const {
            disabled,
            _recentList
        } = this.props;
        const recentList = toDisplayableList(_recentList);
        let modalOpen = this.state.isModalOpen;
        let failedModalOpen = this.state.isFailedModalOpen;
        //let set = this.state.setting;
        let set = true;

        return set? (
            <>
                <MeetingsList
                    disabled = { disabled }
                    hideURL = { true }
                    listEmptyComponent = { this._getRenderListEmptyComponent() }
                    meetings = { recentList }
                    onItemDelete = { this._onItemDelete }
                    onPress = { this._onPress } />
                <ModalTransition>
                    {modalOpen && (
                        <Modal
                            actions={[{ text: t('welcomepage.deleteElement'), onClick: this._proceedDelete }, { text: t('welcomepage.cancelDelete'), onClick: this._closeModal }]}
                            onClose={ this._closeModal }
                            heading={t('welcomepage.deleteModalHeading')}
                            appearance="warning"
                            width="small">
                            {t('welcomepage.deleteRecentListElementMessage')}
                        </Modal>)}
                </ModalTransition>
                <ModalTransition>
                    {failedModalOpen && (
                        <Modal
                            className='light-modal'
                            actions={[{ text: t('welcomepage.cancelDelete'), onClick: this._closeDeleteFailModal }]}
                            onClose={ this._closeDeleteFailModal }
                            heading={t('welcomepage.deleteFailHeading')}
                            appearance="danger"
                            width="small" >
                            {t('welcomepage.deleteFailMessage')}
                        </Modal>)}
                </ModalTransition>    
            </>
        ) : (
            <MeetingsList
                disabled = { disabled }
                hideURL = { true }
                listEmptyComponent = { this._getRenderListLoadingComponent() }
                meetings = { [] }
                t = { t }
                onDeleteFromDB = { this._onDeleteFromDB }
                // onDeleteFromRecent = { this._onDeleteFromRecent }
                onPress = { this._onPress } />
        );
    }

};

/**
 * Maps redux state to component props.
 *
 * @param {Object} state - The redux state.
 * @returns {{
 *     _defaultServerURL: string,
 *     _recentList: Array
 * }}
 */
export function _mapStateToProps(state: Object) {
    return {
        _recentList: state['features/recent-list'],
        email: state['features/base/jwt'].user? state['features/base/jwt'].user.email : null,
        baseURL: state['features/base/connection'].locationURL
    };
}

export default translate(connect(_mapStateToProps)(RecentList));

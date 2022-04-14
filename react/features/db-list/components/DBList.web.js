// @flow

import Modal, { ModalTransition } from '@atlaskit/modal-dialog';
import React from 'react';
import type { Dispatch } from 'redux';

import { translate } from '../../base/i18n';
import { MeetingsListFromDB } from '../../base/react';
import { connect } from '../../base/redux';
import { toDisplayableList } from '../functions';

import AbstractDBList from './AbstractDBList';

import axios from 'axios';


/**
 * The type of the React {@code Component} props of {@link RecentList}
 */
type Props = {

    email: string,

    baseURL: Object,

    /**
     * The redux store's {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * The translate function.
     */
    t: Function
};

type State = {
    setting: boolean,
    _dbList: Object,
    savedList: Object,
    isModalOpen: boolean,
    targetEntry: string,
    isFailedModalOpen: boolean
};

/**
 * The cross platform container rendering the list of the recently joined rooms.
 *
 */
class DBList extends AbstractDBList<Props, State> {
    _updateInterval: IntervalID;
    _getRenderListEmptyComponent: () => React$Node;
    _onPress: string => {};

    _proceedDelete = () => {this._deleteFromDB(); this.setState({ isModalOpen: false });}
    _closeModal = () => this.setState({ isModalOpen: false });
    _openModal = () => this.setState({ isModalOpen: true });

    _closeDeleteFailModal = () => this.setState({ isFailedModalOpen: false });
    _openDeleteFailModal = () => this.setState({ isFailedModalOpen: true });

    /**
     * Initializes a new {@code RecentList} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            setting: false,
            _dbList: [],
            savedList: [],
            isModalOpen: false,
            targetEntry: '',
            isFailedModalOpen: false
        }

        this._getRenderListEmptyComponent
            = this._getRenderListEmptyComponent.bind(this);
        this._onPress = this._onPress.bind(this);
        this._onItemDelete = this._onItemDelete.bind(this);
        this._updateList = this._updateList.bind(this);
        this._loadFromDB = this._loadFromDB.bind(this);
        this._deleteFromDB = this._deleteFromDB.bind(this);
    }

    _onItemDelete: Object => void;

    /**
     * Deletes a recent entry.
     *
     * @param {Object} entry - The entry to be deleted.
     * @inheritdoc
     */
    _onItemDelete(entry) {
        //console.log("onItemDeleted Called!");
        //const str = JSON.stringify(entry);
        //console.log(`Entry is ${str}`);

        this.setState({ targetEntry: entry.title });
        this._openModal();
    }

    componentDidMount(){
        this.state._dbList = [];
        this.state.savedList = [];
        this.state.setting = false;

        this._updateInterval = setInterval(this._updateList, 1000);
    }

    componentWillUnmount() {
        clearInterval(this._updateInterval);
    }
    
    /**
     * Implements the React Components's render method.
     *
     * @inheritdoc
     */
    render() {
        const
        { t,
          email
        } = this.props;
        let dbList;
        let set = this.state.setting;
        let modalOpen = this.state.isModalOpen;
        let failedModalOpen = this.state.isFailedModalOpen;

        dbList = toDisplayableList(this.state.savedList, email);

        return set? (<>
            <MeetingsListFromDB
                hideURL = { true }
                listEmptyComponent = { this._getRenderListEmptyComponent() }
                meetings = { dbList }
                t = { t }
                onItemDelete = { this._onItemDelete }
                onPress = { this._onPress } />
            <ModalTransition>
                {modalOpen && (
                <Modal
                    className='lightModal'
                    actions={[{ text: t('welcomepage.deleteElement'), onClick: this._proceedDelete }, { text: t('welcomepage.cancelDelete'), onClick: this._closeModal }]}
                    onClose={ this._closeModal }
                    heading={t('welcomepage.deleteModalHeading')}
                    appearance="warning"
                    width="small" >
                    {t('welcomepage.deleteDBListElementMessage')}
                </Modal>)}
            </ModalTransition>
            <ModalTransition>
                {failedModalOpen && (
                <Modal
                    className='lightModal'
                    actions={[{ text: t('welcomepage.cancelDelete'), onClick: this._closeDeleteFailModal }]}
                    onClose={ this._closeDeleteFailModal }
                    heading={t('welcomepage.deleteFailHeading')}
                    appearance="danger"
                    width="small" >
                    {t('welcomepage.deleteFailMessage')}
                </Modal>)}
            </ModalTransition>    
            </>
        ):
        <MeetingsListFromDB
            hideURL = { true }
            listEmptyComponent = { this._getRenderListLoadingComponent() }
            meetings = { [] }
            t = { t }
            onItemDelete = { this._onItemDelete }
            onPress = { this._onPress } />;
    }

    _updateList: () => void;
    _loadFromDB: () => void;
    _deleteFromDB: () => void;

    _updateList() {
        if (!this.state.setting) {
            this._loadFromDB();
        } else {
            const loaded = true;
            const saved = this.state.savedList;
            this.setState({ loaded, saved, saved });
        }
    }

    _loadFromDB() {
        const {
            email,
            baseURL
        } = this.props;

        const AUTH_API_BASE = window._env_.VMEETING_API_BASE;
        const apiBaseUrl = `${baseURL.origin}${AUTH_API_BASE}`;
        try {
            axios.post(`${apiBaseUrl}/conferences/get-conference-by-email`, {
                mail_owner: email
            }).then(_dbList => {
                const _dbListData = _dbList.data;
                const nextSetting = true;

                this.setState({ setting: nextSetting, _dbList: _dbListData, savedList: _dbListData });
            });
        } catch(err) {
            console.log(err);
        }
    }

    _deleteFromDB() {
        const title = this.state.targetEntry;
        const {
            email,
            baseURL
        } = this.props;

        const AUTH_API_BASE = window._env_.VMEETING_API_BASE;
        const apiBaseUrl = `${baseURL.origin}${AUTH_API_BASE}`;
        
        try {
            axios.post(`${apiBaseUrl}/conferences/delete-conference-by-name`, {
                name: title,
                mail_owner: email
            }).then(resp => {
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
}

function mapStateToProps(state) {
    return {
        email: state['features/base/jwt'].user.email,
        baseURL: state['features/base/connection'].locationURL
    };
}


export default translate(connect(mapStateToProps)(DBList));

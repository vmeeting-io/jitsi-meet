// @flow

import React, { Component } from 'react';

import { connect } from '../../../base/redux';
import { removeReaction } from '../../actions.any';
import { REACTIONS } from '../../constants';

type Props = {

    /**
     * Reaction to be displayed.
     */
    reaction: string,

    /**
     * Id of the reaction.
     */
    uid: Number,

    /**
     * Removes reaction from redux state.
     */
    removeReaction: Function,

    /**
     * Index of the reaction in the queue.
     */
    index: number
};

type State = {

    /**
     * Index of CSS animation. Number between 0-20.
     */
    index: number
}


/**
 * Used to display animated reactions.
 *
 * @returns {ReactElement}
 */
class ReactionEmoji extends Component<Props, State> {
    /**
     * Implements React Component's componentDidMount.
     *
     * @inheritdoc
     */
    componentDidMount() {
        setTimeout(() => this.props.removeReaction(this.props.uid), 5000);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { isChatOpen, reaction, uid } = this.props;

        return (
            <div
                className = { `reaction-emoji${isChatOpen ? ' shift-right' : ''}` }
                id = { uid }>
                <img src={ REACTIONS[reaction].animoji } alt='animoji' />
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated LargeVideo props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state) {
    const { isOpen: isChatOpen } = state['features/chat'];

    return {
        isChatOpen,
    };
}

const mapDispatchToProps = {
    removeReaction
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(ReactionEmoji);

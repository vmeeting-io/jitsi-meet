// @flow

import React from 'react';

import { connect } from '../../../base/redux';
import { setPagination } from '../../../video-layout';
import AbstractPageButton, {
    _abstractMapStateToProps as _mapStateToProps,
} from '../AbstractPageButton';
import PageButton from './PageButton';

class PageNextButton extends PageButton {
    className = 'next';

    /**
     * Updates the state for page next button.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props) {
        return {
            current: props._current,
            disabled: props._totalPages === props._current
        };
    }

    /**
     * Initializes a new {@code PageNextButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            current: 1,
            disabled: false
        };

        this.onChangePage = this.onChangePage.bind(this);
    }

    onChangePage = () => {
        const { current, disabled } = this.state;
        if (!disabled || this.props._totalPages > current ) {
            this.props.dispatch(setPagination({ current: current + 1 }));
        }
    }
}

export default connect(_mapStateToProps)(PageNextButton);

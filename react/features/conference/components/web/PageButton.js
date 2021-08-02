// @flow

import React, { Component } from 'react';

import { Icon, IconCaretDown, IconCaretLeft, IconCaretRight, IconCaretUp } from '../../../base/icons';

/**
 * A container to hold video status labels, including recording status and
 * current large video quality.
 *
 * @extends Component
 */
export default class PageButton extends Component {
    constructor(props) {
        super(props);
    }

    /**
     * Renders the {@code PageButton}.
     *
     * @protected
     * @returns {React$Element}
     */
    render() {
        const { _current, _shouldDisplayTileView, _totalPages } = this.props;

        let className = 'page-button';
        let icon;
        let current;

        if (_totalPages === 1 || this.state.disabled) {
            return null;
        }

        className += ` ${this.className || ''}`;
        // if (this.state.disabled) {
        //     className += ' disabled';
        // }
        if (_shouldDisplayTileView) {
            icon = this.className === 'prev' ? IconCaretLeft : IconCaretRight;
            className += ' column';
        } else {
            icon = this.className === 'prev' ? IconCaretUp : IconCaretDown;
            className += ' row';
        }
        current = this.className === 'prev' ? _current - 1 : _current + 1;

        return (
            <div
                className = { className }
                onClick = { this.onChangePage }>
                <Icon size = { 20 } src = { icon } />
                { current }/{ _totalPages }
            </div>
        );
    }
}

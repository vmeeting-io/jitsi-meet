// @flow

import React from 'react';

import { Icon, IconAngleRight, IconAngleDown } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { ColorPalette } from '../../../base/styles';
import { setPagination } from '../../../video-layout';

import { _abstractMapStateToProps as _mapStateToProps } from '../AbstractPageButton';


import PageButton from './PageButton';
import styles from './styles';

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

    onChangePage() {
        const { current, disabled } = this.state;
        if (!disabled || this.props._totalPages > current ) {
            this.props.dispatch(setPagination({ current: current + 1 }));
        }
    }

    _renderIcon() {
        const { layout } = this.props;
        const style = { ...styles.pageButton };
        const icon = layout === 'horizontal' ? IconAngleRight : IconAngleDown;
        const styleOverrides = this.state.disabled
            ? { color: ColorPalette.darkGrey } : {};

        return <Icon
            src = { icon }
            style = {{
                ...style.button,
                ...style.icon,
                ...styleOverrides
            }}
        />;
    }
}

export default connect(_mapStateToProps)(PageNextButton);

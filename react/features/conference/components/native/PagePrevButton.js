// @flow

import React from 'react';
import { connect } from 'react-redux';

import { Icon, IconAngleLeft, IconAngleUp } from '../../../base/icons';
import { ColorPalette } from '../../../base/styles';
import { setPagination } from '../../../video-layout';

import { _abstractMapStateToProps as _mapStateToProps } from '../AbstractPageButton';

import PageButton from './PageButton';
import styles from './styles';

class PagePrevButton extends PageButton {
    className = 'prev';

    /**
     * Updates the state for page prev button.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props) {
        return {
            current: props._current,
            disabled: 1 === props._current
        };
    }

    onChangePage() {
        const { current, disabled } = this.state;
        if (!disabled && 1 < current ) {
            this.props.dispatch(setPagination({ current: current - 1 }));
        }
    }

    _renderIcon() {
        const { layout } = this.props;
        const style = { ...styles.pageButton };
        const icon = layout === 'horizontal' ? IconAngleLeft : IconAngleUp;
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

export default connect(_mapStateToProps)(PagePrevButton);

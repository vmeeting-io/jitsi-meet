import React from 'react';

import AbstractButton from '../../../base/toolbox/components/AbstractButton';


/**
 * Component that renders a custom toolbox button.
 *
 * @returns {Component}
 */
class CustomOptionButton extends AbstractButton {
    iconSrc = this.props.icon;
    id = this.props.id;
    text = this.props.text;
    backgroundColor = this.props.backgroundColor;

    accessibilityLabel = this.text;

    /**
     * Custom icon component.
     *
     * @param {any} props - Icon's props.
     * @returns {img}
     */
    icon = (props: any) => (<img
        src = { this.iconSrc }
        { ...props } />);

    label = this.text;
    tooltip = this.text;
}

export default CustomOptionButton;

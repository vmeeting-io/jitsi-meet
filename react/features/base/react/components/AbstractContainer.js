import React, { Component, ComponentType, ReactNode } from 'react';

import { getFixedPlatformStyle } from '../../styles/functions';

/**
 * Abstract (base) class for container of React {@link Component} children with
 * a style.
 *
 * @augments Component
 */
export default class AbstractContainer extends Component {
    /**
     * Renders this {@code AbstractContainer} as a React {@code Component} of a
     * specific type.
     *
     * @param {string|ReactClass} type - The type of the React {@code Component}
     * which is to be rendered.
     * @param {Object|undefined} props - The read-only React {@code Component}
     * properties, if any, to render. If undefined, the props of this instance
     * will be rendered.
     * @protected
     * @returns {ReactElement}
     */
    _render(type, props) {
        const {
            children,
            style,

            /* eslint-disable @typescript-eslint/no-unused-vars */

            // The following properties are defined for the benefit of
            // AbstractContainer and its extenders so they are to not be
            // propagated.
            touchFeedback,
            visible,

            /* eslint-enable @typescript-eslint/no-unused-vars */

            ...filteredProps
        } = props || this.props;

        const _style = getFixedPlatformStyle(style);

        return React.createElement(type, {
            style: _style,
            ...filteredProps
        }, children);
    }
}

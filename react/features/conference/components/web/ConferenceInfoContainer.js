import React from 'react';

import { isAlwaysOnTitleBarEmpty } from '../functions.web';

export default ({ visible, children, id }) => (
    <div
        className = { `subject${isAlwaysOnTitleBarEmpty() ? '' : ' with-always-on'}${visible ? ' visible' : ''}` }
        id = { id }>
        <div className = { 'subject-info-container' }>
            {children}
        </div>
    </div>
);

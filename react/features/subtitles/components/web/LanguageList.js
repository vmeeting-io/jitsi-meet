import React from 'react';
import { makeStyles } from 'tss-react/mui';


import LanguageListItem from './LanguageListItem';

/**
 * Component that renders the security options dialog.
 *
 * @returns {React$Element<any>}
 */
const LanguageList = ({
    items,
    onLanguageSelected
}) => {
    const { classes: styles } = useStyles();
    const listItems = items.map(item => (
        <LanguageListItem
            key = { item.id }
            lang = { item.lang }
            onLanguageSelected = { onLanguageSelected }
            selected = { item.selected } />
    ));

    return (
        <div className = { styles.itemsContainer }>{listItems}</div>
    );
};

export default LanguageList;

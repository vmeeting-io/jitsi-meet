import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { openDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { IconCloudUpload } from '../../../base/icons/svg';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import SalesforceLinkDialog from '../../../salesforce/components/web/SalesforceLinkDialog';
import { isSalesforceEnabled } from '../../../salesforce/functions';

/**
 * Implementation of a button for opening the Salesforce link dialog.
 */
class LinkToSalesforce extends AbstractButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.linkToSalesforce';
    icon = IconCloudUpload;
    label = 'toolbar.linkToSalesforce';
    tooltip = 'toolbar.linkToSalesforce';

    /**
     * Handles clicking / pressing the button, and opens the Salesforce link dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('link.to.salesforce'));
        dispatch(openDialog(SalesforceLinkDialog));
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const mapStateToProps = (state) => {
    return {
        visible: isSalesforceEnabled(state)
    };
};

export default translate(connect(mapStateToProps)(LinkToSalesforce));

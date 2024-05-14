// @flow

import { connect } from 'react-redux';
import { translate } from '../../../i18n';
import { _abstractMapStateToProps } from '../../functions';

import { type Props as BaseProps } from './BaseDialog';
import BaseSubmitDialog from './BaseSubmitDialog';

import { BackHandler } from "react-native";
import { hideDialog } from '../../actions';

type Props = BaseProps & {
    t: Function
}

/**
 * Implements a submit dialog component that can have free content.
 */
class CustomSubmitDialog extends BaseSubmitDialog<Props, *> {
    /**
     * Implements {@code BaseSubmitDialog._renderSubmittable}.
     *
     * @inheritdoc
     */
    _renderSubmittable() {
        return this.props.children;
    }

    backAction = () => {
        return this.props.dispatch(hideDialog());
    };
    
    componentDidMount() {
        this.backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            this.backAction
        );
    }

    componentWillUnmount() {
        this.backHandler.remove();
    }
}

export default translate(
    connect(_abstractMapStateToProps)(CustomSubmitDialog));

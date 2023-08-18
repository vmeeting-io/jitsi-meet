import * as React from 'react';
import classNames from 'classnames';
import { omit } from 'lodash';
import {
    Icon,
    IconCloseCircle,
    IconCloseX,
    IconCheck,
    IconCheckSolid
} from '../../features/base/icons';
import Line from './Line';
import Circle from './Circle';
import Steps from './Steps';
import { validProgress, getSuccessPercent } from './utils';

const ProgressStatuses = ['normal', 'exception', 'active', 'success'];

export default class Progress extends React.Component {
  static defaultProps = {
    type: 'line',
    percent: 0,
    showInfo: true,
    // null for different theme definition
    trailColor: null,
    size: 'default',
    gapDegree: undefined,
    strokeLinecap: 'round',
  };

  getPercentNumber() {
    const { percent = 0 } = this.props;
    const successPercent = getSuccessPercent(this.props);
    return parseInt(
      successPercent !== undefined ? successPercent.toString() : percent.toString(),
      10,
    );
  }

  getProgressStatus() {
    const { status } = this.props;
    if (ProgressStatuses.indexOf(status) < 0 && this.getPercentNumber() >= 100) {
      return 'success';
    }
    return status || 'normal';
  }

  renderProcessInfo(prefixCls, progressStatus) {
    const { showInfo, format, type, percent } = this.props;
    const successPercent = getSuccessPercent(this.props);
    if (!showInfo) {
      return null;
    }
    let text;
    const textFormatter = format || (percentNumber => `${percentNumber}%`);
    const isLineType = type === 'line';
    if (format || (progressStatus !== 'exception' && progressStatus !== 'success')) {
      text = textFormatter(validProgress(percent), validProgress(successPercent));
    } else if (progressStatus === 'exception') {
      text = <Icon src = { isLineType ? IconCloseCircle : IconCloseX } />;
    } else if (progressStatus === 'success') {
      text = <Icon src = { isLineType ? IconCheckSolid : IconCheck } />;
    }
    return (
      <span className={`${prefixCls}-text`} title={typeof text === 'string' ? text : undefined}>
        {text}
      </span>
    );
  }

  renderProgress = ({ direction }) => {
    const { props } = this;
    const {
      className,
      size,
      type,
      steps,
      showInfo,
      strokeColor,
      ...restProps
    } = props;
    const prefixCls = 'progress';
    const progressStatus = this.getProgressStatus();
    const progressInfo = this.renderProcessInfo(prefixCls, progressStatus);

    let progress;
    // Render progress shape
    if (type === 'line') {
      progress = steps ? (
        <Steps
          {...this.props}
          strokeColor={typeof strokeColor === 'string' ? strokeColor : undefined}
          prefixCls={prefixCls}
          steps={steps}
        >
          {progressInfo}
        </Steps>
      ) : (
        <Line {...this.props} prefixCls={prefixCls} direction={direction}>
          {progressInfo}
        </Line>
      );
    } else if (type === 'circle' || type === 'dashboard') {
      progress = (
        <Circle {...this.props} prefixCls={prefixCls} progressStatus={progressStatus}>
          {progressInfo}
        </Circle>
      );
    }

    const classString = classNames(
      prefixCls,
      {
        [`${prefixCls}-${(type === 'dashboard' && 'circle') || (steps && 'steps') || type}`]: true,
        [`${prefixCls}-status-${progressStatus}`]: true,
        [`${prefixCls}-show-info`]: showInfo,
        [`${prefixCls}-${size}`]: size,
        [`${prefixCls}-rtl`]: direction === 'rtl',
      },
      className,
    );

    return (
      <div
        {...omit(restProps, [
          'status',
          'format',
          'trailColor',
          'strokeWidth',
          'width',
          'gapDegree',
          'gapPosition',
          'strokeLinecap',
          'percent',
          'success',
          'successPercent',
        ])}
        className={classString}
      >
        {progress}
      </div>
    );
  };

  render() {
    return this.renderProgress({});
  }
}

import * as React from 'react';
import classNames from 'classnames';

const Steps = props => {
  const {
    size,
    steps,
    percent = 0,
    strokeWidth = 8,
    strokeColor,
    trailColor,
    children,
  } = props;
  const current = Math.round(steps * (percent / 100));
  const stepWidth = size === 'small' ? 2 : 14;
  const styledSteps = [];
  for (let i = 0; i < steps; i += 1) {
    styledSteps.push(
      <div
        key={i}
        className={classNames(`progress-steps-item`, {
          [`progress-steps-item-active`]: i <= current - 1,
        })}
        style={{
          backgroundColor: i <= current - 1 ? strokeColor : trailColor,
          width: stepWidth,
          height: strokeWidth,
        }}
      />,
    );
  }
  return (
    <div className={`progress-steps-outer`}>
      {styledSteps}
      {children}
    </div>
  );
};

export default Steps;

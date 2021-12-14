import * as React from 'react';
import classNames from 'classnames';
import { RangePicker as RCRangePicker } from 'rc-picker';

import {
  Icon,
  IconCalendarOutlined,
  IconClockOutlined,
  IconCloseCircleFilled,
  IconLongArrowRight
} from '../../../features/base/icons';
import enUS from '../locale/en_US';
import { getRangePlaceholder } from '../util';
import { getTimeProps, Components } from '.';

export default function generateRangePicker(generateConfig) {
  class RangePicker extends React.Component {
    pickerRef = React.createRef();

    focus = () => {
      if (this.pickerRef.current) {
        this.pickerRef.current.focus();
      }
    };

    blur = () => {
      if (this.pickerRef.current) {
        this.pickerRef.current.blur();
      }
    };

    getDefaultLocale = () => {
      const { locale } = this.props;
      const result = {
        ...enUS,
        ...locale,
      };
      result.lang = {
        ...result.lang,
        ...(locale || {}).lang,
      };
      return result;
    };

    renderPicker = locale => {
      const {
        className,
        bordered = true,
        placeholder,
        ...restProps
      } = this.props;
      const { format, showTime, picker } = this.props;
      const prefixCls = 'picker';

      let additionalOverrideProps = {};

      additionalOverrideProps = {
        ...additionalOverrideProps,
        ...(showTime ? getTimeProps({ format, picker, ...showTime }) : {}),
        ...(picker === 'time' ? getTimeProps({ format, ...this.props, picker }) : {}),
      };
      const rootPrefixCls = 'root-picker';
      const mergedSize = 'default';

      return (
        <RCRangePicker
          separator={
            <span aria-label="to" className={`${prefixCls}-separator`}>
              <Icon size = { 14 } src = { IconLongArrowRight } />
            </span>
          }
          ref={this.pickerRef}
          placeholder={getRangePlaceholder(picker, locale, placeholder)}
          suffixIcon={<Icon size = { 14 } src = { picker === 'time' ? IconClockOutlined : IconCalendarOutlined } />}
          clearIcon={<Icon size = { 14 } src = { IconCloseCircleFilled } />}
          allowClear
          transitionName={`${rootPrefixCls}-slide-up`}
          {...restProps}
          {...additionalOverrideProps}
          className={classNames(
            {
              [`${prefixCls}-${mergedSize}`]: mergedSize,
              [`${prefixCls}-borderless`]: !bordered,
            },
            className,
          )}
          locale={locale?.lang}
          prefixCls={prefixCls}
          generateConfig={generateConfig}
          prevIcon={<span className={`${prefixCls}-prev-icon`} />}
          nextIcon={<span className={`${prefixCls}-next-icon`} />}
          superPrevIcon={<span className={`${prefixCls}-super-prev-icon`} />}
          superNextIcon={<span className={`${prefixCls}-super-next-icon`} />}
          components={Components}
        />
      );
    };

    render() {
      return this.renderPicker(this.getDefaultLocale());
    }
  }

  return RangePicker;
}

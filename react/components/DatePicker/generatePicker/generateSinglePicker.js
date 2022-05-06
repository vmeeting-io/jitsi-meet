import * as React from 'react';
import classNames from 'classnames';
import RCPicker from 'rc-picker';

import {
  Icon,
  IconCalendarOutlined,
  IconClockOutlined,
  IconCloseCircleFilled
} from '../../../features/base/icons';
import enUS from '../locale/en_US';
import { getPlaceholder } from '../util';
import {
  getTimeProps,
  Components,
} from '.';

export default function generatePicker(generateConfig) {
  function getPicker(picker, displayName) {
    class Picker extends React.Component {
      static displayName;

      constructor(props) {
        super(props);

        this.pickerRef = React.createRef();
      }

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
        const { format, showTime } = this.props;
        const prefixCls = 'picker';

        const additionalProps = {
          showToday: true,
        };

        let additionalOverrideProps = {};
        if (picker) {
          additionalOverrideProps.picker = picker;
        }
        const mergedPicker = picker || this.props.picker;

        additionalOverrideProps = {
          ...additionalOverrideProps,
          ...(showTime ? getTimeProps({ format, picker: mergedPicker, ...showTime }) : {}),
          ...(mergedPicker === 'time'
            ? getTimeProps({ format, ...this.props, picker: mergedPicker })
            : {}),
        };
        const rootPrefixCls = 'picker';
        const mergedSize = 'default';

        return (
          <RCPicker
            ref={this.pickerRef}
            placeholder={getPlaceholder(mergedPicker, locale, placeholder)}
            suffixIcon={
              <Icon size = { 14 } src = { mergedPicker === 'time' ? IconClockOutlined : IconCalendarOutlined } />
            }
            clearIcon={<Icon size = { 14 } src = { IconCloseCircleFilled } />}
            allowClear
            transitionName={`${rootPrefixCls}-slide-up`}
            {...additionalProps}
            {...restProps}
            {...additionalOverrideProps}
            locale={locale?.lang}
            className={classNames(
              {
                [`${prefixCls}-${mergedSize}`]: mergedSize,
                [`${prefixCls}-borderless`]: !bordered,
              },
              className,
            )}
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

    if (displayName) {
      Picker.displayName = displayName;
    }

    return Picker;
  }

  const DatePicker = getPicker();
  const WeekPicker = getPicker('week', 'WeekPicker');
  const MonthPicker = getPicker('month', 'MonthPicker');
  const YearPicker = getPicker('year', 'YearPicker');
  const TimePicker = getPicker('time', 'TimePicker');
  const QuarterPicker = getPicker(
    'quarter',
    'QuarterPicker',
  );

  return { DatePicker, WeekPicker, MonthPicker, YearPicker, TimePicker, QuarterPicker };
}

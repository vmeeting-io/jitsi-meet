import * as React from 'react';

import { BUTTON_TYPES } from '../../features/base/ui/constants.any';
import Button from '../../features/base/ui/components/web/Button';

export default function PickerButton(props) {
  return (
    <Button
      type = { BUTTON_TYPES.PRIMARY }
      {...props} />);
}

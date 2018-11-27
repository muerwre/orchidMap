import React from 'react';

import { MODES } from '$constants/modes';
import { editor } from '$modules/Editor';
import { Icon } from '$components/panels/Icon';

type Props = {
  stopEditing: Function,
  setMode: Function,
  setEditing: Function,
};

export class CancelDialog extends React.Component<Props, void> {
  cancel = () => {
    this.props.stopEditing();
    // editor.cancelEditing();
    // this.props.setEditing(false);
    // this.props.setMode(MODES.NONE);
  };

  proceed = () => {
    this.props.setMode(MODES.NONE);
  };

  render() {
    return (
      <div className="helper cancel-helper">
        <div className="helper__text danger">
          <Icon icon="icon-cancel-1" />
          <div className="big upper">Закрыть редактор?</div>
        </div>
        <div className="helper__buttons">
          <div className="button router-helper__button" onClick={this.cancel}>
            Удалить измения
          </div>

          <div className="button primary router-helper__button" onClick={this.proceed}>
            Вернуться
          </div>
        </div>
      </div>
    );
  }
}

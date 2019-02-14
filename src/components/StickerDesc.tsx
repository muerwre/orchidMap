import * as React from 'react';
import classnames from 'classnames';

interface Props {
  value: string;
  onChange: EventHandlerNonNull;
}

type State = {
  text: String;
}

export class StickerDesc extends React.PureComponent<Props, State> {
  state = {
    text: this.props.value,
  };

  setText = e => {
    this.setState({ text: e.target.value });
    this.props.onChange(e.target.value);
  };

  blockMouse = e => e.stopPropagation(); // todo: pass here locker for moving markers from Sticker.js

  render() {
    const { text } = this.state;

    return (
      <div
        className={classnames('sticker-desc', { is_empty: !text.trim() })}
        onMouseDown={this.blockMouse}
        onMouseUp={this.blockMouse}
      >
        <div className="sticker-desc-sizer">
          <span
            dangerouslySetInnerHTML={{
              __html: (text.replace(/\n$/, '\n&nbsp;').replace(/\n/g, '<br />') || '&nbsp;')
            }}
          />
          <textarea
            onChange={this.setText}
            value={text}
            onMouseDown={this.blockMouse}
            onDragStart={this.blockMouse}
          />
        </div>
      </div>
    )
  }
}
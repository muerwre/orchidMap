import * as React from 'react';
import { Icon } from '$components/panels/Icon';
import { IModes, MODES } from '$constants/modes';
import { IStickerPack, STICKERS } from '$constants/stickers';
import { StickerIcon } from '$components/StickerIcon';

interface Props {
  mode: keyof IModes,
  sticker: string,
  set: keyof IStickerPack,
}

export class Cursor extends React.PureComponent<Props, {}> {
  componentDidMount() {
    window.addEventListener('mousemove', this.moveCursor);
  }

  moveCursor = e => {
    if (!e.clientX || !e.clientY) return;

    const { clientX, clientY } = e;

    this.cursor.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
  };

  cursor: HTMLElement = null;

  render() {
    const { mode, set, sticker } = this.props;
    const activeSticker = (sticker && set && STICKERS[set] && STICKERS[set].layers[sticker]);

    return (
      <div className="cursor-tooltip" ref={el => { this.cursor = el; }}>
        { mode === MODES.ROUTER && <Icon icon="icon-router" />}
        { mode === MODES.POLY && <Icon icon="icon-poly" />}
        { mode === MODES.STICKERS && activeSticker && <StickerIcon sticker={sticker} set={set} /> }
      </div>
    );
  }
};
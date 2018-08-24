import React from 'react';

import { Editor } from '$modules/Editor';
import { EditorPanel } from '$components/panels/EditorPanel';
import { Fills } from '$components/Fills';

export class App extends React.Component {
  state = {
    mode: 'none',
    routerPoints: 0,
    totalDistance: 0,
    estimateTime: 0,
    activeSticker: null,
  };

  setMode = mode => {
    this.setState({ mode });
  };

  setRouterPoints = routerPoints => {
    this.setState({ routerPoints });
  };

  setTotalDist = totalDistance => {
    const time = (totalDistance && (totalDistance / 15)) || 0;
    const estimateTime = (time && parseFloat(time.toFixed(1)));
    this.setState({ totalDistance, estimateTime });
  };

  setActiveSticker = activeSticker => {
    this.setState({ activeSticker });
  };

  editor = new Editor({
    container: 'map',
    mode: this.state.mode,
    setMode: this.setMode,
    setRouterPoints: this.setRouterPoints,
    setTotalDist: this.setTotalDist,
    setActiveSticker: this.setActiveSticker,
  });

  render() {
    const {
      editor,
      state: {
        mode, routerPoints, totalDistance, estimateTime, activeSticker
      },
    } = this;


    return (
      <div>
        <Fills />
        <EditorPanel
          editor={editor}
          mode={mode}
          routerPoints={routerPoints}
          totalDistance={totalDistance}
          estimateTime={estimateTime}
          activeSticker={activeSticker}
        />
      </div>
    );
  }
}

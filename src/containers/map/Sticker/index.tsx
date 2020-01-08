import React from "react";
import { Map, marker, Marker } from "leaflet";
import { IStickerDump } from "~/redux/map/types";
import { STICKERS } from "~/constants/stickers";
import { StickerDesc } from "~/components/StickerDesc";
import classNames from "classnames";
import { DomMarker } from "~/utils/DomMarker";
import { createPortal } from "react-dom";

interface IProps {
  map: Map;
  sticker: IStickerDump;
  index: number;
  is_editing: boolean;

  mapSetSticker: (index: number, sticker: IStickerDump) => void;
  mapDropSticker: (index: number) => void;
}

export const getLabelDirection = (angle: number): "left" | "right" =>
  angle % Math.PI >= -(Math.PI / 2) && angle % Math.PI <= Math.PI / 2
    ? "left"
    : "right";

const getX = e =>
  e.touches && e.touches.length > 0
    ? { pageX: e.touches[0].pageX, pageY: e.touches[0].pageY }
    : { pageX: e.pageX, pageY: e.pageY };

const Sticker: React.FC<IProps> = ({
  map,
  sticker,
  index,
  mapSetSticker,
  mapDropSticker,
  is_editing
}) => {
  const [layer, setLayer] = React.useState<Marker>(null);
  const [dragging, setDragging] = React.useState(false);
  const [angle, setAngle] = React.useState(sticker.angle);

  const element = React.useMemo(() => document.createElement("div"), []);
  const stickerArrow = React.useRef(null);
  const stickerImage = React.useRef(null);

  const onChange = React.useCallback(state => mapSetSticker(index, state), [
    mapSetSticker,
    index
  ]);
  const onDelete = React.useCallback(state => mapDropSticker(index), [
    mapSetSticker,
    index
  ]);

  const onDragStart = React.useCallback(() => {
    layer.dragging.disable();
    map.dragging.disable();

    setDragging(true);
  }, [setDragging, layer, map]);

  const onDragStop = React.useCallback(() => {
    layer.dragging.enable();
    map.dragging.enable();

    setDragging(false);
    onChange({
      ...sticker,
      angle
    });
  }, [setDragging, layer, map, sticker, angle]);

  const onMoveFinished = React.useCallback(
    event => {
      const target = event.target as Marker;

      onChange({
        ...sticker,
        latlng: target.getLatLng()
      });
    },
    [onChange, sticker]
  );

  const onDrag = React.useCallback(
    event => {
      if (!element) return;

      const { x, y } = element.getBoundingClientRect() as DOMRect;
      const { pageX, pageY } = getX(event);

      setAngle(parseFloat(Math.atan2(y - pageY, x - pageX).toFixed(2)));
    },
    [element]
  );

  const onTextChange = React.useCallback(
    text =>
      onChange({
        ...sticker,
        text
      }),
    [sticker, onChange]
  );

  const direction = React.useMemo(() => getLabelDirection(angle), [angle]);

  // Updates html element accroding to current angle
  React.useEffect(() => {
    if (!stickerImage.current || !stickerArrow.current) return;

    const x = Math.cos(angle + Math.PI) * 56 - 30;
    const y = Math.sin(angle + Math.PI) * 56 - 30;

    stickerImage.current.style.left = String(6 + x);
    stickerImage.current.style.top = String(6 + y);

    stickerArrow.current.style.transform = `rotate(${angle + Math.PI}rad)`;
  }, [stickerArrow, stickerImage, angle]);

  // Attaches onMoveFinished event to item
  React.useEffect(() => {
    if (!layer) return;

    layer.addEventListener("dragend", onMoveFinished);

    return () => layer.removeEventListener("dragend", onMoveFinished);
  }, [layer, onMoveFinished]);

  // Attaches and detaches handlers when user starts dragging
  React.useEffect(() => {
    if (dragging) {
      document.addEventListener("mousemove", onDrag);
      document.addEventListener("mouseup", onDragStop);
    }

    return () => {
      document.removeEventListener("mousemove", onDrag);
      document.removeEventListener("mouseup", onDragStop);
    };
  }, [dragging, onDrag]);

  // Initial leaflet marker creation, when element (dom element div) is ready
  React.useEffect(() => {
    if (!map) return;

    const icon = new DomMarker({
      element,
      className: "sticker-container"
    });

    const item = marker(sticker.latlng, { icon, draggable: true }).addTo(map);

    setLayer(item);

    return () => {
      item.removeFrom(map);
      item.remove();
    };
  }, [element, map, sticker]);

  React.useEffect(() => {
    element.className = is_editing
      ? "sticker-container"
      : "sticker-container inactive";
  }, [element, is_editing]);

  return createPortal(
    <React.Fragment>
      <div className="sticker-arrow" ref={stickerArrow} />
      <div
        className={classNames(`sticker-label ${direction}`, {})}
        ref={stickerImage}
      >
        <StickerDesc value={sticker.text} onChange={onTextChange} />

        <div
          className="sticker-image"
          style={{
            backgroundImage: `url('${STICKERS[sticker.set].url}`,
            backgroundPosition: `${-STICKERS[sticker.set].layers[
              sticker.sticker
            ].off * 72} 50%`
          }}
          onMouseDown={onDragStart}
          onMouseUp={onDragStop}
          onTouchStart={onDragStart}
          onTouchEnd={onDragStop}
        />

        <div
          className="sticker-delete"
          onMouseDown={onDelete}
          onTouchStart={onDelete}
        />
      </div>
    </React.Fragment>,
    element
  );
};

export { Sticker };
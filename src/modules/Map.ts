import {
  Map as MapInterface,
  map,
  tileLayer,
  TileLayer,
} from 'leaflet';

import 'leaflet/dist/leaflet.css';
import { PROVIDER } from '$config/frontend';
import { DEFAULT_PROVIDER, PROVIDERS } from '$constants/providers';

export class Map {
  constructor({ container }) {
    this.map = map(container).setView([55.0153275, 82.9071235], 13);
    // todo: change coords?

    this.tileLayer = tileLayer(PROVIDER.url, {
      attribution: 'Независимое Велосообщество',
      maxNativeZoom: 18,
      maxZoom: 18,
    });

    this.tileLayer.addTo(this.map);
  }

  map: MapInterface;
  tileLayer: TileLayer;

  setProvider = (provider: string): void => {
    const { url } = (provider && PROVIDERS[provider] && PROVIDERS[provider]) || PROVIDERS[DEFAULT_PROVIDER];

    this.tileLayer.setUrl(url);
  }
}
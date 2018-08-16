import styled, { css } from 'styled-components';

const vertexMixin = css`
  .leaflet-vertex-icon, .leaflet-middle-icon {
    border-radius: 10px;
    opacity :1;
    border: none;
    width: 16px !important;
    height: 16px !important;margin-left:-8px !important;margin-top:-8px !important;
    background: transparent;
  }
  
  .leaflet-vertex-icon::after, .leaflet-middle-icon::after {
    content: ' ';
    position:absolute;top:4px;left:4px;width:8px;height:8px;
    background:white;border-radius: 8px;transform:scale(1);
    transition:transform 150ms;
  }
  
  .leaflet-vertex-icon:hover, .leaflet-middle-icon:hover {
    opacity: 1 !important;
  }
  
  .leaflet-vertex-icon:hover::after, .leaflet-middle-icon:hover::after,
  .leaflet-vertex-icon:active::after, .leaflet-middle-icon:active::after  {
    transform: scale(2);
    box-shadow: #999 0 0 5px 2px;
  }
`;

const routerMixin = css`
  .leaflet-control-container .leaflet-routing-container-hide {
      display: none;
  }
  
  .router-waypoint {
    width: 40px;
    height: 40px;        
    margin-left: -20px;
    margin-top: -20px;
    outline: none;
    z-index: 10001;
    
    ::after {
      content: ' ';
      display: block;      
      width: 20px;
      height: 20px;
      border-radius: 10px;
      box-shadow: 0 0 0 2px #4597d0;
      margin-left: 10px;
      margin-top: 10px;
    }
  }
`;

const stickers = css`
  .sticker-container {
    outline: none;
    position: relative;
    
    ::before {
      content: ' ';
      box-shadow: 0 0 10px 1px #ff3344;
      background: #ff334422;
      width: 48px;
      height: 48px;      
      left: -24px;
      top: -24px;
      position: absolute;
      border-radius: 40px;
      opacity: 0;
      transition: opacity 250ms;
    }
    
    :hover {
      .sticker-delete {      
        transform: scale(1);
        pointer-events: all;
      }
      
      ::before {
        opacity: 1;
      }
    }
    
    
  }
  
  .sticker-label {
    width: 48px;
    height: 48px;
    position: absolute;
    background: white;
    border-radius: 32px;
    left: 0;
    top: 0;
    outline: none;
    
    ::after {
      content: ' ';
      box-shadow: 0 0 0 1px #ff3344;
      width: 80px;
      height: 80px;      
      left: ${24 - 40}px;
      top: ${24 - 40}px;
      position: absolute;
      border-radius: 40px;
      pointer-events: none;
      opacity: 0;
    }
  }
  
  .sticker-arrow {    
    position: absolute;
    background: red;
    transform-origin: 0 0;
    left: 0;
    top: 0;
    
    ::after {
      content: ' ';
      background: #ff3344;
      width: 24px;
      height: 24px;
      transform-origin: 0 0;
      transform: rotate(-45deg);
      left: 0;
      top: 0;
      position: absolute;    
    }
  }
  
  .sticker-delete {
    position: absolute;
    width: 24px;
    height: 24px;
    background: red;
    border-radius: 24px;
    transition: transform 500ms;
    transform: scale(0);
    opacity: 1;
    pointer-events: none;
    
    :hover {
      transform: scale(1.2) !important;
    }
  }
`;

export const MapScreen = styled.div.attrs({ id: 'map' })`
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 1;
  left: 0;
  top: 0;
  
  ${vertexMixin}
  ${stickers}
  ${routerMixin}
`;

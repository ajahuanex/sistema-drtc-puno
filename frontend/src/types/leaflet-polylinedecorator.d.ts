import * as L from 'leaflet';

declare module 'leaflet' {
  function polylineDecorator(line: L.Polyline, options?: any): L.PolylineDecorator;

  interface PolylineDecorator extends L.FeatureGroup {
    setPaths(paths: L.Polyline | L.Polyline[]): this;
    setPatterns(patterns: any[]): this;
  }

  namespace Symbol {
    function arrowHead(options?: {
      pixelSize?: number;
      polygon?: boolean;
      pathOptions?: L.PathOptions;
      headAngle?: number;
    }): any;

    function dash(options?: {
      pixelSize?: number;
      pathOptions?: L.PathOptions;
    }): any;

    function marker(options?: {
      rotate?: boolean;
      markerOptions?: L.MarkerOptions;
    }): any;
  }
}

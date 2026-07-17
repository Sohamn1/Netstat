
declare module '*.css' {
  const content: string;
  export default content;
}

declare module 'react-simple-maps' {
  export const ComposableMap: React.FC<any>;
  export const Geographies: React.FC<any>;
  export const Geography: React.FC<any>;
  export const Marker: React.FC<any>;
  export const ZoomableGroup: React.FC<any>;
}
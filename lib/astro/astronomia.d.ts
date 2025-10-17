declare module 'astronomia' {
  export const solar: {
    apparentLongitude(jd: number): number;
  };
  
  export const moonposition: {
    position(jd: number): { lon: number; lat: number; range: number };
  };
}

export interface Coordinate {
  LOC_ID: any;
  lat: number;
  lon: number;
}

export interface Result extends Coordinate {
  OBJECTID: string;
  address1: string;
  address2: string;
  city: string;
  stateShort: string;
  zip: string;
  state: string;
  country: string;
}

export interface AddressComponent {
  types: string[];
  long_name: string;
  short_name: string;
}

export interface GeocodeResult {
  address_components: AddressComponent[];
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    location_type: string;
    viewport: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
    bounds?: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
  place_id: string;
  types: string[];
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
}

export interface GeocodeResponse {
  results: GeocodeResult[];
}
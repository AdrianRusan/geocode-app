'use server';

import axios from 'axios';
import NodeCache from 'node-cache';
import pLimit from 'p-limit'
import { Coordinate, GeocodeResponse, Result, GeocodeResult } from '@/types/types';

const apiKey = process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  throw new Error('GOOGLE_MAPS_API_KEY environment variable is missing');
}

const cache = new NodeCache({ stdTTL: 3600 });
const limit = pLimit(25);

export const fetchGeocodeData = async (lat: number, lon: number): Promise<GeocodeResponse> => {
  const cacheKey = `${lat},${lon}`;
  const cachedResult = cache.get<GeocodeResponse>(cacheKey);

  if (cachedResult) {
    return cachedResult;
  }

  try {
    const response = await axios.get<GeocodeResponse>('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { latlng: `${lat},${lon}`, key: apiKey },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Geocode API Error: ${response.data.status}`);
    }

    cache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error fetching geocode data for ${lat},${lon}: ${error.message}`);
    } else {
      console.error(`Unexpected error fetching geocode data for ${lat},${lon}: ${error}`);
    }
    throw new Error('Failed to fetch geocode data');
  }
};

export const processCoordinate = async ({ LOC_ID, lat, lon }: Coordinate): Promise<Result> => {
  const dynamicResult: Result = {
    OBJECTID: LOC_ID,
    lon,
    lat,
    address1: '',
    address2: '',
    city: '',
    stateShort: '',
    zip: '',
    state: '',
    country: '',
    LOC_ID: ''
  };

  try {
    const response = await fetchGeocodeData(lat, lon);

    if (response.results.length === 0) {
      console.warn(`No geocode results for ${lat},${lon}`);
      return dynamicResult;
    }

    response.results.forEach(result => extractAddressComponents(result, dynamicResult, lat));
  } catch (error) {
    console.error(`Error processing coordinates ${lat}, ${lon}: ${error}`);
  }

  return dynamicResult;
};

export const processCoordinatesConcurrently = async (coordinates: Coordinate[]): Promise<Result[]> => {
  const tasks = coordinates.map(coordinate => limit(() => processCoordinate(coordinate)));
  try {
    const results = await Promise.all(tasks);
    return results;
  } catch (error) {
    console.error('Error processing coordinates concurrently:', error);
    throw new Error('Failed to process coordinates');
  }
};

const extractAddressComponents = (result: GeocodeResult, dynamicResult: Result, lat: number) => {
  const typesSet = new Set(result.types);

  result.address_components.forEach(component => {
    const { types, long_name, short_name } = component;
    const componentTypesSet = new Set(types);

    try {
      if (typesSet.has('premise')) {
        if (componentTypesSet.has('premise')) {
          dynamicResult.address1 = long_name;
        }
        if (componentTypesSet.has('street_number')) {
          dynamicResult.address2 = `${long_name} `;
        }
        if (componentTypesSet.has('route')) {
          dynamicResult.address2 += long_name;
        }
        if (componentTypesSet.has('locality')) {
          dynamicResult.city = long_name;
        }
        if (componentTypesSet.has('administrative_area_level_1')) {
          dynamicResult.stateShort = short_name;
          dynamicResult.state = long_name;
        }
        if (componentTypesSet.has('postal_code')) {
          dynamicResult.zip = long_name;
        }
        if (componentTypesSet.has('country')) {
          dynamicResult.country = short_name;
        }
      }

      if (typesSet.has('route') && !dynamicResult.address2) {
        if (componentTypesSet.has('street_number')) {
          dynamicResult.address2 = `${long_name} `;
        }
        if (componentTypesSet.has('route')) {
          dynamicResult.address2 += long_name;
        }
      }

      if (typesSet.has('locality') && componentTypesSet.has('locality') && !dynamicResult.city) {
        dynamicResult.city = long_name;
      }

      if (typesSet.has('administrative_area_level_1') && componentTypesSet.has('administrative_area_level_1') && !dynamicResult.stateShort) {
        dynamicResult.stateShort = short_name;
        dynamicResult.state = long_name;
      }

      if (typesSet.has('postal_code') && componentTypesSet.has('postal_code') && !dynamicResult.zip) {
        dynamicResult.zip = long_name;
      }

      if (typesSet.has('country') && componentTypesSet.has('country') && !dynamicResult.country) {
        dynamicResult.country = short_name;
      }
    } catch (error) {
      console.error(`Error extracting address components for ${lat}: ${error}`);
    }
  });

  if (!dynamicResult.address2) {
    const firstRouteComponent = result.address_components.find(component => component.types.includes('street_number') || component.types.includes('route'));
    if (firstRouteComponent) {
      dynamicResult.address2 = firstRouteComponent.long_name;
      const routeComponent = result.address_components.find(component => component.types.includes('route'));
      if (routeComponent && firstRouteComponent.types.includes('street_number')) {
        dynamicResult.address2 = `${firstRouteComponent.long_name} ${routeComponent.long_name}`;
      }
    }
  }
};
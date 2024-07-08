import { Coordinate } from '@/types/types';
import { parse } from 'csv-parse/browser/esm';

export const parseCSV = (file: File): Promise<Coordinate[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (!event.target || typeof event.target.result !== 'string') {
        reject(new Error('Failed to read file.'));
        return;
      }

      parse(event.target.result, { columns: true }, (err, data: any[]) => {
        if (err) {
          reject(err);
        } else {
          const coordinates: Coordinate[] = data.map((row) => ({
            LOC_ID: row.LOC_ID,
            lat: parseFloat(row.lat),
            lon: parseFloat(row.lon),
          }));
          resolve(coordinates);
        }
      });
    };
    reader.onerror = () => reject(new Error('File reading failed.'));
    reader.readAsText(file);
  });
};
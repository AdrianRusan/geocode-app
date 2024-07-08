'use client';

import { useState, useCallback } from 'react';
import { CSVLink } from 'react-csv';
import { parseCSV } from '@/libs/utils';
import { Result } from '@/types/types';
import { processCoordinatesConcurrently } from '@/actions/actions';

export default function GeoCode() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) {
      setError('No file selected. Please select a file to upload.');
      return;
    }

    try {
      const coordinates = await parseCSV(file);
      const resultsData = await processCoordinatesConcurrently(coordinates);
      setResults(resultsData);
      setError(null);
    } catch (error) {
      if (error instanceof Error) {
        setError(`An error occurred while processing the file: ${error.message}`);
      } else {
        setError('An unexpected error occurred while processing the file.');
      }
      console.error(error);
    }
  }, [file]);

  const csvData = results.map(result => ({
    OBJECTID: result.OBJECTID,
    lat: result.lat,
    lon: result.lon,
    address1: result.address1,
    address2: result.address2,
    city: result.city,
    stateShort: result.stateShort,
    zip: result.zip,
    state: result.state,
    country: result.country,
  }));

  const downloadFileName = file ? `${file.name.replace('.csv', '')}-result.csv` : 'geocoding_results.csv';

  return (
    <>
      {error && <p className="text-red-400 text-center mb-4">{error}</p>}
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="block w-full mb-4 px-3 py-2 border border-gray-600 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-400"
      />
      <div className='flex justify-between items-center'>
        <button
          onClick={handleUpload}
          disabled={!file}
          className={`w-5/12 px-4 py-2 rounded-md text-white font-medium ${!file ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-400'}`}
        >
          Upload CSV
        </button>
        <div className='relative'>
          <CSVLink
            data={csvData}
            filename={downloadFileName}
            className={`w-full px-4 py-2 rounded-md text-white font-medium flex ${results.length > 0
                ? 'bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-500 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-400'
              : 'bg-gray-500 cursor-not-allowed'
              }`}
          >
            Download CSV
          </CSVLink>
          {results.length === 0 && (
            <div className="absolute inset-0 cursor-not-allowed z-10"></div>
          )}
        </div>
      </div>
    </>
  );
}
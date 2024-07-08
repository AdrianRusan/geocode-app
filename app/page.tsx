import GeoCode from "@/components/GeoCode";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-gray-100 dark:text-gray-100">
      <div className="w-full max-w-xl bg-gray-800 shadow-lg rounded-lg p-6 dark:bg-gray-800 dark:text-gray-100">
        <h1 className="text-2xl font-semibold mb-4 text-gray-100 dark:text-gray-100 text-center">Geocode Your CSV File</h1>
        <p className="text-gray-400 mb-6 text-center dark:text-gray-400">
          Upload a CSV file containing coordinates to geocode, and download the results.
        </p>
      <GeoCode />
      </div>
    </main>
  );
}

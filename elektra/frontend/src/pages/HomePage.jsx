import React, { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import InfoBoard from '../components/home/InfoBoard';
import ErrorCard from '../components/ErrorCard';
import { useApi } from '../hooks/useApi';

export default function HomePage() {
  const { call, loading, error } = useApi();
  const [userRate, setUserRate] = useState(null);
  const [allRates, setAllRates] = useState([]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const data = await call('GET', '/api/rates');
        setUserRate(data.user_rate);
        setAllRates(data.all_rates);
      } catch {
        // error stored in useApi error state
      }
    };

    fetchRates();
  }, [call]);

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <div className="flex-grow max-w-4xl mx-auto w-full pb-28">
        {error && !loading && (
          <div className="px-6 pt-6">
            <ErrorCard
              message="Could not load rates"
              hint={error}
            />
          </div>
        )}
        <InfoBoard userRate={userRate} allRates={allRates} loading={loading} />
      </div>
    </div>
  );
}

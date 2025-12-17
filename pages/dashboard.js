// pages/dashboard.jsx
import Head from 'next/head';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/providers/AuthContext';
import Link from 'next/link';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import DashboardTabs from '@/components/Dashboard/DashboardTabs';
import StreamCard from '@/components/Dashboard/StreamCard';
import CategoryCard from '@/components/Dashboard/CategoryCard';
import ScheduleRow from '@/components/Dashboard/ScheduleRow';
import AddScheduleModal from '@/components/Dashboard/AddScheduleModal';


function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-nyu-neutral-300 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gradient-to-br from-nyu-primary-600 to-nyu-secondary-700" />
      <div className="p-4">
        <div className="h-5 bg-nyu-neutral-100 rounded w-3/4 mb-2" />
        <div className="h-4 bg-nyu-neutral-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false); // fetch state
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Live');
  const [favorites, setFavorites] = useState([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const schedule = [
    {
      teams: 'NYU vs Columbia',
      time: 'Dec 15 • 5:00 PM',
      location: 'NYU Arena',
      sport: 'Basketball',
    },
  ];
  const sports = ['Basketball', 'Throwball', 'Volleyball', 'Swimming', 'Running'];
  const { isAuthenticated, loading: authLoading, user, logout, isViewer, isAdmin } = useAuth();
  const router = useRouter();

  const didFetch = useRef(false);
  // guard concurrent fetches
  const fetchInProgress = useRef(false);
  // hold AbortController to cancel on unmount / new fetch
  const abortControllerRef = useRef(null);

  const fetchChannels = useCallback(async () => {
    // Prevent overlapping fetches
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    // cancel previous if any
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch (e) { }
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/getChannels', { signal: ac.signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();

      if (data.success && Array.isArray(data.channels)) {
        const liveChannels = data.channels.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setChannels(liveChannels);
      } else {
        setChannels([]);
        setError('No channels returned by the server.');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // fetch aborted, silently ignore
      } else {
        console.error('Error fetching channels:', err);
        setError('Failed to load channels. Please try again.');
        setChannels([]);
      }
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, []);

  // Redirect logic + initial fetch control
  useEffect(() => {
    if (authLoading) return;

    // Not authenticated → home
    if (!isAuthenticated) {
      router.replace('/');
      return;
    }

    // ONLY broadcasters go to broadcast
    if (user?.role === 'broadcaster') {
      router.replace('/broadcast');
      return;
    }

    // viewers + admins stay on dashboard


    if (router.pathname === '/dashboard' && !didFetch.current) {
      didFetch.current = true;
      fetchChannels();
    }

  }, [authLoading, isAuthenticated, user?.role, router.pathname, fetchChannels]);


  // Cleanup AbortController on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch (e) { }
      }
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  // Memoize rendered channels to avoid re-renders
  const channelCards = useMemo(() => {
    if (!channels || channels.length === 0) return null;
    return channels.map((channel) => (
      <Link key={channel.id} href={`/stream?id=${channel.id}`} className="group" aria-label={`Open stream ${channel.broadcastName || channel.id}`}>
        <div className="bg-white rounded-lg shadow-sm border border-nyu-neutral-300 overflow-hidden hover:shadow-lg transition-shadow duration-200">
          <div className="aspect-video bg-gradient-to-br from-nyu-primary-600 to-nyu-secondary-700 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="mb-2">
                  <svg className="w-16 h-16 mx-auto opacity-75" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium">Live Stream</p>
              </div>
            </div>

            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-lg text-nyu-neutral-800 mb-1 group-hover:text-nyu-primary-500 transition-colors">
              {channel.broadcastName ? channel.broadcastName.replace(/-/g, ' ').replace(/_/g, ' | ') : `Stream ${channel.id.slice(0, 8)}`}
            </h3>
            <p className="text-sm text-nyu-neutral-600">
              {new Date(channel.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </Link>
    ));
  }, [channels]);

  // Loading state: show spinners or skeletons
  if (authLoading || (loading && channels.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nyu-neutral-100">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-nyu-primary-600 mb-2">Live Streams</h2>
            <p className="text-nyu-neutral-600">Select a stream to start watching</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated after auth finished, render nothing (redirect should have happened)
  if (!isAuthenticated) return null;

  return (
    <>
      <Head>
        <title>NYU Sports Live - Dashboard</title>
        <meta name="description" content="Watch live sports events on NYU Sports Live" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-nyu-neutral-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-nyu-neutral-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-nyu-primary-600">NYU Sports Live</h1>
                <p className="text-sm text-nyu-neutral-600">Welcome back, {user?.username}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button type="secondary" onClick={() => fetchChannels()} disabled={loading}>
                  {loading ? 'Refreshing…' : 'Refresh'}
                </Button>
                <Button type="secondary" onClick={handleLogout}>Sign Out</Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === 'Live' && (

            <div className="space-y-6">
              {/* Intro text */}
              <p className="text-nyu-neutral-600">
                Select a stream to start watching
              </p>

              {/* Error */}
              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Empty state */}
              {channels.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-nyu-neutral-300">
                  <p className="text-lg text-nyu-neutral-600 mb-2">
                    No live streams available
                  </p>
                  <p className="text-sm text-nyu-neutral-400">
                    Check back later for live sports events
                  </p>
                </div>
              ) : (
                /* Cards grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {channelCards}
                </div>
              )}
            </div>

          )}

          {activeTab === 'Categories' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sports.map((sport) => (
                <CategoryCard
                  key={sport}
                  sport={sport}
                  isFavorite={favorites.includes(sport)}
                  onToggle={() =>
                    setFavorites((prev) =>
                      prev.includes(sport)
                        ? prev.filter((f) => f !== sport)
                        : [...prev, sport]
                    )
                  }
                />
              ))}
            </div>
          )}

          {activeTab === 'Schedule' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-nyu-neutral-800">
                  Upcoming Matches
                </h2>

                {isAdmin && (
                  <Button
                    type="primary"
                    onClick={() => setIsScheduleModalOpen(true)}
                  >
                    + Add Schedule
                  </Button>
                )}
              </div>

              {/* Schedule List */}
              <div className="bg-white rounded-lg border border-border divide-y">
                {schedule.length === 0 ? (
                  <div className="p-6 text-center text-nyu-neutral-500">
                    No scheduled matches
                  </div>
                ) : (
                  schedule.map((match, i) => (
                    <ScheduleRow
                      key={i}
                      match={match}
                      isAdmin={isAdmin}
                      onEdit={() => console.log('Edit', match)}
                      onDelete={() => console.log('Delete', match)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'Favorites' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {favorites.map((sport) => (
                <CategoryCard
                  key={sport}
                  sport={sport}
                  isFavorite
                  onToggle={() =>
                    setFavorites((prev) => prev.filter((f) => f !== sport))
                  }
                />
              ))}
            </div>
          )}
          {isAdmin && (
            <AddScheduleModal
              isOpen={isScheduleModalOpen}
              onClose={() => setIsScheduleModalOpen(false)}
              onSave={(newMatch) => {
                console.log('New schedule:', newMatch);

                // TEMP: append locally
                // Later → POST to API + DynamoDB
                schedule.push({
                  ...newMatch,
                  time: new Date(newMatch.dateTime).toLocaleString(),
                });
              }}
            />
          )}

        </main>
      </div>
    </>
  );
}
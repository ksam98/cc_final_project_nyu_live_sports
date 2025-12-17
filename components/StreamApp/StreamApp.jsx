import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Player from '@/components/Player';
import Button from '@/components/Button';
import Chat from '@/components/Chat';

export default function StreamApp() {
  const router = useRouter();
  const { id } = router.query;

  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState(null);
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState('stats');

  // 🔹 Example metadata (later comes from DB)
  const sport = 'Basketball';
  const category = 'Men';

  const [liveScore] = useState({
    homeTeam: 'NYU',
    awayTeam: 'Opponent',
    homeScore: 72,
    awayScore: 65,
    period: 'Q4',
    time: '04:12',
  });

  // 🔹 Mock data (replace with API later)
  const teamStats = [
    { opponent: 'Columbia', date: '2024-11-12', score: '78 - 70', result: 'Win' },
    { opponent: 'Harvard', date: '2024-11-05', score: '66 - 72', result: 'Loss' },
  ];

  const schedule = [
    { opponent: 'Princeton', date: '2024-12-01', time: '7:00 PM' },
    { opponent: 'Yale', date: '2024-12-05', time: '6:30 PM' },
  ];

  const roster = [
    { name: 'John Smith', role: 'Guard' },
    { name: 'Alex Johnson', role: 'Forward' },
    { name: 'Michael Lee', role: 'Center' },
  ];

  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;
    let ws = null;
    const fetchChannels = async () => {
      try {
        const res = await fetch('/api/getChannels');
        const data = await res.json();

        if (!data.success || cancelled) return;

        setChannels(data.channels);

        if (!selectedChannel && data.channels.length > 0) {
          const found = id
            ? data.channels.find(c => c.id === id)
            : data.channels[0];
          setSelectedChannel(found || data.channels[0]);
          const channelArn = found ? found.arn : data.channels[0].arn;
          await fetchGameAndConnect(channelArn);
        }
      } catch (err) {
        console.error('Error fetching channels:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const fetchGameAndConnect = async (channelArn) => {
      try {
        const res = await fetch(`https://z1ktt0d2c9.execute-api.us-east-1.amazonaws.com/production/games/by-channel/${encodeURIComponent(channelArn)}`);
        const data = await res.json();
        setGame(data);
        ws = new WebSocket(`wss://ca6gjrueld.execute-api.us-east-1.amazonaws.com/production?gameId=${data.gameId}`);
        
        ws.onopen = () => {
          console.log('WebSocket connected for live scores');
        }
        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);

          if (msg.type === "SCORE_UPDATE") {
            setGame(prev => ({
              ...prev,
              homeScore: msg.homeScore,
              awayScore: msg.awayScore
            }));
          }
          // Handle other message types (Stream updates, )
        };
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        ws.onclose = () => {
          console.log('WebSocket disconnected');
        };
        setSocket(ws);
        // Set game data to state if needed
      } catch (err) {
        console.error('Error fetching game data:', err);
      }
    }

    fetchChannels();
    return () => { 
      cancelled = true; 
      if (ws) ws.close();
    };
  }, [router.isReady]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nyu-neutral-100">
        Loading stream…
      </div>
    );
  }

  if (!selectedChannel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nyu-neutral-100">
        <div className="text-center">
          <p className="text-2xl mb-2">No stream available</p>
          <Link href="/dashboard">
            <Button type="primary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-nyu-neutral-100">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/dashboard">
            <Button type="secondary">← Back to Dashboard</Button>
          </Link>
          <h1 className="text-xl font-bold text-nyu-primary-600">
            {selectedChannel.broadcastName}
          </h1>
          <div className="w-32" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT */}
        <div className="flex-1 overflow-y-auto">
          {/* Video */}
          <div className="bg-black p-4 flex justify-center">
            <div className="w-full max-w-5xl aspect-video rounded-lg overflow-hidden">
              <Player playbackUrl={selectedChannel.playbackUrl} />
            </div>
          </div>

          {/* Score */}
          <div className="bg-white p-6 border-t">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold mb-2 text-nyu-primary-600">
                Live Score
              </h2>

              {/* Sport + Category */}
              <p className="text-sm text-nyu-neutral-600 mb-4">
                {game && game.name ? `${game.name.split('|')[1].replace("-", "•")}` : 'Fetching sport/category...'}
              </p>

              <div className="bg-gradient-to-r from-nyu-primary-600 to-nyu-secondary-700 rounded-lg p-6 text-white">
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <div className="text-xl">{game && game.home ? game.home : 'Fetching home team...'}</div>
                    <div className="text-4xl font-bold">{game && game.homeScore ? game.homeScore : 'Fetching home score...'}</div>
                  </div>
                  <div className="text-center">
                    {/* <div>{game && game.period ? game.period : 'Fetching period...'}</div>
                    <div className="font-bold">{game && game.time ? game.time : 'Fetching time...'}</div> */}
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-xl">{game && game.away ? game.away : 'Fetching away team...'}</div>
                    <div className="text-4xl font-bold">{game && game.awayScore ? game.awayScore : 'Fetching away score...'}</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-8">
                <div className="flex gap-6 border-b">
                  {[
                    { id: 'stats', label: 'Team Statistics' },
                    { id: 'schedule', label: 'Schedule' },
                    { id: 'roster', label: 'Roster' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-2 font-medium ${
                        activeTab === tab.id
                          ? 'border-b-2 border-nyu-primary-600 text-nyu-primary-600'
                          : 'text-nyu-neutral-500'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                  {activeTab === 'stats' && (
                    <h3 className="text-nyu-primary-300 font-semibold text-lg mb-4">Coming Soon...</h3>
                    // <table className="w-full border rounded-lg overflow-hidden">
                    //   <thead className="bg-nyu-neutral-100">
                    //     <tr>
                    //       <th className="p-3 text-left">Opponent</th>
                    //       <th className="p-3">Date</th>
                    //       <th className="p-3">Score</th>
                    //       <th className="p-3">Result</th>
                    //     </tr>
                    //   </thead>
                    //   <tbody>
                    //     {teamStats.map((row, i) => (
                    //       <tr key={i} className="border-t">
                    //         <td className="p-3">{row.opponent}</td>
                    //         <td className="p-3 text-center">{row.date}</td>
                    //         <td className="p-3 text-center">{row.score}</td>
                    //         <td className="p-3 text-center">{row.result}</td>
                    //       </tr>
                    //     ))}
                    //   </tbody>
                    // </table>
                  )}

                  {activeTab === 'schedule' && (
                    <h3 className="text-nyu-primary-300 font-semibold text-lg mb-4">Coming Soon...</h3>
                    // <ul className="space-y-4">
                    //   {schedule.map((game, i) => (
                    //     <li key={i} className="bg-white border p-4 rounded-lg">
                    //       <div className="font-semibold">{game.opponent}</div>
                    //       <div className="text-sm text-nyu-neutral-600">
                    //         {game.date} • {game.time}
                    //       </div>
                    //     </li>
                    //   ))}
                    // </ul>
                  )}

                  {activeTab === 'roster' && (
                    <h3 className="text-nyu-primary-300 font-semibold text-lg mb-4">Coming Soon...</h3>
                    // <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    //   {roster.map((player, i) => (
                    //     <div
                    //       key={i}
                    //       className="bg-white border rounded-lg p-4 text-center"
                    //     >
                    //       <div className="font-bold">{player.name}</div>
                    //       <div className="text-sm text-nyu-neutral-600">
                    //         {player.role}
                    //       </div>
                    //     </div>
                    //   ))}
                    // </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CHAT */}
        <div className="w-80 bg-white border-l flex flex-col">
          <Chat channelId={selectedChannel?.id} />
        </div>
      </div>
    </div>
  );
}

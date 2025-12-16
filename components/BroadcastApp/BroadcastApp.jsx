import React, { useContext, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import ToasterBar from '@/components/ToasterBar';
import StatusBar from '@/components/StatusBar';
import StreamPreview from '@/components/StreamPreview';
import ControlBar from '@/components/ControlBar';
import { ModalContext } from '@/providers/ModalContext';
import { BroadcastContext } from '@/providers/BroadcastContext';
import Modal from '@/components/Modal';
import { UserSettingsContext } from '@/providers/UserSettingsContext';
import { BroadcastLayoutContext } from '@/providers/BroadcastLayoutContext';
import { LocalMediaContext } from '@/providers/LocalMediaContext';
import CameraCanvas from '@/components/CameraCanvas/CameraCanvas';
import { useAuth } from '@/providers/AuthContext';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import Head from 'next/head';

export default function BroadcastApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logout, user } = useAuth();

  const { toggleModal, modalProps, modalActive, modalContent } =
    useContext(ModalContext);
  const { showFullScreenCam, refreshCurrentScene } = useContext(
    BroadcastLayoutContext
  );
  const {
    isLive,
    isSupported,
    broadcastClientRef,
    createBroadcastClient,
    destroyBroadcastClient,
    broadcastClientMounted,
  } = useContext(BroadcastContext);
  const { configRef, ingestEndpoint, setIngestEndpoint, setStreamKey } =
    useContext(UserSettingsContext);
  const {
    setInitialDevices,
    localVideoDeviceId,
    localVideoStreamRef,
    canvasElemRef,
    cleanUpDevices,
    enableCanvasCamera,
    refreshSceneRef,
  } = useContext(LocalMediaContext);

  const previewRef = useRef(undefined);
  const sdkIsStarting = useRef(false);
  const [canvasWidth, setCanvasWidth] = useState();
  const [canvasHeight, setCanvasHeight] = useState();
  const [videoStream, setVideoStream] = useState();
  const [isCreating, setIsCreating] = useState(false);
  const [game, setGame] = useState(null);
  const [channelArn, setChannelArn] = useState('');
  const [description, setDescription] = useState('');
  const [playBackUrl, setPlaybackUrl] = useState('');
  /* ---------------- SCOREBOARD STATE ---------------- */
  const SPORTS = ['Basketball', 'Tennis', 'Badminton', 'Swimming'];
  const CATEGORIES = ['Men', 'Women', 'Mixed'];
  const [sport, setSport] = useState('');
  const [category, setCategory] = useState('');
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  /* ---------------- CREATE CHANNEL ---------------- */
  const handleCreateChannel = async () => {
    setIsCreating(true);
    if (!sport || !category || !team1 || !team2 || !description) {
      toast.error('Please fill in all scoreboard fields.');
      setIsCreating(false);
      return;
    }
    const name = `${team1} vs ${team2} | ${sport} - ${category}`;
    const toastId = toast.loading('Creating Channel...');
    const broadcastName = `${team1}-vs-${team2}_${sport}_${category}`;
    try {
      const res = await fetch('/api/createChannel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broadcastName }),
      });
      const data = await res.json();
      if (data.success) {
        setIngestEndpoint(data.ingestEndpoint);
        setStreamKey(data.streamKey);
        toast.success(`Channel "${data.channelName}" created!`, { id: toastId });
        console.log('Channel created:', data);
        if (data.arn){
          await handleCreateGame(data.arn, data.playbackUrl);
        }
        else{
          setIsCreating(false)
          toast.error('Channel ARN missing, cannot create game.', { id: toastId });
        }
      } else {
        toast.error('Failed to create channel: ' + data.message, { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error creating channel', { id: toastId });
      setIsCreating(false);
    } finally {
      setIsCreating(false);
    }
  };
  // ---------------- CREATE GAME ---------------- //
  const handleCreateGame = async (channelArn, playBackUrl) => {
    setIsCreating(true);
    console.log('Creating game with channel ARN:', channelArn);
    const name = `${team1} vs ${team2} | ${sport} - ${category}`;
    const toastId = toast.loading('Creating Game...');
    const jsonString = JSON.stringify({
          description: description,
          name: name,
          ivsChannelArn: channelArn,
          home: team1,
          away: team2,
          ivsPlaybackUrl: playBackUrl
        })
    try {
      const res = await fetch('https://z1ktt0d2c9.execute-api.us-east-1.amazonaws.com/production/games', {
        method: 'POST',
        body: JSON.stringify({
          body: jsonString
        }),
      });
      const data = await res.json();
      if (data.body) {
        const dataBody = JSON.parse(data.body);
        setGame(dataBody);
        toast.success(`Game created!`, { id: toastId });
      } else {
        toast.error('Failed to create game: ' + data.message, { id: toastId });
      }
      setIsCreating(false);
    } catch (err) {
      console.error(err);
      toast.error('Error creating game', { id: toastId });
      setIsCreating(false);
    }
  }
  // Update score handlers
  const updateScore = async (team) => {
    if(team !== "home" && team !== "away") return;
    const jsonObj = {
      team: team
    }
    try {
      const res = await fetch(`https://z1ktt0d2c9.execute-api.us-east-1.amazonaws.com/production/games/${game.gameId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonObj),
      });
      const data = await res.json();
      if (data.gameId) {
        setGame(data);
      } else {
        console.error('Failed to update score: ' + data.message);
      }
    } catch (err) {
      console.error('Error updating score:', err);
    }
  }

  /* ---------------- INIT BROADCAST ---------------- */
  useEffect(() => {
    if (sdkIsStarting.current) return;
    sdkIsStarting.current = true;
    setInitialDevices().then(
      ({ audioDeviceId, audioStream, videoDeviceId, videoStream }) => {
        if (!broadcastClientRef.current) {
          createBroadcastClient({
            config: configRef.current,
          })
            .then((client) => {
              const { width, height } = videoStream
                .getTracks()[0]
                .getSettings();
              refreshSceneRef.current = refreshCurrentScene;
              showFullScreenCam({
                cameraStream: enableCanvasCamera
                  ? canvasElemRef.current
                  : videoStream,
                cameraId: videoDeviceId,
                cameraIsCanvas: enableCanvasCamera,
                micStream: audioStream,
                micId: audioDeviceId,
                showMuteIcon: false,
              });
            })
            .catch((err) => {
              console.error(err);
          });
        }
      }
    );
    return () => {
      if (broadcastClientRef.current)
        destroyBroadcastClient(broadcastClientRef.current);
      cleanUpDevices();
    };
    // run once on mount
  }, []);

  useEffect(() => {
    const uidQuery = searchParams.get('uid');
    const skQuery = searchParams.get('sk');
    const channelTypeQuery = searchParams.get('channelType');

    if (uidQuery)
      setIngestEndpoint(`${uidQuery}.global-contribute.live-video.net`);
    if (skQuery) setStreamKey(skQuery);
    if (channelTypeQuery) {
      const formatted = channelType.toUpperCase();
      switch (formatted) {
        case 'BASIC':
          setChannelType('BASIC');
          break;
        case 'STANDARD':
          setChannelType('STANDARD');
        default:
          console.error(
            `Channel type must be STANDARD, BASIC. The channel type you provided is ${channelType}. The default value of BASIC has been set`
          );
          break;
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (broadcastClientMounted)
      broadcastClientRef.current.attachPreview(previewRef.current);
    return () => {
      if (broadcastClientRef.current)
        broadcastClientRef.current.detachPreview();
    };
  }, [broadcastClientMounted]);

  // React to webcam device changes if the canvas camera is enabled.
  useEffect(() => {
    if (!broadcastClientMounted || !enableCanvasCamera) return;
    const { width, height } = broadcastClientRef.current.getCanvasDimensions();
    setCanvasWidth(width);
    setCanvasHeight(height);
    setVideoStream(localVideoStreamRef.current);
  }, [localVideoDeviceId, broadcastClientMounted, enableCanvasCamera]);

  useEffect(() => {
    if (!isSupported) {
      toast.error(
        (t) => {
          return (
            <div className='flex items-center'>
              <span className='pr-4 grow'>
                This browser is not fully supported. Certain features may not
                work as expected.{' '}
                <a
                  href='https://docs.aws.amazon.com/ivs/latest/LowLatencyUserGuide/broadcast.html#broadcast-platform-requirements'
                  target='_blank'
                  rel='noreferrer noopener'
                  className='text-primaryAlt dark-theme:text-primary hover:text-primary hover:dark-theme:text-primaryAlt hover:underline underline-offset-1'
                >
                  Learn more
                </a>
              </span>
            </div>
          );
        },
        {
        id: 'BROWSER_SUPPORT',
        duration: Infinity,
      });
    }
  }, [isSupported]);

  const title = `Amazon IVS - Web Broadcast Tool - ${
    isLive ? 'LIVE' : 'Offline'
  }`;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div className="flex flex-col h-[100dvh] bg-surface">

        {/* TOP BAR */}
        <div className="w-full p-4 flex justify-between items-center border-b border-gray-700">

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              Welcome, {user?.username}
            </span>
            <Button
              type="secondary"
              onClick={async () => {
                await logout();
                router.push('/');
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>

        <ToasterBar />
        <StatusBar />

        {/* SMALLER STREAM PREVIEW */}
        <div className="w-full max-w-4xl mx-auto mt-4 aspect-video">
          <StreamPreview previewRef={previewRef} />
        </div>

        <ControlBar />

          {game ? (
            <div className="w-full max-w-4xl mx-auto mt-4 p-4 rounded-lg border border-gray-700 bg-surface flex flex-col gap-4">
              <h2 className="text-3xl font-bold" style={{color:"white"}}>{game.name || "Home vs. Away | Soccor - Male"}</h2>
              <h2 className="text-lg font-bold" style={{color:"gray"}}>{game.description || "Test Description"}</h2>
              <div className="flex justify-between items-center">
                <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{color:"white"}}>{game.home || "Test Home"}</span>
            <div className="flex justify-between items-center">
              <span className="text-4xl font-extrabold" style={{color:"white"}}>{game.homeScore || 0}</span>
              <button 
                onClick={() => updateScore("home")} 
                style={{
                  marginLeft: "10px", 
                  marginRight: "10px", 
                  padding: "5px 10px", 
                  backgroundColor: "white", 
                  borderRadius: "4px", 
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)", 
                  fontWeight: "bold", 
                  cursor: "pointer"
                }}
              >+1</button>
            </div>
                </div>
                <span className="text-3xl font-bold">vs</span>
                <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{color:"white"}}>{game.away || "Test Away"}</span>
            <div className="flex justify-between items-center">
              <span className="text-4xl font-extrabold" style={{color:"white"}}>{game.awayScore || 0}</span>
              <button 
                onClick={() => updateScore("away")} 
                style={{
                  marginLeft: "10px", 
                  marginRight: "10px", 
                  padding: "5px 10px", 
                  backgroundColor: "white", 
                  borderRadius: "4px", 
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)", 
                  fontWeight: "bold", 
                  cursor: "pointer"
                }}
              >+1</button>
            </div>
                </div>
              </div>
            </div>
          ): 
          <div className="w-full max-w-4xl mx-auto mt-4 p-4 rounded-lg border border-gray-700 bg-surface flex flex-col gap-4">

            <div className="flex gap-4">
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="p-2 rounded text-black w-1/2"
              >
                <option value="">Select Sport</option>
                {SPORTS.map((s) => (
            <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="p-2 rounded text-black w-1/2"
              >
                <option value="">Select Category</option>
                {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">

              {/* TEAM 1 */}
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Home Team Name"
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                className="p-2 rounded text-black"
              />
            </div>

            {/* TEAM 2 */}
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Away Team Name"
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
                className="p-2 rounded text-black"
              />
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <input
                type="text"
                placeholder="Game Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="p-2 rounded text-black"
              />
            </div>
            <div className="flex col-span-2 justify-center items-end">
              <button 
              onClick={handleCreateChannel}
              style={{
                marginLeft: "10px", 
                marginRight: "10px", 
                padding: "5px 10px", 
                backgroundColor: "#39e75f", 
                borderRadius: "4px", 
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)", 
                fontWeight: "bold", 
                cursor: "pointer"
              }}
              disabled={isCreating}
            > { isCreating ? "Creating..." : "Create Game!"}</button>
            </div>
          </div>
        </div>}

        {enableCanvasCamera && (
          <CameraCanvas
            width={canvasWidth}
            height={canvasHeight}
            videoStream={videoStream}
          />
        )}
      </div>

      <Modal show={modalActive} onClose={toggleModal} {...modalProps}>
        {modalContent}
      </Modal>
    </>
  );
}

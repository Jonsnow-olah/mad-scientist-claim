import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import styles from './LandingPage.module.css';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:3001';
const MUSIC_PATH = '/assets/mm1.mp3';

export default function LandingPage() {
  const audioRef = useRef(null);
  const popupRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(() => {
    return localStorage.getItem('isConnected') === 'true';
  });
  const [assignedCodes, setAssignedCodes] = useState(() => {
    const saved = localStorage.getItem('assignedCodes');
    return saved ? JSON.parse(saved) : [];
  });
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem('accessToken') || null;
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().catch(() => {
      console.warn('Autoplay was prevented by browser');
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('isConnected', isConnected);
    localStorage.setItem('assignedCodes', JSON.stringify(assignedCodes));
    localStorage.setItem('accessToken', accessToken || '');
  }, [isConnected, assignedCodes, accessToken]);

  useEffect(() => {
    function onMessage(e) {
      if (!e.origin || !e.data) return;

      if (e.data?.type === 'discord_auth') {
        const { success, discordId, discordUsername, codes, message, accessToken } = e.data;
        if (success && codes) {
          setAssignedCodes(codes.map(c => ({
            code: c.code || null,
            project: c.projectName || 'Unknown project',
            username: discordUsername || discordId,
            id: c.id // Store code ID
          })));
          setAccessToken(accessToken);
          setIsConnected(true);
          toast.success('Code(s) claimed successfully');
        } else {
          setError(message || 'No codes found');
          toast.error(message || 'No codes found');
        }
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
        setConnecting(false);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  }

  function openDiscordPopup() {
    setConnecting(true);
    setError(null);
    setAssignedCodes([]);
    const url = `${BACKEND_ORIGIN}/api/discord/start`;

    const w = 600;
    const h = 800;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    popupRef.current = window.open(
      url,
      'discord_oauth',
      `width=${w},height=${h},left=${left},top=${top}`
    );

    if (!popupRef.current) {
      setError('Popup blocked. Allow popups and try again.');
      toast.error('Popup blocked. Allow popups and try again.');
      setConnecting(false);
      return;
    }

    const popupCheck = setInterval(() => {
      if (!popupRef.current || popupRef.current.closed) {
        clearInterval(popupCheck);
        setConnecting(false);
      }
    }, 500);
  }

  async function disconnectDiscord() {
    try {
      if (accessToken) {
        const codeIds = assignedCodes.map(code => code.id).filter(id => id); // Get code IDs
        const res = await fetch(`${BACKEND_ORIGIN}/api/discord/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken, codeIds })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to revoke token');
      }
      setAssignedCodes([]);
      setIsConnected(false);
      setError(null);
      setAccessToken(null);
      localStorage.removeItem('isConnected');
      localStorage.removeItem('assignedCodes');
      localStorage.removeItem('accessToken');
      toast.success('Disconnected from Discord');
    } catch (err) {
      console.error('Disconnect Error:', err);
      setError('Failed to disconnect from Discord');
      toast.error('Failed to disconnect from Discord');
    }
  }

  return (
    <div className={styles.page}>
      <audio ref={audioRef} src={MUSIC_PATH} loop />
      <button className={styles.volumeBtn} onClick={toggleMute} aria-label="Toggle sound">
        {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
      </button>
      <div className={styles.card}>
        <h1 className={styles.title}>Mamo Claim</h1>
        <p className={styles.subtitle}>Connect your Discord account to get your codes</p>
        <div className={styles.centerArea}>
          <button
            className={styles.connectBtn}
            onClick={isConnected ? disconnectDiscord : openDiscordPopup}
            disabled={connecting}
          >
            {connecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect Discord'}
          </button>

          {error && <div className={styles.error}>{error}</div>}

          {assignedCodes.length > 0 && (
            <div className={styles.result}>
              {assignedCodes.map((item, idx) => (
                item.code ? (
                  <div key={idx} className={styles.resultBlock}>
                    <div className={styles.resultLine}>
                      Your <strong>{item.project}</strong> code is
                    </div>
                    <div className={styles.codeBox}>{item.code}</div>
                    <div className={styles.small}>
                      Assigned to {item.username}
                    </div>
                  </div>
                ) : (
                  <div key={idx} className={styles.noCode}>
                    No <strong>{item.project}</strong> assigned to {item.username}.
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
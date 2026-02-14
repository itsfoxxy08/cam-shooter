import { useEffect, useRef, useState } from 'react';

export function useAudio() {
    const shootSoundRef = useRef<HTMLAudioElement | null>(null);
    const bgMusicRef = useRef<HTMLAudioElement | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        // Create bullet shoot sound (simple beep using Web Audio API)
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Store generate function
        const generateShootSound = () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800; // High pitch
            oscillator.type = 'square';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        };

        // Store in ref for later use
        (shootSoundRef.current as any) = generateShootSound;

        // Background music - use placeholder for now
        // In production, you would load megalovania.mp3
        const bgMusic = new Audio();
        bgMusic.loop = true;
        bgMusic.volume = 0.3;
        bgMusicRef.current = bgMusic;

        return () => {
            if (bgMusicRef.current) {
                bgMusicRef.current.pause();
            }
        };
    }, []);

    const playShoot = () => {
        if (!isMuted && shootSoundRef.current) {
            (shootSoundRef.current as any)();
        }
    };

    const playBackgroundMusic = () => {
        if (!isMuted && bgMusicRef.current) {
            bgMusicRef.current.play().catch(e => console.log('Audio autoplay blocked:', e));
        }
    };

    const stopBackgroundMusic = () => {
        if (bgMusicRef.current) {
            bgMusicRef.current.pause();
            bgMusicRef.current.currentTime = 0;
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (!isMuted && bgMusicRef.current) {
            bgMusicRef.current.pause();
        } else if (isMuted && bgMusicRef.current) {
            bgMusicRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
    };

    return {
        playShoot,
        playBackgroundMusic,
        stopBackgroundMusic,
        toggleMute,
        isMuted
    };
}

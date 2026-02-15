import { useState, useEffect } from 'react';

export function useFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();

                // Lock orientation to landscape on mobile
                if (screen.orientation && screen.orientation.lock) {
                    try {
                        await screen.orientation.lock('landscape');
                        console.log('📱 Screen locked to landscape');
                    } catch (orientErr) {
                        console.log('⚠️ Could not lock orientation:', orientErr);
                    }
                }
            } else {
                // Unlock orientation when exiting fullscreen
                if (screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock();
                }
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Error toggling fullscreen:', err);
        }
    };

    return { isFullscreen, toggleFullscreen };
}

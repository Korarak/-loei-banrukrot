// lib/notificationSound.ts
// A short two-tone chime, synthesized via the Web Audio API rather than
// shipping an audio file — no binary asset, no licensing to worry about.

let audioCtx: AudioContext | null = null;

export function playNotificationSound() {
    try {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const now = audioCtx.currentTime;
        const playTone = (freq: number, start: number, duration: number) => {
            const osc = audioCtx!.createOscillator();
            const gain = audioCtx!.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + start);
            gain.gain.linearRampToValueAtTime(0.15, now + start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
            osc.connect(gain);
            gain.connect(audioCtx!.destination);
            osc.start(now + start);
            osc.stop(now + start + duration);
        };

        playTone(880, 0, 0.15);      // A5
        playTone(1174.66, 0.12, 0.2); // D6
    } catch {
        // Web Audio unavailable, or blocked by the browser's autoplay policy
        // before any user gesture — fail silently, the toast still shows.
    }
}

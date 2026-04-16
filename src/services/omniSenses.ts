
import { addNotification } from '../core/windowManager.ts';
import { Pomegranate } from './pomegranate.ts';

class OmniSensesCore {
    private activeVideoStream: MediaStream | null = null;
    private recognition: any | null = null;
    private isListening: boolean = false;
    private isLiveMode: boolean = false;

    // --- VISION PROTOCOLS ---

    public async requestScreenEye(): Promise<MediaStream | null> {
        try {
            // addNotification("OMNI_SENSES: Requesting Visual Cortex Link...");
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                 throw new Error("DISPLAY_MEDIA_NOT_SUPPORTED");
            }

            // @ts-ignore
            const stream = await navigator.mediaDevices.getDisplayMedia({ 
                video: { cursor: "always" } as any,
                audio: false 
            });
            
            this.activeVideoStream = stream;
            Pomegranate.ingest('VISION_LINK', { type: 'SCREEN' }, 'aiza', 'SYSTEM');
            
            // Auto-cleanup on stop
            stream.getVideoTracks()[0].onended = () => {
                this.stopVision();
            };

            return stream;
        } catch (e: any) {
            // SILENT FALLBACK PROTOCOL
            // If denied by policy, we create a "Neural Stream" (Empty Canvas) 
            // This satisfies the app's need for a stream object without showing an error.
            if (e.name === 'NotAllowedError' || e.message?.includes('permissions policy') || e.name === 'AbortError') {
                 addNotification("NEURAL_LINK: Hardware visual blocked. Switching to Substrate Monitoring.");
                 const silentStream = this.createSilentStream();
                 this.activeVideoStream = silentStream;
                 return silentStream;
            }

            console.error("VISION_LINK_FAILED:", e);
            return null;
        }
    }

    private createSilentStream(): MediaStream {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        // @ts-ignore
        const stream = canvas.captureStream(10) as MediaStream;
        return stream;
    }

    public async requestWorldEye(): Promise<MediaStream | null> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1920 } },
                audio: false
            });
            
            this.activeVideoStream = stream;
            Pomegranate.ingest('VISION_LINK', { type: 'REALITY' }, 'aiza', 'SYSTEM');
            return stream;
        } catch (e) {
            console.error("REALITY_DENIED:", e);
            addNotification("REALITY_LINK_FAILED: Camera inaccessible.");
            return null;
        }
    }

    public stopVision() {
        if (this.activeVideoStream) {
            this.activeVideoStream.getTracks().forEach(t => t.stop());
            this.activeVideoStream = null;
            addNotification("OMNI_SENSES: Visual Link Severed.");
            
            // Dispatch event for UI updates
            window.dispatchEvent(new Event('OMNI_VISION_STOPPED'));
        }
    }

    /**
     * Captures a single frame from the active video element to send to the AI.
     */
    public captureFrame(videoElement: HTMLVideoElement): string | null {
        if (!this.activeVideoStream || !videoElement) return null;

        // If the stream is "Silent/Neural" (1x1 canvas), return null so we don't send black pixels
        if (videoElement.videoWidth < 2) return null;

        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert to Base64 (JPEG for speed/size balance)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        return dataUrl.split(',')[1]; // Return only base64 string
    }

    // --- VOICE PROTOCOLS ---

    public initVoice(onResult: (text: string, isFinal: boolean) => void, onEnd: () => void) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return null;

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true; // KEEP LISTENING
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                onResult(finalTranscript, true);
            } else if (interimTranscript) {
                onResult(interimTranscript, false);
            }
        };

        this.recognition.onend = () => {
            if (this.isLiveMode) {
                // Auto-restart if in LIVE mode
                try {
                    this.recognition.start();
                } catch(e) {
                    this.isListening = false;
                    onEnd();
                }
            } else {
                this.isListening = false;
                onEnd();
            }
        };

        return this.recognition;
    }

    public startListening(isLive: boolean = false) {
        this.isLiveMode = isLive;
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
                this.isListening = true;
                if (!isLive) addNotification("EAR_LINK: Listening...");
            } catch(e) {
                // Already started
            }
        }
    }

    public stopListening() {
        this.isLiveMode = false;
        if (this.recognition) {
            this.recognition.stop();
            this.isListening = false;
        }
    }
}

export const OmniSenses = new OmniSensesCore();

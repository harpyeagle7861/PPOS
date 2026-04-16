
import React from 'react';
import { AppDef } from '../core/state';

const MediaPlayerComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => (
    React.createElement('div', { style: { width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        React.createElement('video', {
            controls: true,
            src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            style: { maxWidth: '100%', maxHeight: '100%' }
        }, 'Your browser does not support the video tag.')
    )
);

// Added missing category
export const mediaPlayerApp: AppDef = {
    id: 'media-player',
    name: 'Media Player',
    component: MediaPlayerComponent,
    icon: '🎬',
    category: 'Entertainment',
    defaultSize: { width: 720, height: 480 },
    description: 'Plays video files. Currently loaded with a sample video.'
};

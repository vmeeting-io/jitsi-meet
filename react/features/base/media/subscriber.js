import StateListenerRegistry from '../redux/StateListenerRegistry';

/**
 * Notifies when the local audio mute state changes.
 */
StateListenerRegistry.register(
    /* selector */ (state) => state['features/base/media'].audio.muted,
    /* listener */ (muted: boolean, store: Object, previousMuted: boolean) => {
        if (typeof APP !== 'object') {
            return;
        }

        if (muted !== previousMuted) {
            APP.API.notifyAudioMutedStatusChanged(muted);
        }
    }
);

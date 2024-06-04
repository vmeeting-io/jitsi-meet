import StateListenerRegistry from "../base/redux/StateListenerRegistry";
import { getLocalJitsiAudioTrack } from "../base/tracks/functions";
import RecordRTC from './RecordRTC';
import { updateRecorder, toggleSTT, updateRetryCheck } from "./actions";

import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { getCurrentConference } from '../base/conference/functions';

// Replace STT Recorder when audio track changes
StateListenerRegistry.register(
    /* selector */ state => {
        const currentAudioTrack = getLocalJitsiAudioTrack(state);
        return currentAudioTrack? currentAudioTrack : null;
    },
    /* listener */ (newSelectedValue, { dispatch, getState }) => {
        if (!newSelectedValue){
            const recorder = 'update-later';
            dispatch(updateRecorder(recorder));

            return;
        }

        const state = getState();
        const stt_state = state['features/stt'];
        if(stt_state._sttEnabled && stt_state._wsServer && stt_state._recorder){
            const soc = stt_state._wsServer;
            const oldRecorder = stt_state._recorder;
            if(typeof oldRecorder.destroy !== "undefined")
                oldRecorder.destroy();
            
            const targetStream = getLocalJitsiAudioTrack(state).stream;
            try{
                const newRecorder = RecordRTC(targetStream, {
                    type: 'audio',
                    recorderType: RecordRTC.StereoAudioRecorder,
                    timeSlice: 100,
                    desiredSampRate: 16000,
                    numberOfAudioChannels: 1,
                    ondataavailable: function (blob) {
                        try {
                            const reader = new FileReader();
                            reader.addEventListener('loadend', () => {
                                soc.send(reader.result);
                            });
                            reader.readAsArrayBuffer(blob);
                        }
                        catch (e) {
                            dispatch(updateRetryCheck(true));
                        }
                    },
                });
                newRecorder.startRecording();
                dispatch(updateRecorder(newRecorder));
            }
            catch(e) {
                dispatch(updateRetryCheck(true));
            }
        }
    });

StateListenerRegistry.register(
    /* selector */ state => getCurrentConference(state),
    /* listener */ (conference, store) => {
        const receiveMessage = (_, data) => {
            // console.log('message is received:', data);
            const { type, ...payload } = data;
            switch (type) {
            case 'features/stt-enabled': {
                const { sttenabled } = payload;
                const { _sttEnabled } = store.getState()['features/stt'];
                if (_sttEnabled !== sttenabled) {
                    store.dispatch(toggleSTT(sttenabled));
                }
            }
            }
        };

        if (conference) {
            conference.on(JitsiConferenceEvents.NON_PARTICIPANT_MESSAGE_RECEIVED, receiveMessage);
        }
    }
);
    
import { StateListenerRegistry } from "../base/redux";
import { getLocalJitsiAudioTrack } from "../base/tracks";
import RecordRTC from './RecordRTC';
import { updateRecorder } from "./actions";

StateListenerRegistry.register(
    /* selector */ state => {
        //const micDeviceId = state['features/base/settings'].micDeviceId;
        const currentAudioTrack = getLocalJitsiAudioTrack(state);

        return currentAudioTrack? currentAudioTrack : null;
    },
    /* listener */ (newSelectedValue, { dispatch, getState }) => {
        if(!newSelectedValue)
            return;

        const state = getState();
        const stt_state = state['features/stt'];
        if(stt_state._sttEnabled && stt_state._wsServer && stt_state._recorder){
            const soc = stt_state._wsServer;
            const oldRecorder = stt_state._recorder;
            oldRecorder.destroy();
            
            const targetStream = getLocalJitsiAudioTrack(state).stream;
            const newRecorder = RecordRTC(targetStream, {
                type: 'audio',
                recorderType: RecordRTC.StereoAudioRecorder,
                timeSlice: 100,
                desiredSampRate: 16000,
                numberOfAudioChannels: 1,
                ondataavailable: function (blob) {
                    const reader = new FileReader();
                    reader.addEventListener('loadend', () => {
                        soc.send(reader.result);
                    });
                    reader.readAsArrayBuffer(blob);
                },
            });
            newRecorder.startRecording();
            dispatch(updateRecorder(newRecorder));
        }
    });
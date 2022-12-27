// @flow

import { Component } from 'react';

/**
 * {@code AbstractCaptions} Properties.
 */
export type AbstractSTTCaptionsProps = {

    /**
     * Transcript texts formatted with participant's name and final content.
     * Mapped by id just to have the keys for convenience during the rendering
     * process.
     */
    _transcripts: ?Map<string, string>,

    _translations: ?Map<String, string>
};

/**
 * Abstract React {@code Component} which can display speech-to-text results
 * from Jigasi as subtitles.
 */
export class AbstractSTTCaptions<P: AbstractSTTCaptionsProps>
    extends Component<P> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    render() {
        const { _transcripts, _translations } = this.props;

        if (!_transcripts || !_transcripts.size) {
            return null;
        }

        const paragraphs = [];

        for (const [ id, text ] of _transcripts) {
            paragraphs.push(this._renderParagraph(id, text));
            if(_translations && _translations.get(id)){
                paragraphs.push(this._renderParagraphTrans(id, _translations.get(id)));
            }
        }

        return this._renderSubtitlesContainer(paragraphs);
    }

    /**
     * Renders the transcription text.
     *
     * @abstract
     * @param {string} id - The ID of the transcript message from which the
     * {@code text} has been created.
     * @param {string} text - Subtitles text formatted with the participant's
     * name.
     * @protected
     * @returns {React$Element} - The React element which displays the text.
     */
    _renderParagraph: (id: string, text: string) => React$Element<*>;

    _renderParagraphTrans: (id: string, translatedText: string) => React$Element<*>;

    /**
     * Renders the subtitles container.
     *
     * @abstract
     * @param {Array<React$Element>} paragraphs - An array of elements created
     * for each subtitle using the {@link _renderParagraph} method.
     * @protected
     * @returns {React$Element} - The subtitles container.
     */
    _renderSubtitlesContainer: (Array<React$Element<*>>) => React$Element<*>;
}

/**
 * Formats the transcript messages into text by prefixing participant's name to
 * avoid duplicating the effort on platform specific component.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Map<string, string>} - Formatted transcript subtitles mapped by
 * transcript message IDs.
 */
function _constructTranscripts(state: Object): Map<string, string> {
    const { _transcriptMessages } = state['features/stt'];
    const transcripts = new Map();

    for (const [ id, transcriptMessage ] of _transcriptMessages) {
        if (transcriptMessage) {

            let text = `${transcriptMessage.name}: `;

            if (transcriptMessage.final) {
                text += transcriptMessage.final;
            }

            transcripts.set(id, text);
        }
    }

    return transcripts;
}

function _constructTranslations(state: Object): Map<string, string> {
    const { _translationMessages } = state['features/stt'];
    const translations = new Map();

    for (const [ id, translationMessage ] of _translationMessages) {
        if (translationMessage) {

           // let text = `${translationMessage.name}: `;
           let text = '';

            if (translationMessage.final) {
                // text += translationMessage.final;
                text += `(${translationMessage.final})`
            }

            translations.set(id, text);
        }
    }

    return translations;
}

/**
 * Maps the transcriptionSubtitles in the redux state to the associated props of
 * {@code AbstractSTTCaptions}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _transcripts: Map<string, string>
 * }}
 */
export function _abstractMapStateToProps(state: Object) {
    const transcripts = _constructTranscripts(state);
    const translations = _constructTranslations(state);

    return {
        // avoid rerenders by setting to props new empty Map instances.
        _transcripts: transcripts.size === 0 ? undefined : transcripts,
        _translations: translations.size === 0 ? undefined : translations
    };
}

import { isSuboptimalBrowser } from '../base/environment';
import { translateToHTML } from '../base/i18n';
import { showWarningNotification } from '../notifications';

export * from './functions.any';

/**
 * Shows the suboptimal experience notification if needed.
 *
 * @param {Function} dispatch - The dispatch method.
 * @param {Function} t - The translation function.
 * @returns {void}
 */
export function maybeShowSuboptimalExperienceNotification(dispatch, t) {
    if (isSuboptimalBrowser()) {
        dispatch(
            showWarningNotification(
                {
                    titleKey: 'notify.suboptimalExperienceTitle',
                    description: translateToHTML(
                        t,
                        'notify.suboptimalBrowserWarning',
                        {
                            recommendedBrowserPageLink: `${window.location.origin}/static/recommendedBrowsers.html`
                        }
                    )
                }
            )
        );
    }
}

export function reduceRandomSelectionCountdown(countdownRemained: Number) {
    let myInterval = setInterval( () => {
        const countdownElement = document.getElementById('videospace_countdown');

        if(countdownElement) {
            countdownElement.textContent = countdownRemained;
        }
        countdownRemained = countdownRemained - 1;

        if(countdownRemained <= 0) {
            // if interval is not clear, it will cause problems with the counter value
            clearInterval(myInterval);
        }
    }, 950);
}


import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import React, { useCallback, useMemo } from 'react';

import { translate } from '../../../../base/i18n/functions';
import Icon from '../../../../base/icons/components/Icon';
import { IconSip } from '../../../../base/icons/svg';

countries.registerLocale(en);

const NumbersList = ({ t, conferenceID, clickableNumbers, numbers: numbersMapping }) => {
    const renderFlag = useCallback((countryCode) => {
        if (countryCode) {
            return (
                <td className = 'flag-cell'>
                    {countryCode === 'SIP' || countryCode === 'SIP_AUDIO_ONLY'
                        ? <Icon src = { IconSip } />
                        : <i className = { `flag iti-flag ${countryCode}` } />
                    }
                </td>);
        }

        return null;
    }, []);

    const renderNumberLink = useCallback((number) => {
        if (clickableNumbers) {
            // Url encode # to %23, Android phone was cutting the # after
            // clicking it.
            // Seems that using ',' and '%23' works on iOS and Android.
            return (
                <a
                    href = { `tel:${number},${conferenceID}%23` }
                    key = { number } >
                    {number}
                </a>
            );
        }

        return number;
    }, [ conferenceID, clickableNumbers ]);

    const renderNumbersList = useCallback((numbers) => {
        const numbersListItems = numbers.map(number =>
            (<li
                className = 'dial-in-number'
                key = { number.formattedNumber }>
                {renderNumberLink(number.formattedNumber)}
            </li>));

        return (
            <ul className = 'numbers-list'>
                {numbersListItems}
            </ul>
        );
    }, []);

    const renderNumbersTollFreeList = useCallback((numbers) => {
        const tollNumbersListItems = numbers.map(number =>
            (<li
                className = 'toll-free'
                key = { number.formattedNumber }>
                {number.tollFree ? t('info.dialInTollFree') : ''}
            </li>));

        return (
            <ul className = 'toll-free-list'>
                {tollNumbersListItems}
            </ul>
        );
    }, []);

    const renderNumbers = useMemo(() => {
        let numbers;

        if (!numbersMapping) {
            return;
        }

        if (Array.isArray(numbersMapping)) {
            numbers = numbersMapping.reduce(
                (resultNumbers, number) => {
                    // The i18n-iso-countries package insists on upper case.
                    const countryCode = number.countryCode.toUpperCase();
                    let countryName;

                    if (countryCode === 'SIP') {
                        countryName = t('info.sip');
                    } else if (countryCode === 'SIP_AUDIO_ONLY') {
                        countryName = t('info.sipAudioOnly');
                    } else {
                        countryName = t(`countries:countries.${countryCode}`);

                        // Some countries have multiple names as US ['United States of America', 'USA']
                        // choose the first one if that is the case
                        if (!countryName) {
                            countryName = t(`countries:countries.${countryCode}.0`);
                        }
                    }

                    if (resultNumbers[countryName]) {
                        resultNumbers[countryName].push(number);
                    } else {
                        resultNumbers[countryName] = [ number ];
                    }

                    return resultNumbers;
                }, {});
        } else {
            numbers = {};

            for (const [ country, numbersArray ]
                of Object.entries(numbersMapping.numbers)) {

                if (Array.isArray(numbersArray)) {
                    /* eslint-disable arrow-body-style */
                    const formattedNumbers = numbersArray.map(number => ({
                        formattedNumber: number
                    }));
                    /* eslint-enable arrow-body-style */

                    numbers[country] = formattedNumbers;
                }
            }
        }

        const rows = [];

        Object.keys(numbers).forEach((countryName) => {
            const numbersArray = numbers[countryName];
            const countryCode = numbersArray[0].countryCode
                || countries.getAlpha2Code(countryName, 'en')?.toUpperCase()
                || countryName;

            rows.push(
                <>
                    <tr
                        key = { countryName }>
                        {renderFlag(countryCode)}
                        <td className = 'country' >{countryName}</td>
                    </tr>
                    <tr>
                        <td />
                        <td className = 'numbers-list-column'>
                            {renderNumbersList(numbersArray)}
                        </td>
                        <td className = 'toll-free-list-column' >
                            {renderNumbersTollFreeList(numbersArray)}
                        </td>
                    </tr>
                </>
            );
        });

        return rows;
    }, [ numbersMapping ]);

    return (
        <table className = 'dial-in-numbers-list'>
            <tbody className = 'dial-in-numbers-body'>
                {renderNumbers}
            </tbody>
        </table>
    );
};

export default translate(NumbersList);

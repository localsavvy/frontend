// @flow
import fastdom from 'lib/fastdom-promise';

const timeouts: Array<TimeoutID> = [];

const checkboxShouldUpdate = (
    checkedValue: boolean,
    originallyCheckedValue: string
): boolean => {
    if (
        (originallyCheckedValue === 'false' && checkedValue === true) ||
        (originallyCheckedValue === 'true' && checkedValue === false)
    ) {
        return true;
    }
    return false;
};

const updateDataLink = (labelEl: HTMLElement, checked): Promise<any> =>
    fastdom.write(() => {
        labelEl.dataset.linkName = labelEl.dataset.linkNameTemplate.replace(
            '[action]',
            checked ? 'untick' : 'tick'
        );
    });

export const bindAnalyticsEventsOnce = (labelEl: HTMLElement): Promise<any> =>
    fastdom
        .read((): ?HTMLElement => labelEl.querySelector('input'))
        .then((checkboxEl: HTMLInputElement) => {
            if (!labelEl.dataset.updateDataLinkBound) {
                labelEl.addEventListener('change', () => {
                    updateDataLink(labelEl, checkboxEl.checked);
                });
                labelEl.dataset.updateDataLinkBound = 'true';
                updateDataLink(labelEl, checkboxEl.checked);
            }
        });

export const getInfo = (labelEl: HTMLElement): Promise<any> =>
    bindAnalyticsEventsOnce(labelEl)
        .then(() =>
            fastdom.read((): ?HTMLElement => labelEl.querySelector('input'))
        )
        .then((checkboxEl: HTMLInputElement) => {
            if (!labelEl.dataset.updateDataLinkBound) {
                labelEl.addEventListener('change', () => {
                    updateDataLink(labelEl, checkboxEl.checked);
                });
                labelEl.dataset.updateDataLinkBound = 'true';
                updateDataLink(labelEl, checkboxEl.checked);
            }
            return checkboxEl;
        })
        .then((checkboxEl: HTMLInputElement) => ({
            checked: checkboxEl.checked,
            name: checkboxEl.name,
            shouldUpdate: checkboxShouldUpdate(
                checkboxEl.checked,
                labelEl.dataset.originallyChecked
            ),
        }));

export const flip = (labelEl: HTMLElement): Promise<any> =>
    fastdom
        .read((): ?HTMLElement => labelEl.querySelector('input'))
        .then((checkboxEl: HTMLInputElement) => {
            fastdom.write(() => {
                checkboxEl.checked = !checkboxEl.checked;
            });
        });

export const addSpinner = (
    labelEl: HTMLElement,
    latencyTimeout: number = 500
): Promise<any> =>
    fastdom
        .write(() => {
            labelEl.classList.add('is-updating');
            if (document.body) document.body.classList.add('is-updating-js');
        })
        .then(() => {
            labelEl.dataset.slowLoadTimeout = timeouts
                .push(
                    setTimeout(() => {
                        fastdom.write(() => {
                            if (document.body) {
                                document.body.classList.add(
                                    'is-updating-cursor'
                                );
                            }
                            labelEl.classList.add('is-taking-a-long-time');
                        });
                    }, latencyTimeout)
                )
                .toString();
        });

export const removeSpinner = (labelEl: HTMLElement): Promise<any> =>
    fastdom.write(() => {
        if (document.body) document.body.classList.remove('is-updating-cursor');
        if (document.body) document.body.classList.remove('is-updating-js');
        labelEl.classList.remove('is-updating');
        labelEl.classList.remove('is-taking-a-long-time');
        clearTimeout(
            timeouts[parseInt(labelEl.dataset.slowLoadTimeout, 10) - 1]
        );
    });

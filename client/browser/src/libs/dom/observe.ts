import { from, merge, Observable, Subject } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'
import uuid from 'uuid'

interface DOMObserver {
    /**
     * Listen to the DOM for a specific selector. It will immediately emit all
     * elements already in the DOM and will asynchronously emit new ones added.
     *
     * @param selector the selector we are wanting to match in the DOM.
     * @param timeout time in ms to wait before throwing an error if no matches
     * are found.
     */
    observeSelector(container: HTMLElement, selector: string, timeout?: number): Observable<HTMLElement>
}

const createDOMObserver = (): DOMObserver => {
    interface Observee {
        selector: string
        handleMatch: (match: HTMLElement) => void
    }

    const selectors = new Map<string, Observee>()

    const queryNode = (node: HTMLElement) => {
        for (const { selector, handleMatch } of selectors.values()) {
            for (const match of node.querySelectorAll<HTMLElement>(selector)) {
                handleMatch(match)
            }
        }
    }

    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                const target = mutation.target
                if (target instanceof HTMLElement) {
                    queryNode(target)
                }
            }
        }
    })

    const observeSelector: DOMObserver['observeSelector'] = (container, selector, timeout = 500) => {
        const elems = container.querySelectorAll<HTMLElement>(selector)

        const matches = new Subject<HTMLElement>()

        const key = uuid()

        selectors.set(key, {
            selector,
            handleMatch: (match: HTMLElement) => {
                if (container.contains(match)) {
                    matches.next(match)
                }
            },
        })

        observer.observe(container, {
            childList: true,
            subtree: true,
        })

        return merge(from(elems), matches).pipe(distinctUntilChanged())
    }

    return {
        observeSelector,
    }
}

const domObserver = createDOMObserver()

export const observeSelector = domObserver.observeSelector

import { noop, Subject } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'
import { TestScheduler } from 'rxjs/testing'
import { observeSelector } from './observe'

describe.only('DOMObserver', () => {
    const dom = (() => {
        const elems: HTMLElement[] = []

        return {
            appendDiv: (className: string) => {
                const div = document.createElement('div')
                div.className = className
                document.body.append(div)
                return div
            },
            cleanup: () => {
                for (const elem of elems) {
                    elem.remove()
                }
            },
        }
    })()

    afterEach(() => dom.cleanup())

    it('gets all the elements that are already in the DOM', () => {
        for (let i = 0; i < 10; i++) {
            dom.appendDiv('test')
        }

        const scheduler = new TestScheduler((a, b) => expect(a).toEqual(b))

        scheduler.run(({ cold, expectObservable }) => {
            const selectors = {
                a: '.test',
            }

            const found = cold('a', selectors).pipe(
                switchMap(selector => observeSelector(document.body, selector)),
                map(elem => elem.className)
            )

            expectObservable(found).toBe('(aaaaaaaaaa)', { a: 'test' })
        })
    })

    it('gets elements added asynchronously', () => {
        const scheduler = new TestScheduler((a, b) => expect(a).toEqual(b))

        scheduler.run(({ cold, expectObservable }) => {
            const classNames = {
                a: 'async',
            }

            const found = observeSelector(document.body, '.async').pipe(map(elem => elem.className))

            const finished = new Subject<void>()

            cold('10ms a 10ms aaa 10ms a|', classNames).subscribe(
                className => {
                    dom.appendDiv(className)
                },
                noop,
                () => finished.next()
            )

            expectObservable(finished.pipe(switchMap(() => found))).toBe('10ms a 10ms aaa 10ms a', { a: 'test' })
        })
    })
})

import assert from 'assert'
import { AggregateIterator, CronDatesIterator, IntervalDatesIterator, NativeDatesIterator, createIterator } from './dates-iterators.js'
//import { setTimeout as wait } from 'timers/promises'

function assertDatesWithIterations(iterations: IteratorResult<Date>[], dates: Date[]) {
    assert.strictEqual(iterations.length, dates.length + 1)
    assert.deepEqual(iterations[iterations.length - 1], {done: true})

    dates.forEach((expectedDate, index) => {
        assert.strictEqual(iterations[index].done, false)
        assert.strictEqual(iterations[index].value.getTime(), expectedDate.getTime(), [iterations[index].value.toJSON(), expectedDate.toJSON()].join(' vs '))
    })
}

function assertSameDates(dates1: Date[], dates2: Date[]) {
    assert.strictEqual(dates1.length, dates2.length)

    dates2.forEach((expectedDate, index) => {
        assert.strictEqual(dates1[index].getTime(), expectedDate.getTime(), [dates1[index].toJSON(), expectedDate.toJSON()].join(' vs '))
    })
}

describe('Dates Iterators', () => {
    describe('createIterator', () => {
        it('simple native iterator', () => {
            const iterator = createIterator({
                times: [new Date('2023-06-01T12:00:00+02:00'), new Date('2023-06-01T13:00:00+02:00')]
            })

            assert(iterator instanceof NativeDatesIterator)

            const dates = [...iterator]

            console.log(dates)

            assertSameDates(
                dates,
                    [
                        new Date('2023-06-01T12:00:00+02:00'),
                        new Date('2023-06-01T13:00:00+02:00')
                    ]

            )
        })

        it('simple cron iterator', () => {
            const iterator = createIterator({
                times: ['0 6 * * *'],
                startDate: new Date('2023-05-31T23:50:00+02:00'),
                limit: 2,
            })

            assert(iterator instanceof CronDatesIterator)

            const dates = [...iterator]

            console.log(dates)

            assertSameDates(
                dates,
                    [
                        new Date('2023-06-01T06:00:00+02:00'),
                        new Date('2023-06-02T06:00:00+02:00')
                    ]

            )
        })

        it('cron aggregate iterator', () => {
            const iterator = createIterator({
                times: ['0 6 * * *', '0 18 * * *'],
                startDate: new Date('2023-05-31T23:50:00+02:00'),
                endDate: new Date('2023-06-02T18:00:00+02:00')
            })

            assert(iterator instanceof AggregateIterator)

            const dates = [...iterator]

            console.log(dates)

            assertSameDates(
                dates,
                    [
                        new Date('2023-06-01T06:00:00+02:00'),
                        new Date('2023-06-01T18:00:00+02:00'),
                        new Date('2023-06-02T06:00:00+02:00'),
                        new Date('2023-06-02T18:00:00+02:00')
                    ]
            )
        })

        it('complex aggregate iterator', () => {

            const iterator = createIterator({
                times: ['0 6 * * *', 'P1D', new Date('2023-06-01T12:00:00+02:00'), '0 18 * * *'],
                startDate: new Date('2023-05-31T23:50:00+02:00'),
                limit: 12,
                excludedTimes: [new Date('2023-06-02T06:00:00+02:00')],
                roundInterval: true
            })

            const dates = [...iterator]

            console.log(dates)

            assertSameDates(
                dates,
                    [
                        new Date('2023-06-01T00:00:00+02:00'),
                        new Date('2023-06-01T06:00:00+02:00'),
                        new Date('2023-06-01T12:00:00+02:00'),
                        new Date('2023-06-01T18:00:00+02:00'),
                        new Date('2023-06-02T00:00:00+02:00'),
                        new Date('2023-06-02T18:00:00+02:00'),
                        new Date('2023-06-03T00:00:00+02:00'),
                        new Date('2023-06-03T06:00:00+02:00'),
                        new Date('2023-06-03T18:00:00+02:00'),
                        new Date('2023-06-04T00:00:00+02:00'),
                        new Date('2023-06-04T06:00:00+02:00'),
                        new Date('2023-06-04T18:00:00+02:00')
                    ]

            )
        })
    })

    // describe('NowIterator', () => {
    //     it('Simple test', async () => {
    //         const it = new NowIterator({limit: 3})

    //         const iterations = []
    //         let iteration = it.next()
    //         iterations.push(iteration)

    //         while(!iteration.done) {
    //             await wait(50)
    //             iteration = it.next()

    //             if (!iteration.done) {
    //                 assert(((new Date).getTime() - iteration.value.getTime()) < 5)
    //             }

    //             iterations.push(iteration)
    //         }

    //         assert.strictEqual(iterations.length, 4)

    //         console.log(iterations)
    //     })
    // })

    describe('IntervalDatesIterator', () => {
        it('simple test', () => {
            const it = new IntervalDatesIterator({
                interval: 'P1M',
                roundInterval: true,
                startDate: new Date('2020-09-15T00:00:00+02:00'),
                endDate: new Date('2021-09-30T00:00:00+02:00'),
            })

            const iterations = []
            let iteration = it.next()
            iterations.push(iteration)
            let changeCountdown = 5

            while(!iteration.done) {
                iteration = it.next(changeCountdown-- === 0 ? new Date('2021-06-15T00:00:00+02:00') : undefined)
                iterations.push(iteration)
            }

            console.log(iterations)
            assertDatesWithIterations(
                iterations,
                    [
                        new Date('2020-10-01T00:00:00+02:00'),
                        new Date('2020-11-01T00:00:00+01:00'),
                        new Date('2020-12-01T00:00:00+01:00'),
                        new Date('2021-01-01T00:00:00+01:00'),
                        new Date('2021-02-01T00:00:00+01:00'),
                        new Date('2021-03-01T00:00:00+01:00'),
                        new Date('2021-07-01T00:00:00+02:00'),
                        new Date('2021-08-01T00:00:00+02:00'),
                        new Date('2021-09-01T00:00:00+02:00')
                    ]

            )
        })
    })

    describe('AggregateIterator', () => {
        it('simple test', () => {
            const it = new AggregateIterator({
                iterators: [
                    new NativeDatesIterator({
                        dates: [
                            new Date('2023-09-01T19:00:00+02:00'),
                            new Date('2023-08-15T00:00:00+02:00'),
                            new Date('2023-09-15T12:00:00+02:00')
                        ]
                    }),
                    new NativeDatesIterator({
                        dates: [
                            new Date('2023-09-02T00:00:00+02:00'),
                            new Date('2023-09-25T12:00:00+02:00'),
                            new Date('2023-09-17T00:00:00+02:00')
                        ]
                    }),
                    new IntervalDatesIterator({
                        interval: 1000 * 60 * 60 * 24,
                        roundInterval: true,

                        startDate: new Date('2023-09-01T00:00:00+02:00'),
                        endDate: new Date('2023-09-30T00:00:00+02:00'),
                    }),
                    new CronDatesIterator({
                        cron: '0 17 */7 * *',
                        startDate: new Date('2023-09-01T00:00:00+02:00'),
                        endDate: new Date('2023-09-30T00:00:00+02:00')
                    })
                ],
                limit: 10
            })

            const iterations = []
            let iteration = it.next()
            iterations.push(iteration)
            let changeCountdown = 3

            while(!iteration.done) {
                iteration = it.next(changeCountdown-- === 0 ? new Date('2023-09-10T07:00:00+02:00') : undefined)
                iterations.push(iteration)
            }

            console.log(iterations)
            assertDatesWithIterations(
                iterations,
                    [
                        new Date('2023-08-14T22:00:00.000Z'),
                        new Date('2023-08-31T22:00:00.000Z'),
                        new Date('2023-09-01T15:00:00.000Z'),
                        new Date('2023-09-01T17:00:00.000Z'),
                        new Date('2023-09-10T22:00:00.000Z'),
                        new Date('2023-09-11T22:00:00.000Z'),
                        new Date('2023-09-12T22:00:00.000Z'),
                        new Date('2023-09-13T22:00:00.000Z'),
                        new Date('2023-09-14T22:00:00.000Z'),
                        new Date('2023-09-15T10:00:00.000Z')
                    ]

            )
        })

        it('test with exclusions', () => {
            const sD = new Date('2023-01-01T00:00:00.000Z')

            const it = new AggregateIterator({
                iterators: [
                    new IntervalDatesIterator({interval: 'PT1H', startDate: sD, roundInterval: true})
                ],
                excludeIterators: [
                    new CronDatesIterator({cron: '0 4,8 * * *', startDate: sD}),
                    new NativeDatesIterator({dates: [new Date('2023-01-01T11:00:00.000Z')]})
                ],
                limit: 10
            })

            const iterations = []
            let iteration = it.next()
            iterations.push(iteration)

            let changeCountdown = 3

            while(!iteration.done) {
                iteration = it.next(changeCountdown-- === 0 ? new Date('2023-01-01T07:00:00.000Z') : undefined)
                iterations.push(iteration)
            }

            console.log(iterations)
            assertDatesWithIterations(
                iterations,
                    [
                        new Date('2023-01-01T00:00:00.000Z'),
                        new Date('2023-01-01T01:00:00.000Z'),
                        new Date('2023-01-01T02:00:00.000Z'),
                        new Date('2023-01-01T04:00:00.000Z'),
                        new Date('2023-01-01T08:00:00.000Z'),
                        new Date('2023-01-01T09:00:00.000Z'),
                        new Date('2023-01-01T10:00:00.000Z'),
                        new Date('2023-01-01T12:00:00.000Z'),
                        new Date('2023-01-01T13:00:00.000Z'),
                        new Date('2023-01-01T14:00:00.000Z')
                    ]

            )
        })
    })
})

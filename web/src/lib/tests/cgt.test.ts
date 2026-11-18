import { describe, it, expect } from 'vitest'
import { fifo, lifo, hifo } from '$lib/helpers/cgt'
import type { Split, Trade } from '$lib/types'

function trade(
	date: string,
	side: 'BUY' | 'SELL',
	quantity: number,
	price: number,
	brokerage = 0
): Trade {
	return {
		trade_date: new Date(date),
		symbol: 'ABC',
		side,
		quantity,
		price,
		gross: quantity * price,
		brokerage,
		source: 'test'
	}
}

// Three lots bought in order at $10, $30, $20, then a sell of 5.
// The $30 lot sits in the middle, so FIFO, LIFO and HIFO each pick a different lot.
const threeLots: Trade[] = [
	trade('2024-01-01', 'BUY', 10, 10),
	trade('2024-02-01', 'BUY', 10, 30),
	trade('2024-03-01', 'BUY', 10, 20),
	trade('2024-04-01', 'SELL', 5, 40)
]

describe('lot matching methods', () => {
	it('FIFO sells the oldest lot first', () => {
		const { cgt } = fifo(threeLots, [])
		expect(cgt[0].cost_base).toBe(50) // 5 × $10
		expect(cgt[0].realised_pnl).toBe(150) // proceeds 5 × $40 = 200, minus 50
	})

	it('LIFO sells the newest lot first', () => {
		const { cgt } = lifo(threeLots, [])
		expect(cgt[0].cost_base).toBe(100) // 5 × $20
	})

	it('HIFO sells the most expensive lot first', () => {
		const { cgt } = hifo(threeLots, [])
		expect(cgt[0].cost_base).toBe(150) // 5 × $30
	})

	it('leaves the unsold quantity in the portfolio', () => {
		const { portfolio } = fifo(threeLots, [])
		// left: 5 × $10 + 10 × $30 + 10 × $20 = 550 over 25 shares
		expect(portfolio).toEqual([{ symbol: 'ABC', quantity: 25, cost_base: 550, avg_cost: 22 }])
	})
})

describe('selling across several lots', () => {
	it('uses up one lot and takes the rest from the next', () => {
		const trades = [
			trade('2024-01-01', 'BUY', 10, 10),
			trade('2024-02-01', 'BUY', 10, 20),
			trade('2024-03-01', 'SELL', 15, 30)
		]
		const { cgt, portfolio } = fifo(trades, [])
		expect(cgt[0].cost_base).toBe(200) // 10 × $10 + 5 × $20
		expect(portfolio[0].quantity).toBe(5)
	})
})

describe('splits', () => {
	const split: Split[] = [{ date: new Date('2024-02-01'), symbol: 'ABC', ratio: 2 }]

	it('rescales a lot bought before the split', () => {
		const trades = [
			trade('2024-01-01', 'BUY', 10, 100), // after the 2:1 split: 20 @ $50
			trade('2024-03-01', 'SELL', 20, 60)
		]
		const { cgt, portfolio } = fifo(trades, split)
		expect(cgt[0].cost_base).toBe(1000)
		expect(cgt[0].realised_pnl).toBe(200) // 20 × $60 = 1200, minus 1000
		expect(portfolio).toEqual([]) // fully sold
	})

	it('does not rescale a lot bought after the split', () => {
		const trades = [trade('2024-03-01', 'BUY', 10, 50), trade('2024-04-01', 'SELL', 10, 60)]
		const { cgt } = fifo(trades, split)
		expect(cgt[0].cost_base).toBe(500)
	})
})

describe('brokerage', () => {
	it('adds buy brokerage to the cost base', () => {
		const trades = [trade('2024-01-01', 'BUY', 10, 10, 5), trade('2024-02-01', 'SELL', 10, 20)]
		const { cgt } = fifo(trades, [])
		expect(cgt[0].cost_base).toBe(105) // 10 × $10 + $5
	})

	it('takes sell brokerage off the proceeds', () => {
		const trades = [trade('2024-01-01', 'BUY', 10, 10), trade('2024-02-01', 'SELL', 10, 20, 5)]
		const { cgt } = fifo(trades, [])
		expect(cgt[0].proceeds).toBe(195) // 10 × $20 − $5
		expect(cgt[0].realised_pnl).toBe(95)
	})
})

describe('regressions', () => {
	// Before 7a55b65, buildLots() reversed the lots for LIFO and matchSells()
	// then took from the end of that reversed list. The double reversal picked
	// the OLDEST lot, so LIFO quietly gave the same answer as FIFO.
	it('LIFO does not behave like FIFO', () => {
		const trades = [
			trade('2024-01-01', 'BUY', 10, 10),
			trade('2024-02-01', 'BUY', 10, 20),
			trade('2024-03-01', 'SELL', 10, 25)
		]
		expect(lifo(trades, []).cgt[0].cost_base).toBe(200)
		expect(fifo(trades, []).cgt[0].cost_base).toBe(100)
	})
})

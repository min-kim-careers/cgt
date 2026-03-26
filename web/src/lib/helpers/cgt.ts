import type { CGTRow, DividendRow, PortfolioRow, Trade } from '$lib/types'

type Lot = { quantity: number; price: number; date: Date }

type CGTResult = {
	cgt: CGTRow[]
	portfolio: PortfolioRow[]
	dividends: DividendRow[]
}

function buildLots(buys: Trade[], method: string): Lot[] {
	const lots = buys.map((b) => ({ quantity: b.quantity, price: b.price, date: b.trade_date }))
	if (method === 'hifo') lots.sort((a, b) => b.price - a.price)
	if (method === 'lifo') lots.reverse()
	return lots
}

function matchSells(sells: Trade[], lots: Lot[], method: string): CGTRow[] {
	const results: CGTRow[] = []

	for (const sell of sells) {
		let remaining = sell.quantity
		let cost_base = 0

		while (remaining > 0 && lots.length > 0) {
			const lot = method === 'lifo' ? lots[lots.length - 1] : lots[0]

			if (lot.quantity <= remaining) {
				cost_base += lot.quantity * lot.price
				remaining -= lot.quantity
				method === 'lifo' ? lots.pop() : lots.shift()
			} else {
				cost_base += remaining * lot.price
				lot.quantity -= remaining
				remaining = 0
			}
		}

		const proceeds = sell.gross

		results.push({
			trade_date: sell.trade_date,
			symbol: sell.symbol,
			quantity_sold: sell.quantity,
			proceeds: round(proceeds),
			cost_base: round(cost_base),
			realised_pnl: round(proceeds - cost_base)
		})
	}

	return results
}

function aggregatePortfolio(lots: Lot[], symbol: string): PortfolioRow | null {
	const quantity = lots.reduce((sum, l) => sum + l.quantity, 0)
	if (quantity < 0.0001) return null
	const cost_base = lots.reduce((sum, l) => sum + l.quantity * l.price, 0)
	return {
		symbol,
		quantity: round(quantity),
		cost_base: round(cost_base),
		avg_cost: round(cost_base / quantity)
	}
}

function round(n: number): number {
	return Math.round(n * 100) / 100
}

function calculateCGT(
	trades: Trade[],
	method: string
): { cgt: CGTRow[]; portfolio: PortfolioRow[] } {
	const cgt: CGTRow[] = []
	const portfolio: PortfolioRow[] = []

	const symbols = [...new Set(trades.map((t) => t.symbol))]

	for (const symbol of symbols) {
		const group = trades
			.filter((t) => t.symbol === symbol)
			.sort((a, b) => a.trade_date.getTime() - b.trade_date.getTime())

		const buys = group.filter((t) => t.side === 'BUY')
		const sells = group.filter((t) => t.side === 'SELL')
		const lots = buildLots(buys, method)

		cgt.push(...matchSells(sells, lots, method))

		const row = aggregatePortfolio(lots, symbol)
		if (row) portfolio.push(row)
	}

	return { cgt, portfolio }
}

export function fifo(trades: Trade[]) {
	return calculateCGT(trades, 'fifo')
}
export function lifo(trades: Trade[]) {
	return calculateCGT(trades, 'lifo')
}
export function hifo(trades: Trade[]) {
	return calculateCGT(trades, 'hifo')
}

export function extractDividends(trades: Trade[]): DividendRow[] {
	return trades
		.filter((t) => t.side === 'DISTRIBUTION')
		.map((t) => ({
			trade_date: t.trade_date,
			symbol: t.symbol,
			amount: t.gross,
			source: t.source
		}))
}

export function runCGT(trades: Trade[]): CGTResult & {
	fifo_cgt: CGTRow[]
	lifo_cgt: CGTRow[]
	hifo_cgt: CGTRow[]
	fifo_portfolio: PortfolioRow[]
	lifo_portfolio: PortfolioRow[]
	hifo_portfolio: PortfolioRow[]
	summary: Record<string, { realised_pnl: number; total_divs: number; total: number }>
} {
	const buys_sells = trades.filter((t) => t.side !== 'DISTRIBUTION')
	const dividends = extractDividends(trades)
	const total_divs = round(dividends.reduce((sum, d) => sum + d.amount, 0))

	const { cgt: fifo_cgt, portfolio: fifo_portfolio } = fifo(buys_sells)
	const { cgt: lifo_cgt, portfolio: lifo_portfolio } = lifo(buys_sells)
	const { cgt: hifo_cgt, portfolio: hifo_portfolio } = hifo(buys_sells)

	const makeSummary = (cgt: CGTRow[]) => {
		const realised_pnl = round(cgt.reduce((sum, r) => sum + r.realised_pnl, 0))
		return { realised_pnl, total_divs, total: round(realised_pnl + total_divs) }
	}

	return {
		cgt: hifo_cgt, // default to hifo
		portfolio: hifo_portfolio,
		dividends,
		fifo_cgt,
		fifo_portfolio,
		lifo_cgt,
		lifo_portfolio,
		hifo_cgt,
		hifo_portfolio,
		summary: {
			fifo: makeSummary(fifo_cgt),
			lifo: makeSummary(lifo_cgt),
			hifo: makeSummary(hifo_cgt)
		}
	}
}

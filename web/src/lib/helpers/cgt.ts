import type { CGTResult, CGTRow, DividendRow, Lot, PortfolioRow, Split, Trade } from '$lib/types'

function buildLots(buys: Trade[], method: string): Lot[] {
	const lots = buys.map((b) => ({ quantity: b.quantity, price: b.price, date: b.trade_date }))
	if (method === 'hifo') lots.sort((a, b) => b.price - a.price)
	if (method === 'lifo') lots.reverse()
	return lots
}

function adjustLotsForSplits(lots: Lot[], splits: Split[], symbol: string): Lot[] {
	const symbolSplits = splits
		.filter((s) => s.symbol === symbol)
		.sort((a, b) => a.date.getTime() - b.date.getTime())

	return lots.map((lot) => {
		let qty = lot.quantity
		let price = lot.price

		for (const split of symbolSplits) {
			if (lot.date < split.date) {
				qty *= split.ratio
				price /= split.ratio
			}
		}

		return { ...lot, quantity: qty, price }
	})
}

function matchSells(sells: Trade[], lots: Lot[], method: string): CGTRow[] {
	const results: CGTRow[] = []
	const takeFromEnd = method === 'lifo'

	for (const sell of sells) {
		let remaining = sell.quantity
		let cost_base = 0

		while (remaining > 0 && lots.length > 0) {
			const lot = takeFromEnd ? lots[lots.length - 1] : lots[0]

			if (lot.quantity <= remaining) {
				cost_base += lot.quantity * lot.price
				remaining -= lot.quantity
				takeFromEnd ? lots.pop() : lots.shift()
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
	splits: Split[],
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
		const adjusted = adjustLotsForSplits(lots, splits ?? [], symbol)

		cgt.push(...matchSells(sells, adjusted, method))

		const row = aggregatePortfolio(adjusted, symbol)
		if (row) portfolio.push(row)
	}

	return { cgt, portfolio }
}

export function fifo(trades: Trade[], splits: Split[]) {
	return calculateCGT(trades, splits, 'fifo')
}
export function lifo(trades: Trade[], splits: Split[]) {
	return calculateCGT(trades, splits, 'lifo')
}
export function hifo(trades: Trade[], splits: Split[]) {
	return calculateCGT(trades, splits, 'hifo')
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

export function runCGT(trades: Trade[], splits: Split[]): CGTResult {
	const buys_sells = trades.filter((t) => t.side === 'BUY' || t.side === 'SELL')
	const dividends = extractDividends(trades)
	const total_divs = round(dividends.reduce((sum, d) => sum + d.amount, 0))

	const { cgt: fifo_cgt, portfolio: fifo_portfolio } = fifo(buys_sells, splits)
	const { cgt: lifo_cgt, portfolio: lifo_portfolio } = lifo(buys_sells, splits)
	const { cgt: hifo_cgt, portfolio: hifo_portfolio } = hifo(buys_sells, splits)

	const makeSummary = (cgt: CGTRow[]) => {
		const realised_pnl = round(cgt.reduce((sum, r) => sum + r.realised_pnl, 0))
		return { realised_pnl, total_divs, total: round(realised_pnl + total_divs) }
	}

	const fifo_summary = makeSummary(fifo_cgt)
	const lifo_summary = makeSummary(lifo_cgt)
	const hifo_summary = makeSummary(hifo_cgt)

	return {
		dividends,
		cgt: {
			fifo: fifo_cgt,
			lifo: lifo_cgt,
			hifo: hifo_cgt
		},
		portfolio: {
			fifo: fifo_portfolio,
			lifo: lifo_portfolio,
			hifo: hifo_portfolio
		},
		summary: {
			fifo: fifo_summary,
			lifo: lifo_summary,
			hifo: hifo_summary
		}
	}
}

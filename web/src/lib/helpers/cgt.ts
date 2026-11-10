import type { CGTMethod, CGTResult, CGTRow, DividendRow, Lot, PortfolioRow, Split, Trade } from '$lib/types'

const EPS = 1e-9

type LotEvent =
	| { kind: 'split'; date: Date; ratio: number }
	| { kind: 'trade'; date: Date; trade: Trade }

// Same-day order: splits first (trades on the split date are already post-split), then buys, then sells.
function eventRank(e: LotEvent): number {
	if (e.kind === 'split') return 0
	return e.trade.side === 'BUY' ? 1 : 2
}

function buildEvents(trades: Trade[], splits: Split[]): LotEvent[] {
	const events: LotEvent[] = [
		...splits.map((s): LotEvent => ({ kind: 'split', date: s.date, ratio: s.ratio })),
		...trades.map((t): LotEvent => ({ kind: 'trade', date: t.trade_date, trade: t }))
	]
	return events.sort((a, b) => a.date.getTime() - b.date.getTime() || eventRank(a) - eventRank(b))
}

// Lots are kept in acquisition order; pick the one the method disposes of first.
function pickLot(lots: Lot[], method: CGTMethod): number {
	if (method === 'fifo') return 0
	if (method === 'lifo') return lots.length - 1
	let best = 0
	for (let i = 1; i < lots.length; i++) if (lots[i].price > lots[best].price) best = i
	return best
}

function sellFromLots(sell: Trade, lots: Lot[], method: CGTMethod): CGTRow {
	let remaining = sell.quantity
	let cost_base = 0

	while (remaining > EPS && lots.length > 0) {
		const i = pickLot(lots, method)
		const lot = lots[i]
		const take = Math.min(lot.quantity, remaining)
		cost_base += take * lot.price
		lot.quantity -= take
		remaining -= take
		if (lot.quantity <= EPS) lots.splice(i, 1)
	}

	// brokerage on disposal reduces capital proceeds
	const proceeds = sell.gross - sell.brokerage
	return {
		trade_date: sell.trade_date,
		symbol: sell.symbol,
		quantity_sold: sell.quantity,
		proceeds: round(proceeds),
		cost_base: round(cost_base),
		realised_pnl: round(proceeds - cost_base)
	}
}

function processSymbol(
	trades: Trade[],
	splits: Split[],
	method: CGTMethod
): { cgt: CGTRow[]; lots: Lot[] } {
	const lots: Lot[] = []
	const cgt: CGTRow[] = []

	for (const e of buildEvents(trades, splits)) {
		if (e.kind === 'split') {
			for (const lot of lots) {
				lot.quantity *= e.ratio
				lot.price /= e.ratio
			}
		} else if (e.trade.side === 'BUY') {
			// brokerage on acquisition forms part of the cost base
			const { quantity, gross, brokerage, price, trade_date } = e.trade
			const unitCost = quantity > 0 ? (gross + brokerage) / quantity : price
			lots.push({ quantity, price: unitCost, date: trade_date })
		} else {
			cgt.push(sellFromLots(e.trade, lots, method))
		}
	}

	return { cgt, lots }
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
	method: CGTMethod
): { cgt: CGTRow[]; portfolio: PortfolioRow[] } {
	const cgt: CGTRow[] = []
	const portfolio: PortfolioRow[] = []

	const symbols = [...new Set(trades.map((t) => t.symbol))]

	for (const symbol of symbols) {
		const result = processSymbol(
			trades.filter((t) => t.symbol === symbol),
			(splits ?? []).filter((s) => s.symbol === symbol),
			method
		)
		cgt.push(...result.cgt)

		const row = aggregatePortfolio(result.lots, symbol)
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

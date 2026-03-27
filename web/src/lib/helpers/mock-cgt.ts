import cgtJson from '$lib/assets/cgt.json'
import type { runCGT } from './cgt'

function hydrateDates<T extends { trade_date: string }>(
	rows: T[]
): (Omit<T, 'trade_date'> & { trade_date: Date })[] {
	return rows.map((r) => ({ ...r, trade_date: new Date(r.trade_date) }))
}

export function mockCgt() {
	const result: ReturnType<typeof runCGT> | null = {
		...cgtJson,
		fifo_cgt: hydrateDates(cgtJson.fifo_cgt),
		lifo_cgt: hydrateDates(cgtJson.lifo_cgt),
		hifo_cgt: hydrateDates(cgtJson.hifo_cgt),
		dividends: hydrateDates(cgtJson.dividends),
		fifo_portfolio: cgtJson.fifo_portfolio,
		lifo_portfolio: cgtJson.lifo_portfolio,
		hifo_portfolio: cgtJson.hifo_portfolio,
		summary: cgtJson.summary
	}
	return result
}

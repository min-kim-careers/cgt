import type { CGTResult } from '$lib/types'

const key = 'result'

export function clearResult() {
	localStorage.removeItem(key)
}

export function persistResult(result: CGTResult) {
	localStorage.setItem(key, JSON.stringify(result))
}

export function restoreResult() {
	const raw = localStorage.getItem(key)
	if (raw) {
		const parsed: CGTResult = JSON.parse(raw)

		const result: CGTResult = {
			...parsed,

			cgt: {
				fifo: parsed.cgt['fifo'].map((row) => ({
					...row,
					trade_date: new Date(row.trade_date)
				})),

				lifo: parsed.cgt['lifo'].map((row) => ({
					...row,
					trade_date: new Date(row.trade_date)
				})),

				hifo: parsed.cgt['hifo'].map((row) => ({
					...row,
					trade_date: new Date(row.trade_date)
				}))
			},

			dividends: parsed.dividends.map((row) => ({
				...row,
				trade_date: new Date(row.trade_date)
			}))
		}
		return result
	}
}

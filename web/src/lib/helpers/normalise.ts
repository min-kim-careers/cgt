import type { Side, Trade } from '$lib/types'
import * as XLSX from 'xlsx'

function isValidDate(d: Date) {
	return !Number.isNaN(d.getTime())
}

// --- Helpers ---
function normaliseDate(val: unknown, fmt: string): Date {
	const s = String(val).trim()
	const order = fmt.replace(/[^DMY]/g, '').split('')
	const parts = s.split(/[\/\-\.]/)
	const map: Record<string, number> = {}
	order.forEach((k, i) => (map[k] = parseInt(parts[i])))
	const d = new Date(map['Y'], map['M'] - 1, map['D'])
	if (!isValidDate(d)) {
		console.error(`Error normalising date: ${val} to ${d}`)
		throw new Error()
	}
	return d
}

function normaliseSymbol(val: string): string {
	const s = val.trim().toUpperCase()
	return s.includes(':') ? s : `${s}:AU`
}

function normaliseSide(val: string): Side {
	const s = val.trim().toUpperCase()
	if (s === 'BUY') return 'BUY'
	if (s === 'SELL') return 'SELL'
	if (s === 'DISTRIBUTION') return 'DISTRIBUTION'
	throw new Error(`Unknown side: ${val}`)
}

function parseAccounting(val: unknown): number {
	if (val === null || val === undefined || val === '') return 0
	if (typeof val === 'number') return Math.abs(val)
	const s = String(val).trim()
	const negative = s.startsWith('(') && s.endsWith(')')
	const n = parseFloat(s.replace(/[()$,\s]/g, ''))
	return Math.abs(isNaN(n) ? 0 : n)
}

function readFile(file: File): Promise<XLSX.WorkBook> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = (e) => resolve(XLSX.read(e.target!.result, { type: 'array', raw: true }))
		reader.onerror = reject
		reader.readAsArrayBuffer(file)
	})
}

function sheetToRows(wb: XLSX.WorkBook, sheetName?: string): Record<string, unknown>[] {
	const sheet = sheetName ? wb.Sheets[sheetName] : wb.Sheets[wb.SheetNames[0]]
	return XLSX.utils.sheet_to_json(sheet, { defval: null })
}

// --- Betashares ---
export async function normaliseBetashares(file: File): Promise<Trade[]> {
	const wb = await readFile(file)
	const rows = sheetToRows(wb)

	return rows
		.filter((r) =>
			['BUY', 'SELL', 'DISTRIBUTION'].includes(String(r['Activity Type']).trim().toUpperCase())
		)
		.map((r) => {
			const gross = parseAccounting(r['Gross'])
			const quantity = parseAccounting(r['Quantity'])
			return {
				trade_date: normaliseDate(r['Effective Date'], 'D/M/Y'),
				symbol: normaliseSymbol(String(r['Symbol'])),
				side: normaliseSide(String(r['Activity Type'])),
				quantity,
				gross,
				price: quantity > 0 ? gross / quantity : 0,
				brokerage: parseAccounting(r['Brokerage']),
				source: 'betashares'
			} satisfies Trade
		})
}

// --- Stake Activity ---
export async function normaliseStakeActivity(file: File): Promise<Trade[]> {
	const wb = await readFile(file)
	const rows = sheetToRows(wb, 'Aus Equities')

	return rows.map((r) => {
		const gross = Math.abs(Number(r['Value']))
		const quantity = Math.abs(Number(r['Units']))
		const fees = Number(r['Fees'] ?? 0)
		const gst = Number(r['GST'] ?? 0)
		return {
			trade_date: normaliseDate(r['Trade Date'], 'Y-M-D'),
			symbol: normaliseSymbol(String(r['Symbol'])),
			side: normaliseSide(String(r['Side'])),
			quantity,
			gross,
			price: quantity > 0 ? gross / quantity : 0,
			brokerage: Math.abs(fees + gst),
			source: 'stake'
		} satisfies Trade
	})
}

// --- Stake Income ---
export async function normaliseStakeIncome(file: File): Promise<Trade[]> {
	const wb = await readFile(file)
	const rows = sheetToRows(wb, 'Aus Dividends (Estimated)')

	return rows.map(
		(r) =>
			({
				trade_date: normaliseDate(r['Payment Date'], 'Y-M-D'),
				symbol: normaliseSymbol(String(r['Symbol'])),
				side: 'DISTRIBUTION',
				quantity: 0,
				price: 0,
				gross: Math.abs(Number(r['Total Amount'])),
				brokerage: 0,
				source: 'stake'
			}) satisfies Trade
	)
}

// --- Aggregate ---
export function sortTradesByDate(trades: Trade[]): Trade[] {
	return trades.sort((a, b) => b.trade_date.getTime() - a.trade_date.getTime())
}

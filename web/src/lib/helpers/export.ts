// lib/export.ts
import type { CGTRow, DividendRow, PortfolioRow } from '$lib/types'
import * as XLSX from 'xlsx'

function formatDate(d: Date): string {
	return d.toISOString().split('T')[0]
}

function cgtToRows(cgt: CGTRow[]) {
	return cgt.map((r) => ({ ...r, trade_date: formatDate(r.trade_date) }))
}

function divsToRows(divs: DividendRow[]) {
	return divs.map((r) => ({ ...r, trade_date: formatDate(r.trade_date) }))
}

export function exportToXlsx(
	cgt: Record<string, CGTRow[]>,
	portfolio: Record<string, PortfolioRow[]>,
	dividends: DividendRow[]
) {
	const wb = XLSX.utils.book_new()

	const append = (data: unknown[], name: string) =>
		XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name)

	append(cgtToRows(cgt['fifo']), 'FIFO_cgt')
	append(portfolio['fifo'], 'FIFO_portfolio')
	append(cgtToRows(cgt['lifo']), 'LIFO_cgt')
	append(portfolio['lifo'], 'LIFO_portfolio')
	append(cgtToRows(cgt['hifo']), 'HIFO_cgt')
	append(portfolio['hifo'], 'HIFO_portfolio')
	append(divsToRows(dividends), 'dividends')

	XLSX.writeFile(wb, 'cgt.xlsx')
}

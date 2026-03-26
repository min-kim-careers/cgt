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
	fifo_cgt: CGTRow[],
	lifo_cgt: CGTRow[],
	hifo_cgt: CGTRow[],
	fifo_portfolio: PortfolioRow[],
	lifo_portfolio: PortfolioRow[],
	hifo_portfolio: PortfolioRow[],
	dividends: DividendRow[]
) {
	const wb = XLSX.utils.book_new()

	const append = (data: unknown[], name: string) =>
		XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name)

	append(cgtToRows(fifo_cgt), 'FIFO_cgt')
	append(fifo_portfolio, 'FIFO_portfolio')
	append(cgtToRows(lifo_cgt), 'LIFO_cgt')
	append(lifo_portfolio, 'LIFO_portfolio')
	append(cgtToRows(hifo_cgt), 'HIFO_cgt')
	append(hifo_portfolio, 'HIFO_portfolio')
	append(divsToRows(dividends), 'dividends')

	XLSX.writeFile(wb, 'cgt.xlsx')
}

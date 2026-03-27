export type Side = 'BUY' | 'SELL' | 'DISTRIBUTION'

export interface Trade {
	trade_date: Date
	symbol: string
	side: Side
	quantity: number
	price: number
	gross: number
	brokerage: number
	source: string
}

export interface CGTRow {
	trade_date: Date
	symbol: string
	quantity_sold: number
	proceeds: number
	cost_base: number
	realised_pnl: number
}

export interface PortfolioRow {
	symbol: string
	quantity: number
	cost_base: number
	avg_cost: number
}

export interface DividendRow {
	trade_date: Date
	symbol: string
	amount: number
	source: string
}
export type Lot = { quantity: number; price: number; date: Date }

export type CGTMethod = 'fifo' | 'lifo' | 'hifo'

export type Split = {
	date: Date
	symbol: string
	ratio: number
}

export type CGTSummary = { realised_pnl: number; total_divs: number; total: number }

export type CGTResult = {
	dividends: DividendRow[]
	cgt: Record<CGTMethod, CGTRow[]>
	portfolio: Record<CGTMethod, PortfolioRow[]>
	summary: Record<CGTMethod, CGTSummary>
}

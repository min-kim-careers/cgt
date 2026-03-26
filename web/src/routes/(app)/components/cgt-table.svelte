<script lang="ts">
	import type { CGTRow } from '$lib/types'

	export let cgt: CGTRow[], activeMethod

	let page = 0
	const pageSize = 20

	$: paged = cgt.slice(page * pageSize, (page + 1) * pageSize)
	$: totalPages = Math.ceil(cgt.length / pageSize)
	$: (activeMethod, (page = 0))

	let key: keyof CGTRow | null = null
	let dir: 'asc' | 'desc' | null = null

	function sortCol(k: keyof CGTRow) {
		if (key === k) dir = dir === 'asc' ? 'desc' : 'asc'
		else {
			key = k
			dir = 'asc'
		}
		cgt = [...cgt].sort((a, b) => {
			const av = a[k],
				bv = b[k]
			const cmp =
				typeof av === 'number'
					? (av as number) - (bv as number)
					: av instanceof Date
						? av.getTime() - (bv as Date).getTime()
						: String(av).localeCompare(String(bv))
			return dir === 'asc' ? cmp : -cmp
		})
	}

	$: icons = Object.fromEntries(
		(Object.keys(cgt[0] ?? {}) as (keyof CGTRow)[]).map((k) => [
			k,
			key === k ? (dir === 'asc' ? '↑' : '↓') : ''
		])
	) as Record<keyof CGTRow, string>
</script>

<div class="space-y-2">
	<h2 class="italic">Realised Gains</h2>
	<div class="overflow-x-auto">
		<table class="w-full text-left">
			<thead class="tracking-wider uppercase">
				<tr>
					<th on:click={() => sortCol('trade_date')}>
						Date {icons.trade_date}
					</th>
					<th on:click={() => sortCol('symbol')}>Symbol {icons.symbol}</th>
					<th on:click={() => sortCol('quantity_sold')}>Qty Sold {icons.quantity_sold}</th>
					<th on:click={() => sortCol('proceeds')}>Proceeds {icons.proceeds}</th>
					<th on:click={() => sortCol('cost_base')}>Cost Base {icons.cost_base}</th>
					<th on:click={() => sortCol('realised_pnl')}>P&L {icons.realised_pnl}</th>
				</tr>
			</thead>
			<tbody>
				{#each paged as row}
					<tr class="h-8 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
						<td>{row.trade_date.toDateString()}</td>
						<td>{row.symbol}</td>
						<td>
							{row.quantity_sold.toLocaleString('en-AU', {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})}
						</td>
						<td>
							${row.proceeds.toLocaleString('en-AU', {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})}
						</td>
						<td>
							${row.cost_base.toLocaleString('en-AU', {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})}
						</td>
						<td
							class={row.realised_pnl >= 0
								? row.realised_pnl === 0
									? 'text-gray-500'
									: 'text-emerald-500'
								: 'text-rose-500'}
						>
							${row.realised_pnl.toLocaleString('en-AU', {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="flex w-full justify-center gap-4">
		<button disabled={page === 0} on:click={() => page--}>Prev</button>
		{page + 1} / {totalPages}
		<button disabled={page >= totalPages - 1} on:click={() => page++}>Next</button>
	</div>
</div>

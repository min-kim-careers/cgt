<script lang="ts">
	import { createTable } from '$lib/stores/table.svelte'
	import type { CGTRow } from '$lib/types'

	export let cgt: CGTRow[], activeMethod

	const { icons, page, paged, sort, totalPages, setData } = createTable<CGTRow>(cgt, 'trade_date')

	$: setData(cgt)
	$: (activeMethod, page.set(0))
</script>

<div class="space-y-2">
	<h2 class="italic">Realised Gains</h2>
	<div class="overflow-x-auto">
		<table class="w-full text-left">
			<thead class="tracking-wider uppercase">
				<tr>
					<th on:click={() => sort('trade_date')}>
						Date {$icons.trade_date}
					</th>
					<th on:click={() => sort('symbol')}>Symbol {$icons.symbol}</th>
					<th on:click={() => sort('quantity_sold')}>Qty Sold {$icons.quantity_sold}</th>
					<th on:click={() => sort('proceeds')}>Proceeds {$icons.proceeds}</th>
					<th on:click={() => sort('cost_base')}>Cost Base {$icons.cost_base}</th>
					<th on:click={() => sort('realised_pnl')}>P&L {$icons.realised_pnl}</th>
				</tr>
			</thead>
			<tbody>
				{#each $paged as row}
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
		<button disabled={$page === 0} on:click={() => $page--}>Prev</button>
		{$page + 1} / {$totalPages}
		<button disabled={$page >= $totalPages - 1} on:click={() => $page++}>Next</button>
	</div>
</div>

<script lang="ts">
	import { createTable } from '$lib/stores/table.svelte'
	import type { PortfolioRow } from '$lib/types'

	export let portfolio

	const { icons, page, paged, sort, totalPages, setData } = createTable<PortfolioRow>(
		portfolio,
		'symbol'
	)

	$: setData(portfolio)
</script>

<div class="space-y-2">
	<h2 class="italic">Holdings</h2>
	<table class="w-full text-left">
		<thead class="tracking-wider uppercase">
			<tr>
				<th on:click={() => sort('symbol')}>Symbol {$icons.symbol}</th>
				<th on:click={() => sort('quantity')}>Quantity {$icons.quantity}</th>
				<th on:click={() => sort('avg_cost')}>Avg Cost {$icons.avg_cost}</th>
				<th on:click={() => sort('cost_base')}>Cost Base {$icons.cost_base}</th>
			</tr>
		</thead>
		<tbody>
			{#each $paged as row}
				<tr class="h-8 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
					<td>{row.symbol}</td>
					<td>{row.quantity}</td>
					<td>
						${row.avg_cost.toLocaleString('en-AU', {
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
				</tr>
			{/each}
		</tbody>
	</table>

	<div class="flex w-full justify-center gap-4">
		<button disabled={$page === 0} on:click={() => $page--}>Prev</button>
		{$page + 1} / {$totalPages}
		<button disabled={$page >= $totalPages - 1} on:click={() => $page++}>Next</button>
	</div>
</div>

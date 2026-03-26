<script lang="ts">
	export let activePortfolio

	let page = 0
	const pageSize = 20

	$: paged = activePortfolio.slice(page * pageSize, (page + 1) * pageSize)
	$: totalPages = Math.ceil(activePortfolio.length / pageSize)
</script>

<div class="space-y-2">
	<h2 class="italic">Portfolio</h2>
	<table class="w-full text-left">
		<thead class="tracking-wider uppercase"
			><tr>
				<th>Symbol</th><th>Quantity</th><th>Avg Cost</th><th>Cost Base</th>
			</tr></thead
		>
		<tbody>
			{#each paged as row}
				<tr class="h-8 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
					<td>{row.symbol}</td>
					<td>{row.quantity}</td>
					<td
						>${row.avg_cost.toLocaleString('en-AU', {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2
						})}</td
					>
					<td
						>${row.cost_base.toLocaleString('en-AU', {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2
						})}</td
					>
				</tr>
			{/each}
		</tbody>
	</table>

	<div class="flex w-full justify-center gap-4">
		<button disabled={page === 0} on:click={() => page--}>Prev</button>
		{page + 1} / {totalPages}
		<button disabled={page >= totalPages - 1} on:click={() => page++}>Next</button>
	</div>
</div>

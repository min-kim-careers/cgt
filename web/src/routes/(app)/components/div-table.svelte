<script lang="ts">
	export let dividends

	let page = 0
	const pageSize = 20

	$: paged = dividends.slice(page * pageSize, (page + 1) * pageSize)
	$: totalPages = Math.ceil(dividends.length / pageSize)
</script>

<div class="space-y-2">
	<h2 class="italic">Dividends</h2>
	<table class="w-full text-left">
		<thead class="tracking-wider uppercase"
			><tr>
				<th>Date</th><th>Symbol</th><th>Amount</th><th>Source</th>
			</tr></thead
		>
		<tbody>
			{#each paged as row}
				<tr class="h-8 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
					<td>{row.trade_date.toDateString()}</td>
					<td>{row.symbol}</td>
					<td
						>${row.amount.toLocaleString('en-AU', {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2
						})}</td
					>
					<td class="capitalize">{row.source}</td>
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

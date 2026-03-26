<script lang="ts">
	import cgtJson from '$lib/assets/cgt.json'
	import Button from '$lib/components/button.svelte'
	import { runCGT } from '$lib/helpers/cgt'
	import { exportToXlsx } from '$lib/helpers/export'
	import {
		normaliseBetashares,
		normaliseStakeActivity,
		normaliseStakeIncome,
		sortTradesByDate
	} from '$lib/helpers/normalise'
	import CgtTable from '$routes/(app)/components/cgt-table.svelte'
	import DivTable from '$routes/(app)/components/div-table.svelte'
	import FileDrop from '$routes/(app)/components/file-drop.svelte'
	import PortfolioTable from '$routes/(app)/components/portfolio-table.svelte'
	import toast from 'svelte-french-toast'

	let betaFile: File | null = null
	let stakeActivityFile: File | null = null
	let stakeIncomeFile: File | null = null

	let loading = false
	let error: string | null = null

	function hydrateDates<T extends { trade_date: string }>(
		rows: T[]
	): (Omit<T, 'trade_date'> & { trade_date: Date })[] {
		return rows.map((r) => ({ ...r, trade_date: new Date(r.trade_date) }))
	}
	let result: ReturnType<typeof runCGT> | null = {
		...cgtJson,
		fifo_cgt: hydrateDates(cgtJson.fifo_cgt),
		lifo_cgt: hydrateDates(cgtJson.lifo_cgt),
		hifo_cgt: hydrateDates(cgtJson.hifo_cgt),
		cgt: hydrateDates(cgtJson.cgt),
		dividends: hydrateDates(cgtJson.dividends),
		fifo_portfolio: cgtJson.fifo_portfolio,
		lifo_portfolio: cgtJson.lifo_portfolio,
		hifo_portfolio: cgtJson.hifo_portfolio,
		portfolio: cgtJson.hifo_portfolio,
		summary: cgtJson.summary
	}

	// result = null

	type CGTMethod = 'fifo' | 'lifo' | 'hifo'
	let activeMethod: CGTMethod = 'hifo'

	async function processTrades() {
		if (!betaFile && !stakeActivityFile && !stakeIncomeFile) return
		loading = true
		error = null
		try {
			const trades = []

			if (betaFile) trades.push(...(await normaliseBetashares(betaFile)))

			if (stakeActivityFile) trades.push(...(await normaliseStakeActivity(stakeActivityFile)))

			if (stakeIncomeFile) trades.push(...(await normaliseStakeIncome(stakeIncomeFile)))

			result = runCGT(sortTradesByDate(trades))

			// const json = JSON.stringify(result, null, 2) // pretty format

			// const blob = new Blob([json], { type: 'application/json' })
			// const url = URL.createObjectURL(blob)

			// const a = document.createElement('a')
			// a.href = url
			// a.download = 'data.json'
			// a.click()

			// URL.revokeObjectURL(url)
		} catch (e) {
			toast.error(String(e))
		} finally {
			loading = false
		}
	}

	function download() {
		if (!result) return
		exportToXlsx(
			result.fifo_cgt,
			result.lifo_cgt,
			result.hifo_cgt,
			result.fifo_portfolio,
			result.lifo_portfolio,
			result.hifo_portfolio,
			result.dividends
		)
	}

	$: dragging = false

	$: CGT = result ? result[`${activeMethod}_cgt`] : []
	$: portfolio = result ? result[`${activeMethod}_portfolio`] : []
	$: summary = result ? result.summary[activeMethod] : null
	$: dividends = result ? result.dividends : []
</script>

<div class="flex w-screen flex-col items-center gap-8 px-4">
	<section class="grid grid-cols-1 gap-2 sm:grid-cols-3">
		<div class="w-[200px]">
			<FileDrop
				label="Betashares CSV"
				file={betaFile}
				accept=".csv"
				onChange={(e) => (betaFile = e.currentTarget.files?.[0] ?? null)}
				onDrop={(e) => (betaFile = e.dataTransfer?.files[0] ?? null)}
				{dragging}
				handleRemove={() => (betaFile = null)}
			/>
		</div>

		<div class="w-[200px]">
			<FileDrop
				label="Stake Activity"
				file={stakeActivityFile}
				accept=".xlsx"
				onChange={(e) => (stakeActivityFile = e.currentTarget.files?.[0] ?? null)}
				onDrop={(e) => (stakeActivityFile = e.dataTransfer?.files[0] ?? null)}
				{dragging}
				handleRemove={() => (stakeActivityFile = null)}
			/>
		</div>

		<div class="w-[200px]">
			<FileDrop
				label="Stake Income"
				file={stakeIncomeFile}
				accept=".xlsx"
				onChange={(e) => (stakeIncomeFile = e.currentTarget.files?.[0] ?? null)}
				onDrop={(e) => (stakeIncomeFile = e.dataTransfer?.files[0] ?? null)}
				{dragging}
				handleRemove={() => (stakeIncomeFile = null)}
			/>
		</div>
	</section>

	<section class="flex w-full justify-end">
		<Button
			onclick={processTrades}
			disabled={(!betaFile && !stakeActivityFile && !stakeIncomeFile) || loading}
			class="px-10"
		>
			{loading ? 'Processing...' : 'Process'}
		</Button>
	</section>

	{#if result}
		{#if summary}
			<section class="flex w-full justify-between">
				<div>
					<p class="italic">Realised P&L</p>
					<span class="text-xl font-semibold">
						${summary.realised_pnl.toLocaleString('en-AU', {
							minimumFractionDigits: 2
						})}
					</span>
				</div>
				<div>
					<p class="italic">Dividends</p>
					<span class="text-xl font-semibold">
						${summary.total_divs.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
					</span>
				</div>
				<div>
					<p class="italic">Total</p>
					<span class="text-xl font-semibold">
						${summary.total.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
					</span>
				</div>
			</section>
		{/if}

		<section class="flex w-full justify-between">
			<div class="space-x-4">
				{#each ['fifo', 'lifo', 'hifo'] as m}
					<button
						class={activeMethod === m ? 'font-bold underline' : ''}
						on:click={() => (activeMethod = m as typeof activeMethod)}
					>
						{m.toUpperCase()}
					</button>
				{/each}
			</div>
			<button on:click={download} class="underline">Download XLSX</button>
		</section>

		<section class="w-full space-y-4">
			<CgtTable cgt={CGT} {activeMethod} />

			<DivTable {dividends} />

			<PortfolioTable activePortfolio={portfolio} />
		</section>
	{/if}
</div>

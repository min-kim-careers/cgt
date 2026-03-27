<script lang="ts">
	import Button from '$lib/components/button.svelte'
	import { runCGT } from '$lib/helpers/cgt'
	import { exportToXlsx } from '$lib/helpers/export'
	import {
		normaliseBetashares,
		normaliseStakeActivity,
		normaliseStakeIncome,
		sortTradesByDate
	} from '$lib/helpers/normalise'
	import { clearResult, persistResult, restoreResult } from '$lib/helpers/persist-trades'
	import type { CGTMethod, Trade } from '$lib/types'
	import CgtTable from '$routes/(app)/components/cgt-table.svelte'
	import DivTable from '$routes/(app)/components/div-table.svelte'
	import FileDrop from '$routes/(app)/components/file-drop.svelte'
	import PortfolioTable from '$routes/(app)/components/portfolio-table.svelte'
	import { onMount } from 'svelte'
	import toast from 'svelte-french-toast'

	let betaFile: File | null = null
	let stakeActivityFile: File | null = null
	let stakeIncomeFile: File | null = null

	let loading = false
	let result: ReturnType<typeof runCGT> | null = null
	let activeMethod: CGTMethod = 'hifo'

	onMount(() => {
		const persisted = restoreResult()
		if (persisted) {
			result = persisted
			toast('Result restored')
		}
	})

	async function processTrades() {
		if (!betaFile && !stakeActivityFile && !stakeIncomeFile) return
		loading = true
		try {
			const trades: Trade[] = []

			if (betaFile) trades.push(...(await normaliseBetashares(betaFile)))

			if (stakeActivityFile) trades.push(...(await normaliseStakeActivity(stakeActivityFile)))

			if (stakeIncomeFile) trades.push(...(await normaliseStakeIncome(stakeIncomeFile)))

			result = runCGT(sortTradesByDate(trades), [])
			persistResult(result)
		} catch (e) {
			toast.error(String(e))
		} finally {
			loading = false
		}
	}

	function downloadResults() {
		if (!result) return
		exportToXlsx(result.cgt, result.portfolio, result.dividends)
	}

	$: dragging = false

	$: cgt = result ? result.cgt[activeMethod] : []
	$: portfolio = result ? result.portfolio[activeMethod] : []
	$: dividends = result ? result.dividends : []
	$: summary = result ? result.summary[activeMethod] : null
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

	<section class="flex w-full justify-between gap-2">
		<span>
			<!-- <Button
				onclick={() => {
					if (result) {
						persistResult(result)
						toast('Saved results')
					}
				}}
				disabled={!result?.cgt['hifo'].length &&
					!result?.cgt['lifo'].length &&
					!result?.cgt['fifo'].length}
				class="w-24"
			>
				Save
			</Button> -->
			<Button
				onclick={() => {
					clearResult()
					result = null
					toast('Results cleared')
				}}
				disabled={!result?.cgt['hifo'].length &&
					!result?.cgt['lifo'].length &&
					!result?.cgt['fifo'].length}
				class="w-24"
			>
				Clear
			</Button>
		</span>

		<Button
			onclick={processTrades}
			disabled={(!betaFile && !stakeActivityFile && !stakeIncomeFile) || loading}
			class="w-24"
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
			<button on:click={downloadResults} class="underline">Download XLSX</button>
		</section>

		<section class="w-full space-y-4">
			<CgtTable {cgt} {activeMethod} />

			<DivTable {dividends} />

			<PortfolioTable {portfolio} />
		</section>
	{/if}
</div>

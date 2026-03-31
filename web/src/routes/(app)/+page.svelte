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
	import { persistResult, resetResult, restoreResult } from '$lib/helpers/persist-result'
	import type { CGTMethod, Trade } from '$lib/types'
	import CgtTable from '$routes/(app)/components/cgt-table.svelte'
	import DivTable from '$routes/(app)/components/div-table.svelte'
	import FileInput from '$routes/(app)/components/file-input.svelte'
	import PortfolioTable from '$routes/(app)/components/portfolio-table.svelte'
	import { onMount } from 'svelte'
	import toast from 'svelte-french-toast'

	let betaFiles: File[] = []
	let stakeActivityFiles: File[] = []
	let stakeIncomeFiles: File[] = []

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
		if (!betaFiles && !stakeActivityFiles && !stakeIncomeFiles) return
		loading = true
		try {
			const trades: Trade[] = []

			if (betaFiles) {
				const results = await Promise.all(betaFiles.map((f) => normaliseBetashares(f)))
				results.forEach((r) => trades.push(...r))
			}

			if (stakeActivityFiles) {
				const results = await Promise.all(stakeActivityFiles.map((f) => normaliseStakeActivity(f)))
				results.forEach((r) => trades.push(...r))
			}

			if (stakeIncomeFiles) {
				const results = await Promise.all(stakeIncomeFiles.map((f) => normaliseStakeIncome(f)))
				results.forEach((r) => trades.push(...r))
			}

			if (!trades.length) throw new Error('No trades processed')

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

<div class="flex w-screen flex-col items-center gap-8 px-4 sm:max-w-3xl">
	<div class="flex w-full justify-center text-xs text-primary/60">
		<p>Drag and drop multiple files here, or click to upload</p>
	</div>

	<section class="grid grid-cols-1 gap-2 sm:grid-cols-3">
		<div class="h-[120px] w-[200px]">
			<FileInput
				label="Betashares CSV"
				files={betaFiles}
				{dragging}
				accept=".csv"
				onChange={(f) => (betaFiles = f)}
				onDrop={(f) => (betaFiles = f)}
				handleClear={() => (betaFiles = [])}
			/>
		</div>

		<div class="h-[120px] w-[200px]">
			<FileInput
				label="Stake Activity"
				files={stakeActivityFiles}
				{dragging}
				accept=".xlsx"
				onChange={(f) => (stakeActivityFiles = f)}
				onDrop={(f) => (stakeActivityFiles = f)}
				handleClear={() => (stakeActivityFiles = [])}
			/>
		</div>

		<div class="h-[120px] w-[200px]">
			<FileInput
				label="Stake Income"
				files={stakeIncomeFiles}
				{dragging}
				accept=".xlsx"
				onChange={(f) => (stakeIncomeFiles = f)}
				onDrop={(f) => (stakeIncomeFiles = f)}
				handleClear={() => (stakeIncomeFiles = [])}
			/>
		</div>
	</section>

	<section class="flex w-full justify-end gap-2">
		<Button
			onclick={() => {
				resetResult()
				result = null
				toast('Results cleared')
			}}
			disabled={!result}
			class="w-24"
		>
			Clear
		</Button>

		<Button
			onclick={processTrades}
			disabled={(!betaFiles && !stakeActivityFiles && !stakeIncomeFiles) || loading}
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
			<button on:click={downloadResults} class="underline">Download Excel</button>
		</section>

		<section class="w-full space-y-4">
			<CgtTable {cgt} {activeMethod} />

			<DivTable {dividends} />

			<PortfolioTable {portfolio} />
		</section>
	{/if}
</div>

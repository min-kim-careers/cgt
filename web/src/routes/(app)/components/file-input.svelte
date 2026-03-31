<script lang="ts">
	import { cn } from '$lib/shadcn/utils'

	export let label: string,
		files: File[],
		accept: string,
		onChange: (f: File[]) => void,
		onDrop: (f: File[]) => void,
		handleClear: () => void,
		dragging: boolean

	function handleDrop(e: DragEvent) {
		e.preventDefault()
		dragging = false
		const f = Array.from(e.dataTransfer?.files ?? [])
		onDrop(f)
	}

	function handleChange(e: Event) {
		e.preventDefault()
		const f = Array.from((e.currentTarget as HTMLInputElement).files ?? [])
		onChange(f)
	}

	function handleDragLeave() {
		dragging = false
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault()
		dragging = true
	}
</script>

{#if files.length}
	<div
		class="group relative flex h-full w-full flex-col items-center justify-center rounded-lg border-2 text-center"
	>
		{#if files.length}
			<span class="text-sm text-primary/50">{label}</span>
			<span class="line-clamp-1">{files.length} files</span>
		{/if}

		<button
			class="pointer-events-auto absolute top-0 right-0 mx-2 cursor-pointer text-lg"
			on:click={handleClear}
		>
			&times;
		</button>
	</div>
{:else}
	<label
		on:drop={handleDrop}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		class={cn(
			'flex h-full w-full flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-all',
			dragging && 'scale-105 bg-accent'
		)}
	>
		{label}
		<input multiple type="file" {accept} hidden on:change={handleChange} />
	</label>
{/if}

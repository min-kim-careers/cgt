<script lang="ts">
	import { cn } from '$lib/shadcn/utils'

	export let label: string,
		file: File | null,
		accept: string,
		onChange: (e: any) => void,
		onDrop: (e: DragEvent) => void,
		handleRemove: () => void,
		dragging: boolean

	function handleDrop(e: DragEvent) {
		e.preventDefault()
		dragging = false
		const file = e.dataTransfer?.files?.[0]
		if (!file) return
		onDrop(e)
	}

	function handleDragLeave() {
		dragging = false
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault()
		dragging = true
	}
</script>

<label
	on:drop={handleDrop}
	on:dragover={handleDragOver}
	on:dragleave={handleDragLeave}
	class={cn(
		'relative line-clamp-3 flex h-[120px] w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed bg-background p-2 text-center transition-all duration-200 ease-in-out',
		dragging && 'scale-105 bg-accent',
		file && 'pointer-events-none border-solid'
	)}
>
	{#if file}
		<button
			class="pointer-events-auto absolute top-0 right-0 mx-2 cursor-pointer text-lg"
			on:click={handleRemove}
		>
			&times;
		</button>
	{/if}
	<p class="max-w-full">{file ? file.name : label}</p>
	<input type="file" {accept} hidden on:change={onChange} />
</label>

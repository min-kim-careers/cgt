<script lang="ts">
	import favicon from '$lib/assets/favicon.svg'
	import Header from '$lib/components/header.svelte'
	import { APP_DATA } from '$lib/constants/app-data'
	import { Toaster } from 'svelte-french-toast'
	import '../app.css'

	let { children } = $props()
</script>

<svelte:head>
	<title>{APP_DATA.title}</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex flex-col items-center justify-between gap-2">
	<div class="h-16 w-full">
		<Header />
	</div>

	<main class="flex flex-1 flex-col p-4">{@render children?.()}</main>

	<!-- <footer></footer> -->
</div>

<Toaster toastOptions={{ duration: 1500 }} />

<script lang="ts">
	import favicon from '$lib/assets/favicon.svg'
	import { APP_DATA } from '$lib/constants/app-data'
	import { Toaster } from 'svelte-french-toast'
	import '../app.css'

	let { children } = $props()
</script>

<svelte:head>
	<title>{APP_DATA.title}</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex flex-col items-center justify-between gap-2 px-8">
	<header class="h-[50px] w-full">
		<div class="flex h-full items-center justify-between">{APP_DATA.title}</div>
	</header>

	<main class="flex flex-1 flex-col p-4">{@render children?.()}</main>

	<!-- <footer></footer> -->
</div>

<Toaster toastOptions={{ duration: 1500 }} />

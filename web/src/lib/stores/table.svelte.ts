import { derived, get, writable } from 'svelte/store'

const PAGE_SIZE = 20

export function createTable<T>(initialData: T[], defaultSort: keyof T) {
	const key = writable<keyof T>(defaultSort)
	const dir = writable<'asc' | 'desc'>('desc')
	const data = writable<T[]>(initialData)
	const page = writable<number>(0)

	const paged = derived([data, page], ([$src, $page]) =>
		$src.slice($page * PAGE_SIZE, ($page + 1) * PAGE_SIZE)
	)
	const totalPages = derived([data], ([$src]) => Math.ceil($src.length / PAGE_SIZE))
	const icons = derived(
		[key, dir],
		([$key, $dir]) =>
			Object.fromEntries(
				(Object.keys(initialData[0] ?? {}) as (keyof T)[]).map((k) => [
					k,
					$key === k ? ($dir === 'asc' ? '↑' : '↓') : ''
				])
			) as Record<keyof T, string>
	)

	const sort = (k: keyof T) => {
		dir.set(get(dir) === 'asc' ? 'desc' : 'asc')
		data.set(
			[...get(data)].sort((a, b) => {
				const av = a[k],
					bv = b[k]
				const cmp =
					typeof av === 'number'
						? (av as number) - (bv as number)
						: av instanceof Date
							? av.getTime() - (bv as Date).getTime()
							: String(av).localeCompare(String(bv))
				return get(dir) === 'asc' ? cmp : -cmp
			})
		)
		key.set(k)
		page.set(0)
	}

	function setData(d: T[]) {
		data.set(d)
		page.set(0)
	}

	return { page, paged, icons, totalPages, sort, setData }
}

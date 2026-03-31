import { derived, get, writable } from 'svelte/store'

const PAGE_SIZE = 20

export type SortDirection = 'asc' | 'desc'

export function createTable<T>(initialData: T[], defaultSort: keyof T) {
	const key = writable<keyof T>(defaultSort)
	const dir = writable<SortDirection>('desc')
	const data = writable<T[]>(initialData)
	const page = writable<number>(0)

	const paged = derived([data, page], ([$data, $page]) =>
		$data.slice($page * PAGE_SIZE, ($page + 1) * PAGE_SIZE)
	)

	const totalPages = derived([data], ([$data]) => Math.ceil($data.length / PAGE_SIZE))

	const icons = derived(
		[data, key, dir],
		([$data, $key, $dir]) =>
			Object.fromEntries(
				(Object.keys($data[0] ?? {}) as (keyof T)[]).map((k) => [
					k,
					$key === k ? ($dir === 'asc' ? '↑' : '↓') : ''
				])
			) as Record<keyof T, string>
	)

	const sortBy = (k: keyof T) => {
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
		sortBy(get(key))
	}

	return { page, paged, icons, totalPages, sortBy, setData }
}

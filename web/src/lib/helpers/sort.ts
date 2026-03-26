export function sort<T>(data: T[], key: keyof T, dir: 'asc' | 'desc' | null) {
	return [...data].sort((a, b) => {
		const av = a[key!],
			bv = b[key!]
		const cmp =
			typeof av === 'number'
				? (av as number) - (bv as number)
				: av instanceof Date
					? av.getTime() - (bv as Date).getTime()
					: String(av).localeCompare(String(bv))
		return dir === 'asc' ? cmp : -cmp
	})
}

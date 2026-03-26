import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const port = process.env.PORT ? Number(process.env.PORT) : undefined
if (!port) {
	throw new Error('Missing PORT')
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		port
	},
	preview: {
		port,
		allowedHosts: [
			'localhost',
			...(process.env.NODE_ENV === 'production' && process.env.HOST ? [process.env.HOST] : [])
		]
	}
})

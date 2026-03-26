import { json } from '@sveltejs/kit'

export const POST = async ({ request, params }) => {
	const body = await request.json()

	switch (params.path) {
		case '':
			break

		default:
			break
	}

	return json({})
}

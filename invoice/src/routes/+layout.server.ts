import { redirect } from '@sveltejs/kit';

import { consumeFlashToast } from '$lib/server/flash';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, locals, url }) => {
	const flash = consumeFlashToast(cookies);

	if (url.pathname === '/login') {
		if (locals.isAdmin) {
			throw redirect(303, '/');
		}

		return {
			flash
		};
	}

	if (!locals.isAdmin) {
		throw redirect(303, '/login');
	}

	return {
		flash
	};
};

import { redirect } from '@sveltejs/kit';

import { SESSION_COOKIE_NAME } from '$lib/server/auth';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, url }) => {
	cookies.delete(SESSION_COOKIE_NAME, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:'
	});

	throw redirect(303, '/login');
};

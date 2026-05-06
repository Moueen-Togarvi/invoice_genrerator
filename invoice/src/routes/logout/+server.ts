import { redirect } from '@sveltejs/kit';

import { SESSION_COOKIE_NAME } from '$lib/server/auth';
import { setFlashToast } from '$lib/server/flash';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, url }) => {
	cookies.delete(SESSION_COOKIE_NAME, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:'
	});
	setFlashToast(
		cookies,
		{
			type: 'success',
			title: 'Logged out',
			message: 'Your admin session has been closed successfully.'
		},
		url.protocol === 'https:'
	);

	throw redirect(303, '/login');
};

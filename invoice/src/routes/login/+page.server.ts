import { fail, redirect } from '@sveltejs/kit';

import {
	createSessionToken,
	hasAdminCredentialsConfigured,
	SESSION_COOKIE_NAME,
	validateAdminCredentials
} from '$lib/server/auth';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		isConfigured: hasAdminCredentialsConfigured()
	};
};

export const actions: Actions = {
	default: async ({ cookies, request, url }) => {
		if (!hasAdminCredentialsConfigured()) {
			return fail(500, {
				misconfigured: true
			});
		}

		const formData = await request.formData();
		const username = String(formData.get('username') ?? '').trim();
		const password = String(formData.get('password') ?? '');

		if (!validateAdminCredentials(username, password)) {
			return fail(400, {
				invalidCredentials: true,
				username
			});
		}

		cookies.set(SESSION_COOKIE_NAME, createSessionToken(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 60 * 60 * 12
		});

		throw redirect(303, '/');
	}
};

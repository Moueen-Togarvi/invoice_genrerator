import type { Handle } from '@sveltejs/kit';

import { isValidAdminSession, SESSION_COOKIE_NAME } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(SESSION_COOKIE_NAME);
	event.locals.isAdmin = isValidAdminSession(sessionToken);

	return resolve(event);
};

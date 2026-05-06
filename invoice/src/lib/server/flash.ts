import type { Cookies } from '@sveltejs/kit';

import { TOAST_COOKIE_NAME, type Toast } from '$lib/toast';

function createToastId() {
	return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function setFlashToast(
	cookies: Cookies,
	toast: Omit<Toast, 'id'>,
	secure: boolean
) {
	const payload: Toast = {
		id: createToastId(),
		...toast
	};

	cookies.set(TOAST_COOKIE_NAME, JSON.stringify(payload), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge: 10
	});
}

export function consumeFlashToast(cookies: Cookies) {
	const rawToast = cookies.get(TOAST_COOKIE_NAME);

	if (!rawToast) {
		return null;
	}

	cookies.delete(TOAST_COOKIE_NAME, {
		path: '/'
	});

	try {
		const parsedToast = JSON.parse(rawToast) as Partial<Toast>;

		if (
			typeof parsedToast.id !== 'string' ||
			typeof parsedToast.type !== 'string' ||
			typeof parsedToast.title !== 'string' ||
			typeof parsedToast.message !== 'string'
		) {
			return null;
		}

		return parsedToast as Toast;
	} catch {
		return null;
	}
}

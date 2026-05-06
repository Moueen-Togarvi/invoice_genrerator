import { writable } from 'svelte/store';

import type { Toast } from '$lib/toast';

const { subscribe, update } = writable<Toast[]>([]);

function createToastId() {
	return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const toasts = {
	subscribe
};

export function removeToast(id: string) {
	update((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
}

export function pushToast(toast: Omit<Toast, 'id'> & { id?: string }) {
	const id = toast.id ?? createToastId();

	update((currentToasts) => [...currentToasts.slice(-2), { ...toast, id }]);

	setTimeout(() => {
		removeToast(id);
	}, 4000);
}

export type ToastType = 'success' | 'error';

export type Toast = {
	id: string;
	type: ToastType;
	title: string;
	message: string;
};

export const TOAST_COOKIE_NAME = 'flash_toast';

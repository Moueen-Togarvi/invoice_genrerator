import { createHmac, timingSafeEqual } from 'node:crypto';

import { env } from '$env/dynamic/private';

export const SESSION_COOKIE_NAME = 'admin_session';

function getAdminConfig() {
	const { ADMIN_PASSWORD, ADMIN_USERNAME, AUTH_SECRET } = env;

	if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !AUTH_SECRET) {
		return null;
	}

	return {
		ADMIN_USERNAME,
		ADMIN_PASSWORD,
		AUTH_SECRET
	};
}

function safeEqual(left: string, right: string) {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);

	if (leftBuffer.length !== rightBuffer.length) {
		return false;
	}

	return timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeUsername(value: string) {
	return value.trim().toLowerCase();
}

function normalizePassword(value: string) {
	return value.trim();
}

export function hasAdminCredentialsConfigured() {
	return getAdminConfig() !== null;
}

export function validateAdminCredentials(username: string, password: string) {
	const config = getAdminConfig();

	if (!config) {
		return false;
	}

	const { ADMIN_PASSWORD, ADMIN_USERNAME } = config;

	return (
		safeEqual(normalizeUsername(username), normalizeUsername(ADMIN_USERNAME)) &&
		safeEqual(normalizePassword(password), normalizePassword(ADMIN_PASSWORD))
	);
}

export function createSessionToken() {
	const config = getAdminConfig();

	if (!config) {
		return '';
	}

	const { ADMIN_PASSWORD, ADMIN_USERNAME, AUTH_SECRET } = config;

	return createHmac('sha256', AUTH_SECRET)
		.update(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}:admin-session`)
		.digest('hex');
}

export function isValidAdminSession(sessionToken: string | undefined) {
	if (!sessionToken || !hasAdminCredentialsConfigured()) {
		return false;
	}

	return safeEqual(sessionToken, createSessionToken());
}

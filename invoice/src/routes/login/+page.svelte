<svelte:options runes={false} />

<script lang="ts">
	import { browser } from '$app/environment';
	import { pushToast } from '$lib/toast-store';

	export let data: {
		isConfigured: boolean;
	};

	export let form:
		| {
				invalidCredentials?: boolean;
				misconfigured?: boolean;
				username?: string;
		  }
		| undefined;

	let showPassword = false;
	let username = form?.username ?? '';
	let password = '';

	$: if (form?.username !== undefined && form.username !== username) {
		username = form.username;
	}

	let lastToastKey = '';

	$: {
		if (browser) {
			const nextToastKey = form?.invalidCredentials
				? `invalid:${form.username ?? ''}`
				: form?.misconfigured
					? 'misconfigured'
					: '';

			if (nextToastKey && nextToastKey !== lastToastKey) {
				lastToastKey = nextToastKey;

				pushToast({
					type: 'error',
					title: form?.misconfigured ? 'Configuration missing' : 'Login failed',
					message: form?.misconfigured
						? 'Set the admin environment variables before signing in.'
						: 'Incorrect username or password.'
				});
			}
		}
	}
</script>

<svelte:head>
	<title>Admin Login | Coded Clouds Invoice Tool</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_48%,_#ffffff_100%)] px-6 py-10 text-slate-900">
	<div class="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:p-10">
		<div class="mb-8 text-center">
			<div class="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
				<i class="fas fa-lock text-xl"></i>
			</div>
			<p class="mt-5 text-sm font-semibold uppercase tracking-[0.35em] text-blue-700">Admin Sign In</p>
			<h2 class="mt-4 text-4xl font-black tracking-tight text-slate-900">Welcome back</h2>
			<p class="mt-3 text-base leading-7 text-slate-500">
				Enter your admin credentials to continue to the invoice generator.
			</p>
		</div>

		{#if !data.isConfigured || form?.misconfigured}
			<div class="mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
				Set <code>ADMIN_USERNAME</code>, <code>ADMIN_PASSWORD</code>, and <code>AUTH_SECRET</code>
				in your environment before signing in.
			</div>
		{/if}

		<form method="POST" class="space-y-5">
			<div>
				<label for="username" class="mb-2 block text-sm font-semibold text-slate-700">Username</label>
				<input
					id="username"
					name="username"
					type="text"
					autocomplete="username"
					bind:value={username}
					class="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
					placeholder="Admin username"
					required
				/>
			</div>

			<div>
				<div class="mb-2 flex items-center justify-between">
					<label for="password" class="block text-sm font-semibold text-slate-700">Password</label>
					<button
						type="button"
						class="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
						aria-label={showPassword ? 'Hide password' : 'Show password'}
						aria-pressed={showPassword}
						onclick={() => {
							showPassword = !showPassword;
						}}
					>
						<i class={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
						<span>{showPassword ? 'Hide' : 'Show'} password</span>
					</button>
				</div>
				<div class="relative">
					<input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						autocomplete="current-password"
						bind:value={password}
						class="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
						placeholder="Admin password"
						required
					/>
					<div class="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-300">
						<i class="fas fa-lock"></i>
					</div>
				</div>
			</div>

			<input
				type="submit"
				class="w-full rounded-3xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
				value="Sign in"
				disabled={!data.isConfigured}
			/>

			<p class="text-center text-sm leading-6 text-slate-500">
				This is a single-admin protected area. Access is controlled through secure server-side
				environment variables.
			</p>
		</form>
	</div>
</div>

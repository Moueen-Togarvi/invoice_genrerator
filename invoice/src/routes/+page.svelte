<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import { pushToast } from '$lib/toast-store';

	type CurrencyCode = 'SAR';
	type ItemType = 'onetime' | 'monthly';

	type InvoiceItem = {
		name: string;
		price: number;
		type: ItemType;
	};

	type CurrencyConfig = {
		label: string;
		symbol: string;
		defaultUsdRate: number;
		defaultEurRate: number;
		priceHint: string;
	};

	type JsPdfDocument = {
		addPage: () => void;
		autoTable: (options: Record<string, unknown>) => void;
		lastAutoTable?: { finalY: number };
		line: (x1: number, y1: number, x2: number, y2: number) => void;
		output: (type: string) => string;
		rect: (x: number, y: number, w: number, h: number, style?: string) => void;
		setDrawColor: (r: number, g?: number, b?: number) => void;
		setFillColor: (r: number, g?: number, b?: number) => void;
		setFont: (font: string, style: string) => void;
		setFontSize: (size: number) => void;
		setTextColor: (r: number, g?: number, b?: number) => void;
		splitTextToSize: (text: string, size: number) => string[];
		text: (
			text: string | string[],
			x: number,
			y: number,
			options?: { align?: 'left' | 'center' | 'right' }
		) => void;
	};

	type JsPdfConstructor = new () => JsPdfDocument;

	const TERMS_TEXT = `TERMS & CONDITIONS

a. Service Scope & Nature
Coded Clouds provides digital, technical, development, and marketing services as outlined in this invoice. Services may be one-time or recurring, depending on the agreed scope.

b. Payment Terms
All fees must be paid in advance. Monthly recurring services must be cleared before the 5th of each billing month. Failure to make timely payments may result in service suspension.

c. Separation of Advertising Budget
Paid advertising budgets are separate from service fees and are not included unless explicitly stated.

2. Advertising Payment Options
The client may choose one of the following:
3. Client-Paid Ads: Client uses their own card; platforms charge directly. No tax, ITF, or currency conversion charges apply from Coded Clouds.
4. Coded Clouds-Managed Ads: Client authorizes Coded Clouds to process ad payments and pays the full monthly ad budget in advance.

5. Currency & Exchange Rate Disclaimer
When ads are paid through Coded Clouds, USD and EUR conversions are indicative only. Final payable amounts may vary due to foreign exchange rate fluctuations. Any increase or decrease due to rate changes shall be borne by the client.

6. Taxes & Regulatory Charges
Applicable Tax (10%) and ITF (6%) apply only when Coded Clouds collects or processes funds on behalf of the client.

7. Non-Refundable Ad Spend
Advertising budgets are non-refundable once campaigns are launched or funds are allocated, regardless of performance, reach, or conversions.

8. Performance Disclaimer
Coded Clouds does not guarantee specific results, leads, sales, reach, or engagement. Outcomes depend on platform algorithms, market conditions, audience behavior, and third-party policies.

9. Client Responsibilities
The client is responsible for providing accurate information, brand assets, approvals, content inputs, and timely feedback required to execute services effectively.

10. Access & Permissions
The client must grant required administrative, advertiser, or system access. Delays or limitations in access may impact timelines and performance and are not the responsibility of Coded Clouds.

11. Content Approval & Execution
Where content approval is required, delays in client feedback may result in adjusted schedules. If no response is received within a reasonable time, Coded Clouds may proceed based on the approved strategy.

12. Strategy & Optimization Rights
Coded Clouds reserves the right to adjust strategies, formats, schedules, or campaign structures to improve performance while remaining within the agreed scope.

13. Scope Limitations
Any services, platforms, campaigns, or deliverables outside the agreed scope require separate discussion, approval, and additional charges.

14. Platform Policies & Third Parties
Coded Clouds is not responsible for policy changes, technical issues, downtime, restrictions, or suspensions imposed by third-party platforms.

15. Intellectual Property Rights
All creatives, designs, code, content, and materials produced by Coded Clouds remain the property of the agency until full payment is received. Upon payment, usage rights are granted to the client.

16. Portfolio & Marketing Usage
Coded Clouds reserves the right to showcase completed work in its portfolio, website, or marketing materials unless the client requests otherwise in writing.

17. Confidentiality
Both parties agree to maintain confidentiality of all sensitive business information, credentials, strategies, and data shared during the engagement.

18. Limitation of Liability
Coded Clouds shall not be liable for any indirect, incidental, special, or consequential damages, including loss of revenue, profit, data, or business opportunities.

19. Indemnification
The client agrees to indemnify and hold harmless Coded Clouds from any claims, penalties, damages, or legal costs arising from client-provided content, instructions, or business activities.

20. Service Suspension & Termination
Coded Clouds reserves the right to suspend or terminate services due to non-payment, breach of terms, or misuse of services. Outstanding dues must be settled prior to termination.

21. Force Majeure
Coded Clouds shall not be held liable for delays or failures caused by circumstances beyond reasonable control.

22. No Employment or Partnership
Nothing in this invoice or engagement shall be deemed to create an employment relationship, partnership, or joint venture between the client and Coded Clouds.

23. Governing Law
This invoice and all services provided under it shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan.

24. Jurisdiction
Any disputes arising from this invoice or related services shall fall under the exclusive jurisdiction of the competent courts.

25. Final Authority
Coded Clouds retains final operational authority over execution methods while adhering to the agreed scope and professional standards.`;

	const currencyConfigs: Record<CurrencyCode, CurrencyConfig> = {
		SAR: {
			label: 'Saudi Riyal',
			symbol: 'SAR',
			defaultUsdRate: 3.75,
			defaultEurRate: 4.05,
			priceHint: 'SAR'
		}
	};

	let baseCurrency: CurrencyCode = 'SAR';
	let invoiceNum = 'CC-085';
	let invoiceDate = '';
	let rateUsd = currencyConfigs.SAR.defaultUsdRate;
	let rateEur = currencyConfigs.SAR.defaultEurRate;
	let importantNotes = `• Ad spend is separate from service fees
• Taxes apply only when Coded Clouds collects ad budget
• Performance depends on platform algorithms and market behavior`;
	let items: InvoiceItem[] = [
		{ name: 'Web Design & Development', price: 450, type: 'onetime' },
		{ name: 'Digital Marketing Retainer', price: 250, type: 'monthly' }
	];
	let previewUrl = '';
	let scriptsReady = false;
	let previewTick = 0;

	const paymentTerms = [
		'1. All payments must be cleared in advance before services commence.',
		'2. Services will commence only after payment is successfully received and verified.',
		'3. Invoice number must be mentioned in all payment references.',
		"4. Any bank charges, intermediary fees, or conversion costs are the client's responsibility.",
		'5. Contact for Confirmation: info@codedclouds.org | +966-557385262'
	];

	function getToday() {
		return new Date().toISOString().slice(0, 10);
	}

	function loadScript(src: string) {
		return new Promise<void>((resolve, reject) => {
			if (document.querySelector(`script[src="${src}"]`)) {
				resolve();
				return;
			}

			const script = document.createElement('script');
			script.src = src;
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Failed to load ${src}`));
			document.head.appendChild(script);
		});
	}

	function getJsPdfConstructor() {
		return (
			(window as Window & { jspdf?: { jsPDF?: JsPdfConstructor } }).jspdf?.jsPDF ?? null
		);
	}

	function getActiveCurrency() {
		return currencyConfigs[baseCurrency];
	}

	function formatMoney(amount: number, currency: CurrencyCode | 'USD' | 'EUR') {
		return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function updateItem(index: number, field: keyof InvoiceItem, value: string) {
		const updated = [...items];
		updated[index] = {
			...updated[index],
			[field]: field === 'price' ? Number(value) || 0 : value
		} as InvoiceItem;
		items = updated;
		schedulePreview();
	}

	function addNewItem() {
		items = [...items, { name: '', price: 0, type: 'onetime' }];
		schedulePreview();
		pushToast({
			type: 'success',
			title: 'Item created',
			message: 'A new service item has been added to the invoice.'
		});
	}

	function deleteItem(index: number) {
		items = items.filter((_, itemIndex) => itemIndex !== index);
		schedulePreview();
		pushToast({
			type: 'error',
			title: 'Item deleted',
			message: `Service item ${index + 1} was removed from the invoice.`
		});
	}

	async function generatePDFBlobUrl() {
		const JsPDF = getJsPdfConstructor();
		if (!JsPDF) return '';

		const doc = new JsPDF();
		const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
		const toUsd = (value: number) => (rateUsd ? value / rateUsd : 0);
		const toEur = (value: number) => (rateEur ? value / rateEur : 0);

		doc.setFontSize(24);
		doc.setTextColor(26, 86, 219);
		doc.setFont('helvetica', 'bold');
		doc.text('CODED CLOUDS', 14, 20);

		doc.setFontSize(10);
		doc.setTextColor(100);
		doc.setFont('helvetica', 'normal');
		doc.text('Your Cloud, Our Code', 14, 26);

		doc.setFontSize(10);
		doc.setTextColor(0);
		doc.text(`Invoice Number: ${invoiceNum}`, 195, 20, { align: 'right' });
		doc.text(`Date: ${invoiceDate}`, 195, 25, { align: 'right' });
		doc.text(`Base Currency: ${baseCurrency}`, 195, 30, { align: 'right' });

		let finalY = 40;

		const generateSection = (title: string, filterType: ItemType) => {
			const filtered = items.filter((item) => item.type === filterType);
			if (!filtered.length) return;

			doc.setFontSize(12);
			doc.setTextColor(26, 86, 219);
			doc.setFont('helvetica', 'bold');
			doc.text(title, 14, finalY);
			finalY += 3;

			const tableData = filtered.map((item) => [
				item.name,
				`${formatMoney(item.price, baseCurrency)}\n($${toUsd(item.price).toFixed(2)}) (€${toEur(item.price).toFixed(2)})`
			]);

			doc.autoTable({
				startY: finalY,
				head: [['Description', 'Amount']],
				body: tableData,
				theme: 'plain',
				headStyles: {
					fillColor: [245, 247, 250],
					textColor: [50, 50, 50],
					fontStyle: 'bold',
					lineWidth: { bottom: 0.5 },
					lineColor: [200, 200, 200]
				},
				styles: {
					fontSize: 10,
					cellPadding: 4,
					valign: 'middle',
					lineWidth: { bottom: 0.1 },
					lineColor: [230, 230, 230]
				},
				columnStyles: {
					0: { cellWidth: 'auto' },
					1: { halign: 'right', fontStyle: 'bold', cellWidth: 50 }
				}
			});

			finalY = (doc.lastAutoTable?.finalY ?? finalY) + 10;
		};

		generateSection('SECTION A: ONE-TIME SERVICES', 'onetime');
		generateSection('SECTION B: MONTHLY SERVICES', 'monthly');

		if (finalY > 250) {
			doc.addPage();
			finalY = 20;
		}

		doc.setFontSize(14);
		doc.setTextColor(0);
		doc.setFont('helvetica', 'bold');
		doc.text(`Total: ${formatMoney(totalAmount, baseCurrency)}`, 195, finalY, { align: 'right' });

		doc.setFontSize(10);
		doc.setTextColor(100);
		doc.setFont('helvetica', 'normal');
		doc.text(`(${formatMoney(toUsd(totalAmount), 'USD')})`, 195, finalY + 5, { align: 'right' });
		doc.text(`(${formatMoney(toEur(totalAmount), 'EUR')})`, 195, finalY + 10, {
			align: 'right'
		});

		finalY += 20;

		if (importantNotes.trim()) {
			if (finalY > 240) {
				doc.addPage();
				finalY = 20;
			}

			const splitNotes = doc.splitTextToSize(importantNotes, 170);
			const boxHeight = Math.max(28, splitNotes.length * 4 + 14);

			doc.setFillColor(255, 252, 235);
			doc.setDrawColor(250, 204, 21);
			doc.rect(14, finalY, 182, boxHeight, 'FD');

			doc.setFontSize(11);
			doc.setTextColor(161, 98, 7);
			doc.setFont('helvetica', 'bold');
			doc.text('IMPORTANT NOTES', 18, finalY + 8);

			doc.setFontSize(9);
			doc.setTextColor(50);
			doc.setFont('helvetica', 'normal');
			doc.text(splitNotes, 18, finalY + 14);

			finalY += boxHeight + 10;
		}

		if (finalY > 180) {
			doc.addPage();
			finalY = 20;
		}

		doc.setFillColor(55, 65, 81);
		doc.rect(14, finalY, 182, 8, 'F');
		doc.setTextColor(255);
		doc.setFontSize(10);
		doc.setFont('helvetica', 'bold');
		doc.text('PAYMENT DETAILS', 18, finalY + 5.5);

		finalY += 15;
		doc.setFontSize(9);
		doc.setTextColor(0);
		doc.setFont('helvetica', 'normal');

		const col1X = 14;
		const col2X = 110;
		let currentY = finalY;

		doc.setFont('helvetica', 'bold');
		doc.text('Bank Transfer - Standard Chartered Bank', col1X, currentY);
		doc.setFont('helvetica', 'normal');
		currentY += 5;
		doc.text('Account Title: Saqib Ali', col1X, currentY);
		currentY += 4;
		doc.text('Account Number: 01703329601', col1X, currentY);
		currentY += 4;
		doc.text('IBAN: PK03SCBL0000001703329601', col1X, currentY);
		currentY += 4;
		doc.text('Currency: USD / Riyal / Euro', col1X, currentY);

		currentY = finalY;
		doc.setFont('helvetica', 'bold');
		doc.text('Bank Transfer - STC Bank', col2X, currentY);
		doc.setFont('helvetica', 'normal');
		currentY += 5;
		doc.text('Account Title: Muhammad Ali', col2X, currentY);
		currentY += 4;
		doc.text('IBAN: SA1378000000001252725888', col2X, currentY);
		currentY += 4;
		doc.text('Currency: USD / Riyal / Euro', col2X, currentY);

		currentY = finalY + 25;
		doc.setFont('helvetica', 'bold');
		doc.text('Mobile Wallet - JazzCash', col1X, currentY);
		doc.setFont('helvetica', 'normal');
		currentY += 5;
		doc.text('Account Title: Saqib Ali | Mobile: 0321 9456344', col1X, currentY);

		finalY = currentY + 15;

		if (finalY > 250) {
			doc.addPage();
			finalY = 20;
		}

		doc.setFontSize(10);
		doc.setFont('helvetica', 'bold');
		doc.text('Payment Terms', 14, finalY);
		finalY += 5;
		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');

		for (const line of paymentTerms) {
			doc.text(line, 14, finalY);
			finalY += 4;
		}

		doc.addPage();
		doc.setFontSize(11);
		doc.setFont('helvetica', 'bold');
		doc.text('TERMS & CONDITIONS', 14, 20);

		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');
		doc.text(doc.splitTextToSize(TERMS_TEXT, 180), 14, 30);

		const footerY = 280;
		doc.setDrawColor(200);
		doc.line(14, footerY - 5, 196, footerY - 5);
		doc.setFontSize(8);
		doc.setTextColor(100);
		doc.text(
			'Coded Clouds | codedclouds.org | info@codedclouds.org | PK: +92 3199737649 | KSA: +966 557385262',
			105,
			footerY,
			{ align: 'center' }
		);

		return doc.output('bloburl');
	}

	async function updatePreview() {
		if (!scriptsReady) return;

		const tick = ++previewTick;
		const nextUrl = await generatePDFBlobUrl();
		if (tick !== previewTick) return;

		if (previewUrl.startsWith('blob:')) {
			URL.revokeObjectURL(previewUrl);
		}

		previewUrl = nextUrl;
	}

	function schedulePreview() {
		void updatePreview();
	}

	function downloadPDF() {
		if (!previewUrl) return;

		const link = document.createElement('a');
		link.href = previewUrl;
		link.download = `Invoice-${invoiceNum}.pdf`;
		link.click();
	}

	onMount(() => {
		let mounted = true;

		(async () => {
			invoiceDate = getToday();
			await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
			await loadScript(
				'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js'
			);

			if (!mounted) return;
			scriptsReady = true;
			await updatePreview();
		})().catch((error) => {
			console.error(error);
		});

		return () => {
			mounted = false;
			if (previewUrl.startsWith('blob:')) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	});
</script>

<svelte:head>
	<title>Coded Clouds Invoice Tool v2</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 font-sans md:flex md:flex-row overflow-hidden">
	<div class="z-10 h-full w-full overflow-y-auto bg-white p-8 shadow-lg md:w-1/2">
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-blue-800">Invoice Generator</h1>
				<p class="text-sm text-gray-500">Coded Clouds Internal Tool</p>
			</div>
			<div class="flex items-center gap-3 text-right">
				<span class="rounded bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">v2.0</span>
				<form method="POST" action="/logout">
					<button
						type="submit"
						class="rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-gray-400 hover:text-gray-900"
					>
						Log out
					</button>
				</form>
			</div>
		</div>

		<div class="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
			<h3 class="mb-3 border-b pb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
				Invoice Headers
			</h3>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label for="invoice-num" class="mb-1 block text-xs font-bold text-gray-500">Invoice #</label>
					<input
						id="invoice-num"
						type="text"
						bind:value={invoiceNum}
						class="w-full rounded border p-2 outline-none transition focus:ring-2 focus:ring-blue-500"
						oninput={schedulePreview}
					/>
				</div>
				<div>
					<label for="invoice-date" class="mb-1 block text-xs font-bold text-gray-500">Date</label>
					<input
						id="invoice-date"
						type="date"
						bind:value={invoiceDate}
						class="w-full rounded border p-2 outline-none transition focus:ring-2 focus:ring-blue-500"
						oninput={schedulePreview}
					/>
				</div>
				<div>
					<label for="base-currency" class="mb-1 block text-xs font-bold text-gray-500">Base Currency</label>
					<input
						id="base-currency"
						type="text"
						value="SAR - Saudi Riyal"
						class="w-full rounded border bg-gray-100 p-2 text-gray-500 outline-none"
						disabled
					/>
				</div>
				<div>
					<label for="usd-rate" class="mb-1 block text-xs font-bold text-gray-500">USD Rate ({baseCurrency})</label>
					<input
						id="usd-rate"
						type="number"
						bind:value={rateUsd}
						class="w-full rounded border p-2 outline-none transition focus:ring-2 focus:ring-blue-500"
						oninput={schedulePreview}
					/>
				</div>
				<div>
					<label for="eur-rate" class="mb-1 block text-xs font-bold text-gray-500">EUR Rate ({baseCurrency})</label>
					<input
						id="eur-rate"
						type="number"
						bind:value={rateEur}
						class="w-full rounded border p-2 outline-none transition focus:ring-2 focus:ring-blue-500"
						oninput={schedulePreview}
					/>
				</div>
			</div>
		</div>

		<div class="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-5">
			<h3 class="mb-2 flex items-center text-xs font-bold uppercase tracking-wide text-yellow-800">
				<i class="fas fa-exclamation-circle mr-2"></i> Important Notes
			</h3>
			<label for="important-notes" class="sr-only">Important Notes</label>
			<textarea
				id="important-notes"
				rows="4"
				bind:value={importantNotes}
				class="w-full rounded border border-yellow-300 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-500"
				oninput={schedulePreview}
			></textarea>
			<p class="mt-1 text-[10px] text-yellow-600">
				These notes will appear prominently before the Terms & Conditions.
			</p>
		</div>

		<div class="mb-6 space-y-3">
			{#each items as item, index}
				<div
					class="group flex items-start gap-2 rounded border border-gray-200 bg-white p-3 shadow-sm transition hover:border-blue-300"
				>
					<div class="flex-1">
						<input
							type="text"
							value={item.name}
							placeholder="Service Name"
							class="mb-1 w-full border-b border-transparent p-1 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500"
							oninput={(event) =>
								updateItem(index, 'name', (event.currentTarget as HTMLInputElement).value)}
						/>
						<select
							value={item.type}
							class="rounded bg-gray-100 p-1 text-[10px] font-bold uppercase tracking-wider text-gray-600"
							onchange={(event) =>
								updateItem(index, 'type', (event.currentTarget as HTMLSelectElement).value)}
						>
							<option value="onetime">One-Time Service</option>
							<option value="monthly">Monthly Service</option>
						</select>
					</div>
					<div class="w-28">
						<input
							type="number"
							value={item.price}
							placeholder="0"
							class="w-full rounded border bg-gray-50 p-1 text-right text-sm font-mono transition focus:bg-white"
							oninput={(event) =>
								updateItem(index, 'price', (event.currentTarget as HTMLInputElement).value)}
						/>
						<div class="mt-1 text-right text-[10px] text-gray-400">{getActiveCurrency().priceHint}</div>
					</div>
					<button
						type="button"
						aria-label={`Delete service item ${index + 1}`}
						class="p-2 text-gray-300 transition hover:text-red-500"
						onclick={() => deleteItem(index)}
					>
						<i class="fas fa-trash-alt"></i>
					</button>
				</div>
			{/each}
		</div>

		<button
			type="button"
			class="mb-6 w-full rounded-lg border-2 border-dashed border-blue-200 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
			onclick={addNewItem}
		>
			<i class="fas fa-plus-circle mr-2"></i> Add Service Item
		</button>

		<button
			type="button"
			class="flex w-full items-center justify-center rounded-lg bg-blue-800 py-4 text-lg font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-blue-900"
			onclick={downloadPDF}
			disabled={!previewUrl}
		>
			<i class="fas fa-file-pdf mr-2"></i> Download Official PDF
		</button>
	</div>

	<div class="flex h-[50vh] w-full items-center justify-center bg-gray-700 p-4 md:h-screen md:w-1/2 md:p-8">
		{#if previewUrl}
			<iframe title="PDF Preview" class="h-full w-full rounded border-0 bg-white shadow-2xl" src={previewUrl}></iframe>
		{:else}
			<div class="rounded bg-white/10 px-4 py-3 text-sm text-white">
				{scriptsReady ? 'Preview unavailable.' : 'Loading PDF preview...'}
			</div>
		{/if}
	</div>
</div>

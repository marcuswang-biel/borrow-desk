import { Resend } from 'resend';

/** One language the activation mail can use. */
type ActivationLocale = 'en' | 'zh' | 'zh-Hant';

/** Page language sent with the auth request. */
const localeHeader = 'x-borrow-desk-locale';

/** Reads the page language. Anything else is English. */
const localeOf = (request: Request | undefined): ActivationLocale => {
	const header = request?.headers.get(localeHeader);
	if (header === 'zh' || header === 'zh-Hant') {
		return header;
	}
	return 'en';
};

/** Escapes text placed in the HTML mail. */
const escapeHtml = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');

/** Subject and body for one activation mail. */
const messageFor = (locale: ActivationLocale, name: string, url: string) => {
	const safeName = escapeHtml(name);
	const safeUrl = escapeHtml(url);
	if (locale === 'zh') {
		return {
			subject: '激活你的借用台账号',
			text: `${name}，你好。\n\n打开这个链接激活账号。激活之后才能使用借用台。\n\n${url}\n`,
			html: `<p>${safeName}，你好。</p><p>打开这个链接激活账号。激活之后才能使用借用台。</p><p><a href="${safeUrl}">激活账号</a></p>`,
		};
	}
	if (locale === 'zh-Hant') {
		return {
			subject: '激活你的借用台帳號',
			text: `${name}，你好。\n\n打開這個連結激活帳號。激活之後才能使用借用台。\n\n${url}\n`,
			html: `<p>${safeName}，你好。</p><p>打開這個連結激活帳號。激活之後才能使用借用台。</p><p><a href="${safeUrl}">激活帳號</a></p>`,
		};
	}
	return {
		subject: 'Activate your Borrow Desk account',
		text: `Hello ${name},\n\nOpen this link to activate your account. You can use Borrow Desk after it is activated.\n\n${url}\n`,
		html: `<p>Hello ${safeName},</p><p>Open this link to activate your account. You can use Borrow Desk after it is activated.</p><p><a href="${safeUrl}">Activate account</a></p>`,
	};
};

/** Person and link Better Auth hands to the mail sender. */
type ActivationLink = {
	user: { email: string; name: string };
	url: string;
};

/**
 * Sends one activation link through Resend.
 * Development without RESEND_API_KEY prints the link and does not call Resend.
 */
export const sendActivationEmail =
	(delivery: Resend | undefined, from: string) =>
	async (data: ActivationLink, request?: Request) => {
		if (delivery === undefined) {
			console.info(`RESEND_API_KEY is empty. Activation link for ${data.user.email}: ${data.url}`);
			return;
		}
		const message = messageFor(localeOf(request), data.user.name, data.url);
		const sent = await delivery.emails.send({
			from,
			to: data.user.email,
			subject: message.subject,
			text: message.text,
			html: message.html,
		});
		if (sent.error) {
			throw new Error(sent.error.message);
		}
	};

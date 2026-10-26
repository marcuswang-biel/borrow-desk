import type { ReminderNotice } from '@borrow-desk/api';

import * as Effect from 'effect/Effect';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';

import { useSession } from '../auth/index.ts';
import {
	changeLocale,
	formatWhen,
	listReminders,
	localeTag,
	run,
	shown,
	type DeskError,
} from '../lib/index.ts';
import {
	btnMenu,
	btnQuiet,
	btnSecondary,
	languageSelectBar,
	languageSelectMenu,
	meta,
} from '../lib/ui.ts';
import { routes } from '../routes/index.tsx';

/** Numbered tag. The mark is the object the desk lends, drawn in the data hue. */
const DeskMark = () => (
	<svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
		<path
			d="M3.5 5.2A2.2 2.2 0 0 1 5.7 3h6.2c.7 0 1.3.3 1.7.9l2.8 4.1c.4.6.4 1.4 0 2l-2.8 4.1c-.4.6-1 .9-1.7.9H5.7a2.2 2.2 0 0 1-2.2-2.2V5.2Z"
			fill="#1b6c80"
		/>
		<circle cx="7" cy="10" fill="#ffffff" r="1.2" />
	</svg>
);

/** Header, language, reminders, and the matched page. */
export const Shell = () => {
	const { t, i18n } = useTranslation();
	const { status, user, reminders, replaceReminders, signOut } = useSession();
	const navigate = useNavigate();
	const remindersPanel = useRef<HTMLDialogElement>(null);
	const menuPanel = useRef<HTMLDialogElement>(null);
	const [remindersOpen, setRemindersOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [reminderError, setReminderError] = useState('');
	const [opening, setOpening] = useState(false);
	const [signOutError, setSignOutError] = useState('');
	const [signingOut, setSigningOut] = useState(false);

	useEffect(() => {
		document.title = t('title');
		document.documentElement.lang = localeTag(i18n.language);
	}, [i18n.language, t]);

	const onLanguage = (event: ChangeEvent<HTMLSelectElement>) => {
		const next = event.currentTarget.value;
		if (next === 'en' || next === 'zh') {
			void changeLocale(next);
		}
	};

	const openReminders = () => {
		if (opening) {
			return;
		}
		setOpening(true);
		setReminderError('');
		void run(
			listReminders.pipe(
				Effect.matchEffect({
					onSuccess: (next: ReadonlyArray<ReminderNotice>) =>
						Effect.sync(() => {
							replaceReminders(next);
							setRemindersOpen(true);
							remindersPanel.current?.showModal();
						}),
					onFailure: (error: DeskError) =>
						Effect.sync(() => {
							setReminderError(shown(error));
							setRemindersOpen(true);
							remindersPanel.current?.showModal();
						}),
				}),
				Effect.ensuring(
					Effect.sync(() => {
						setOpening(false);
					}),
				),
			),
		);
	};

	const leave = () => {
		if (signingOut) {
			return;
		}
		setSignOutError('');
		setSigningOut(true);
		void run(
			signOut.pipe(
				Effect.tap(() =>
					Effect.sync(() => {
						remindersPanel.current?.close();
						menuPanel.current?.close();
						navigate('/');
					}),
				),
				Effect.catch((error) =>
					Effect.sync(() => {
						setSignOutError(shown(error));
					}),
				),
				Effect.ensuring(
					Effect.sync(() => {
						setSigningOut(false);
					}),
				),
			),
		);
	};

	const language = i18n.language.startsWith('zh') ? 'zh' : 'en';
	const home = status === 'signed-in' ? '/equipment' : '/';

	const sections = (
		<nav aria-label={t('navLabel')} className="flex flex-col gap-1">
			{routes.map((route) => (
				<NavLink
					className="text-muted hover:text-ink aria-[current=page]:border-ink aria-[current=page]:text-ink flex min-h-[34px] items-center self-start border-b-2 border-transparent px-2 font-medium no-underline aria-[current=page]:font-semibold"
					key={route.to}
					onClick={() => {
						menuPanel.current?.close();
					}}
					to={route.to}
				>
					{t(route.tTag)}
				</NavLink>
			))}
		</nav>
	);

	const account =
		status === 'signed-in' && user !== undefined ? (
			<div className="mt-auto flex flex-col gap-2 px-2 [&_p]:m-0">
				<button
					aria-busy={signingOut}
					className={btnQuiet}
					disabled={signingOut}
					onClick={leave}
					type="button"
				>
					{t('signOut')}
				</button>
				{signOutError.length > 0 ? (
					<p className="text-negative m-0" role="alert">
						{signOutError}
					</p>
				) : null}
			</div>
		) : null;

	return (
		<div className="bg-ground grid min-h-dvh grid-cols-[228px_minmax(0,1fr)] grid-rows-[48px_minmax(0,1fr)] max-md:grid-cols-1">
			<aside className="col-start-1 row-span-2 row-start-1 flex min-w-0 flex-col gap-6 px-3 py-4 max-md:hidden">
				<Link
					className="text-ink flex shrink-0 items-center gap-2 text-sm leading-5 font-semibold no-underline"
					to={home}
				>
					<DeskMark />
					<span>{t('title')}</span>
				</Link>
				{status === 'signed-in' ? sections : null}
				{account}
			</aside>
			<header className="col-start-2 row-start-1 flex min-w-0 items-center justify-end gap-3 px-4 max-md:col-start-1">
				<button
					aria-controls="sections"
					aria-expanded={menuOpen}
					aria-haspopup="dialog"
					className={btnMenu}
					onClick={() => {
						setMenuOpen(true);
						menuPanel.current?.showModal();
					}}
					type="button"
				>
					{t('menu')}
				</button>
				<Link
					className="text-ink mr-auto hidden shrink-0 items-center gap-2 text-sm leading-5 font-semibold no-underline max-md:inline-flex"
					to={home}
				>
					<DeskMark />
					<span>{t('title')}</span>
				</Link>
				<div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
					{status === 'signed-in' && user !== undefined ? (
						<p>{t('signedIn', { name: user.name, role: t(`role.${user.role}`) })}</p>
					) : null}
					<select
						aria-label={t('language')}
						className={languageSelectBar}
						onChange={onLanguage}
						value={language}
					>
						<option value="en">English</option>
						<option value="zh">中文</option>
					</select>
					{status === 'signed-in' ? (
						<button
							aria-busy={opening}
							aria-controls="reminders"
							aria-expanded={remindersOpen}
							aria-haspopup="dialog"
							className={btnSecondary}
							disabled={opening}
							onClick={openReminders}
							type="button"
						>
							{t('remindersCount', { count: reminders.length })}
						</button>
					) : null}
				</div>
			</header>
			<dialog
				aria-label={t('navLabel')}
				className="bg-ground text-ink m-0 h-dvh max-h-none w-full max-w-none border-0 p-4"
				id="sections"
				onClose={() => {
					setMenuOpen(false);
				}}
				ref={menuPanel}
			>
				<div className="flex h-full flex-col gap-6">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<Link
							className="text-ink flex shrink-0 items-center gap-2 text-sm leading-5 font-semibold no-underline"
							onClick={() => {
								menuPanel.current?.close();
							}}
							to={home}
						>
							<DeskMark />
							<span>{t('title')}</span>
						</Link>
						<button
							autoFocus
							className={btnSecondary}
							onClick={() => {
								menuPanel.current?.close();
							}}
							type="button"
						>
							{t('close')}
						</button>
					</div>
					{status === 'signed-in' ? sections : null}
					<label className="flex w-full flex-col gap-2 font-medium">
						{t('language')}
						<select
							aria-label={t('language')}
							className={languageSelectMenu}
							onChange={onLanguage}
							value={language}
						>
							<option value="en">English</option>
							<option value="zh">中文</option>
						</select>
					</label>
					{account}
				</div>
			</dialog>
			<dialog
				aria-labelledby="reminders-title"
				className="border-line bg-surface text-ink [margin:0_0_0_auto] h-dvh max-h-none w-full max-w-[360px] rounded-l-2xl border p-6 shadow-[0_12px_28px_rgb(19_20_22/0.12)] backdrop:bg-[rgb(19_20_22/0.2)]"
				id="reminders"
				onClose={() => {
					setRemindersOpen(false);
				}}
				ref={remindersPanel}
			>
				<div className="flex h-full min-w-0 flex-col gap-4">
					<div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
						<h2 id="reminders-title">{t('remindersTitle')}</h2>
						<button
							autoFocus
							className={btnSecondary}
							onClick={() => {
								remindersPanel.current?.close();
							}}
							type="button"
						>
							{t('close')}
						</button>
					</div>
					{reminderError.length > 0 ? (
						<p className="text-negative m-0" role="alert">
							{reminderError}
						</p>
					) : null}
					{reminders.length === 0 ? (
						<p className="border-rule text-ink m-0 border-t py-3.5">{t('emptyReminders')}</p>
					) : (
						<ul className="m-0 flex min-w-0 list-none flex-col p-0">
							{reminders.map((notice) => (
								<li
									className="border-rule flex min-w-0 flex-col gap-1 border-t py-3.5 [&_p]:m-0"
									key={notice.loanId}
								>
									<p>{notice.message}</p>
									<p className={meta}>{formatWhen(notice.sentAt, i18n.language)}</p>
								</li>
							))}
						</ul>
					)}
				</div>
			</dialog>
			<div className="border-line bg-surface col-start-2 row-start-2 [margin:0_8px_8px_0] min-w-0 overflow-auto rounded-2xl border p-6 max-md:col-start-1 max-md:m-0 max-md:rounded-none max-md:border-0 max-md:p-4">
				<Outlet />
			</div>
		</div>
	);
};

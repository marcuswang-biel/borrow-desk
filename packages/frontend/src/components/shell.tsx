import type { ReminderNotice } from '@borrow-desk/api';

import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import * as Effect from 'effect/Effect';
import { BellIcon, BoxesIcon, CalendarClockIcon, GlobeIcon, PackageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty';
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemSeparator,
	ItemTitle,
} from '@/components/ui/item';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
	useSidebar,
} from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';

import { useSession } from '../auth/index.ts';
import {
	activeLocale,
	changeLocale,
	formatWhen,
	listReminders,
	localeTag,
	run,
	shown,
	shownReminder,
	type DeskError,
} from '../lib/index.ts';

/** Sidebar links for the catalog and the loan board. */
const routes = [
	{ to: '/equipment', tTag: 'equipment' },
	{ to: '/loans', tTag: 'loans' },
] as const;

/** Digits on the reminder bell when the count is at least 1. Counts of 100 or more show as 99+. */
const reminderBadgeCount = (count: number) => (count >= 100 ? '99+' : String(count));

/** Short labels for English, Simplified Chinese, and Traditional Chinese. */
const languageItems = [
	{ label: 'EN', value: 'en' },
	{ label: '简', value: 'zh' },
	{ label: '繁', value: 'zh-Hant' },
] as const;

/** Language menu. The list opens under the trigger and uses the trigger width. */
const LanguageSelect = ({ className, wide = false }: { className?: string; wide?: boolean }) => {
	const { t, i18n } = useTranslation();
	const language = activeLocale(i18n.language);

	return (
		<Select
			items={languageItems}
			onValueChange={(next) => {
				if (next === 'en' || next === 'zh' || next === 'zh-Hant') {
					void changeLocale(next);
				}
			}}
			value={language}
		>
			<div className={className}>
				<SelectTrigger aria-label={t('language')} className={wide ? 'w-full' : 'w-fit'} size="sm">
					<GlobeIcon />
					<SelectValue />
				</SelectTrigger>
				<SelectContent
					alignItemWithTrigger={false}
					className="w-(--anchor-width) max-w-(--anchor-width) min-w-(--anchor-width)"
					side="bottom"
				>
					<SelectGroup>
						{languageItems.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</div>
		</Select>
	);
};

/** Sidebar, reminders, and the matched page. */
const DeskFrame = () => {
	const { t, i18n } = useTranslation();
	const { status, user, reminders, replaceReminders, signOut } = useSession();
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const { setOpenMobile } = useSidebar();
	const [remindersOpen, setRemindersOpen] = useState(false);
	const [reminderError, setReminderError] = useState('');
	const [opening, setOpening] = useState(false);
	const [signOutError, setSignOutError] = useState('');
	const [signingOut, setSigningOut] = useState(false);

	useEffect(() => {
		document.title = t('title');
		document.documentElement.lang = localeTag(i18n.language);
	}, [i18n.language, t]);

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
						}),
					onFailure: (error: DeskError) =>
						Effect.sync(() => {
							setReminderError(shown(error));
							setRemindersOpen(true);
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
						setRemindersOpen(false);
						setOpenMobile(false);
						navigate({ to: '/' });
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

	const home = status === 'signed-in' ? '/equipment' : '/';
	const brand = status === 'signed-in' ? <Link to="/equipment" /> : <Link to="/" />;

	return (
		<>
			<Sidebar>
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								className="[&_svg]:size-6"
								render={brand}
								size="lg"
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								<BoxesIcon />
								<span>{t('title')}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>
				<SidebarContent>
					{status === 'signed-in' ? (
						<SidebarGroup>
							<SidebarGroupLabel>{t('navLabel')}</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{routes.map((route) => (
										<SidebarMenuItem key={route.to}>
											<SidebarMenuButton
												isActive={pathname === route.to}
												onClick={() => {
													setOpenMobile(false);
												}}
												render={<Link to={route.to} />}
											>
												{route.tTag === 'equipment' ? <PackageIcon /> : <CalendarClockIcon />}
												<span>{t(route.tTag)}</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					) : null}
				</SidebarContent>
				<SidebarFooter>
					<LanguageSelect className="w-full md:hidden" wide />
					{status === 'signed-in' ? (
						<div className="flex flex-col gap-2">
							<Button
								aria-busy={signingOut}
								disabled={signingOut}
								onClick={leave}
								type="button"
								variant="destructive"
							>
								{signingOut ? <Spinner data-icon="inline-start" /> : null}
								{t('signOut')}
							</Button>
							{signOutError.length > 0 ? (
								<Alert variant="destructive">
									<AlertDescription>{signOutError}</AlertDescription>
								</Alert>
							) : null}
						</div>
					) : null}
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>
			<SidebarInset className="min-w-0">
				<header className="flex min-h-14 items-center gap-3 border-b px-4 md:px-6">
					<SidebarTrigger aria-label={t('menu')} className="-ml-1" />
					<Link
						className="text-foreground mr-auto inline-flex shrink-0 items-center gap-2 text-sm leading-5 font-semibold no-underline md:hidden [&_svg]:size-6"
						to={home}
					>
						<BoxesIcon />
						<span>{t('title')}</span>
					</Link>
					<div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-3">
						{status === 'signed-in' && user !== undefined ? (
							<p className="text-muted-foreground m-0 hidden text-sm sm:block">
								{t('signedIn', { name: user.name, role: t(`role.${user.role}`) })}
							</p>
						) : null}
						<LanguageSelect className="hidden md:block" />
						{status === 'signed-in' ? (
							<Button
								aria-busy={opening}
								aria-expanded={remindersOpen}
								aria-label={t('remindersCount', { count: reminders.length })}
								className="relative"
								disabled={opening}
								onClick={openReminders}
								size="icon"
								type="button"
								variant="outline"
							>
								{opening ? (
									<Spinner data-icon="inline-start" />
								) : (
									<BellIcon data-icon="inline-start" />
								)}
								{reminders.length > 0 ? (
									<Badge
										aria-hidden="true"
										className="bg-destructive dark:bg-destructive absolute -top-1 -right-1 h-4 min-w-4 rounded-full px-1 py-0 text-[10px] leading-none text-white tabular-nums dark:text-white"
										variant="destructive"
									>
										{reminderBadgeCount(reminders.length)}
									</Badge>
								) : null}
							</Button>
						) : null}
					</div>
				</header>
				<div className="min-w-0 flex-1 p-4 md:p-8">
					<Outlet />
				</div>
			</SidebarInset>
			<Sheet onOpenChange={setRemindersOpen} open={remindersOpen}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>{t('remindersTitle')}</SheetTitle>
					</SheetHeader>
					<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
						{reminderError.length > 0 ? (
							<Alert variant="destructive">
								<AlertDescription>{reminderError}</AlertDescription>
							</Alert>
						) : null}
						{reminders.length === 0 ? (
							<Empty>
								<EmptyHeader>
									<EmptyDescription>{t('emptyReminders')}</EmptyDescription>
								</EmptyHeader>
							</Empty>
						) : (
							<ItemGroup>
								{reminders.map((notice, index) => (
									<div className="flex flex-col" key={notice.loanId}>
										{index > 0 ? <ItemSeparator /> : null}
										<Item size="sm" variant="muted">
											<ItemContent>
												<ItemTitle>{shownReminder(notice.message)}</ItemTitle>
												<ItemDescription>
													{formatWhen(notice.sentAt, i18n.language)}
												</ItemDescription>
											</ItemContent>
										</Item>
									</div>
								))}
							</ItemGroup>
						)}
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
};

/** Header, language, reminders, and the matched page. */
export const Shell = () => (
	<SidebarProvider>
		<DeskFrame />
	</SidebarProvider>
);

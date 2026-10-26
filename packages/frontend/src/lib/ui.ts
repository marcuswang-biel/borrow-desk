/** Near-black primary action. It does not stretch to the form width. */
export const btnPrimary =
	'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-md border border-ink bg-ink px-3 text-sm leading-5 font-medium text-white hover:bg-ink-hover disabled:cursor-not-allowed disabled:border-transparent disabled:bg-active disabled:text-muted disabled:hover:bg-active max-md:min-h-11';

/** Bordered action used for return, close, and reminders. */
export const btnSecondary =
	'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-md border border-control bg-surface px-3 text-sm leading-5 font-medium whitespace-nowrap text-ink no-underline hover:bg-raised disabled:cursor-not-allowed disabled:border-transparent disabled:bg-active disabled:text-muted disabled:hover:bg-active max-md:min-h-11';

/** Sign out. Red with white text, light pink while the pointer is over it. */
export const btnQuiet =
	'inline-flex min-h-8 cursor-pointer items-center justify-center self-start rounded-md border border-negative bg-negative px-3 text-sm leading-5 font-medium whitespace-nowrap text-white hover:border-pill hover:bg-pill hover:text-negative disabled:cursor-not-allowed disabled:border-transparent disabled:bg-active disabled:text-muted disabled:hover:border-transparent disabled:hover:bg-active disabled:hover:text-muted max-md:min-h-11';

/** Phone menu control. It stays out of the desktop top bar. */
export const btnMenu =
	'hidden min-h-8 cursor-pointer items-center justify-center rounded-md border border-control bg-surface px-3 text-sm leading-5 font-medium whitespace-nowrap text-ink hover:bg-raised disabled:cursor-not-allowed disabled:border-transparent disabled:bg-active disabled:text-muted max-md:inline-flex max-md:min-h-11';

/** Column of fields. The submit button keeps its own width. */
export const form = 'flex min-w-0 flex-col items-start gap-4';

/** Label stacked over its control. A mono input keeps the label weight. */
export const field =
	'flex w-full flex-col gap-2 self-stretch font-medium [&_input:not(.font-mono)]:font-normal [&_input]:box-border [&_input]:min-h-10 [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-control [&_input]:bg-surface [&_input]:px-3 [&_input]:text-ink [&_select]:box-border [&_select]:min-h-10 [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-control [&_select]:bg-surface [&_select]:px-3 [&_select]:font-normal [&_select]:text-ink';

/** Twelve-pixel supporting sentence. */
export const hint = 'm-0 text-xs leading-4 font-normal text-muted';

/** Sign-in actions, side by side when they fit. */
export const actions = 'flex flex-wrap gap-3';

/** Track behind the sign-in and sign-up tabs. */
export const authTabs = 'grid w-full grid-cols-2 gap-1 rounded-md bg-raised p-1';

/** The account tab that is selected. */
export const authTabOn =
	'inline-flex min-h-8 cursor-pointer items-center justify-center rounded border border-line bg-surface px-3 text-sm leading-5 font-medium text-ink';

/** An account tab that is not selected. */
export const authTabOff =
	'inline-flex min-h-8 cursor-pointer items-center justify-center rounded border border-transparent bg-transparent px-3 text-sm leading-5 font-medium text-muted hover:text-ink';

/** Language control in the top bar. The native arrow is hidden, and the control hides on a phone. */
export const languageSelectBar =
	'h-8 w-auto appearance-none rounded-md border border-control bg-surface bg-none px-3 text-sm font-normal text-ink max-md:hidden';

/** Language control inside the phone menu. The native arrow is hidden. */
export const languageSelectMenu =
	'h-10 w-full appearance-none rounded-md border border-control bg-surface bg-none px-3 text-sm font-normal text-ink';

/** Twelve-pixel secondary sentence. */
export const meta = 'm-0 text-xs leading-4 text-muted';

/** Failure sentence next to a form. */
export const alert = 'm-0 text-negative';

/** Empty catalog or loan list. */
export const empty = 'm-0 border-t border-rule py-3.5 text-ink';

/** Page title row. */
export const screenHead =
	'col-span-full mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2';

/** Sign-in sheet. The sentence sits beside the form from 900px. */
export const signIn =
	'grid items-start gap-6 min-[900px]:grid-cols-[minmax(0,420px)_minmax(0,1fr)]';

/** Opening sentence on the sign-in sheet. */
export const lede = 'mt-9 max-w-[42em] text-base leading-6 text-ink max-[899px]:mt-0';

/** Catalog with the record form on the right from 900px. */
export const catalogForm = 'grid items-start gap-6 min-[900px]:grid-cols-[minmax(0,1fr)_280px]';

/** Catalog without a form. */
export const catalog = 'grid items-start gap-6';

/** Loan board with the booking form on the left from 900px. */
export const loanForm = 'grid items-start gap-6 min-[900px]:grid-cols-[300px_minmax(0,1fr)]';

/** Loan board without a form. */
export const loanBoard = 'grid items-start gap-6';

/** Equipment number. */
export const tag = 'font-mono font-medium tabular-nums';

/** Equipment number for a loan that is still out and on time. */
export const tagOut = 'font-mono font-medium text-accent tabular-nums';

/** Equipment number for a returned or overdue loan. */
export const tagQuiet = 'font-mono font-medium text-muted tabular-nums';

/** Word for a loan that is out and cannot be returned here. */
export const out = 'font-medium text-accent';

/** Overdue mark. It is the only red on a row. */
export const pill =
	'inline-flex min-h-5 items-center rounded bg-pill px-2 text-xs leading-4 font-medium text-pill-ink';

/** Column heading. */
export const th = 'pr-4 pb-2 text-left text-xs leading-4 font-medium text-muted';

/** Right-aligned column heading. */
export const thNum = 'pr-4 pb-2 text-right text-xs leading-4 font-medium text-muted tabular-nums';

/** Table body cell. On a phone the row becomes a stack. */
export const td =
	'border-t border-rule py-3.5 pr-4 align-middle max-md:block max-md:border-0 max-md:p-0 max-md:text-left';

/** Right-aligned table body cell. */
export const tdNum =
	'border-t border-rule py-3.5 pr-4 text-right align-middle tabular-nums max-md:block max-md:border-0 max-md:p-0 max-md:text-left';

/** Right-aligned time. On a phone it reads as a secondary fact. */
export const tdWhen =
	'border-t border-rule py-3.5 pr-4 text-right align-middle tabular-nums max-md:block max-md:border-0 max-md:p-0 max-md:text-left max-md:text-[13px] max-md:leading-[18px] max-md:text-muted';

/** Secondary fact in a loan row. */
export const tdMeta =
	'border-t border-rule py-3.5 pr-4 align-middle max-md:block max-md:border-0 max-md:p-0 max-md:text-left max-md:text-[13px] max-md:leading-[18px] max-md:text-muted';

/** Return control. */
export const tdAction =
	'w-[1%] border-t border-rule py-3.5 pr-4 text-right align-middle whitespace-nowrap max-md:mt-2 max-md:block max-md:w-auto max-md:border-0 max-md:p-0 max-md:text-left max-md:whitespace-normal';

/** One loan or equipment row. */
export const tr = 'max-md:block max-md:border-t max-md:border-rule max-md:py-3';

/** Column headings, clipped on a phone. */
export const thead = 'max-md:sr-only';

/** Sheet table. On a phone each row stacks. */
export const table = 'w-full border-collapse max-md:block';

/** Table body. On a phone it stacks with the rows. */
export const tbody = 'max-md:block';

/** Placeholder bars while the session is unknown. */
export const skeleton = 'mb-3 h-3.5 rounded bg-active';

/** Shorter placeholder bar. */
export const skeletonShort = 'mb-3 h-3.5 w-[72%] rounded bg-active';

/** Shortest placeholder bar. */
export const skeletonShorter = 'mb-3 h-3.5 w-[48%] rounded bg-active';

export const switchTab = '';

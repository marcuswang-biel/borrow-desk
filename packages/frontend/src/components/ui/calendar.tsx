import { cn } from 'cn';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import * as React from 'react';
import { DayPicker, getDefaultClassNames, type DayButton } from 'react-day-picker';

import { Button, buttonVariants } from '@/components/ui/button';

/** Month calendar. The desk date picker uses single-day mode. */
function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	captionLayout = 'label',
	buttonVariant = 'ghost',
	locale,
	formatters,
	components,
	...props
}: React.ComponentProps<typeof DayPicker> & {
	buttonVariant?: React.ComponentProps<typeof Button>['variant'];
}) {
	const defaultClassNames = getDefaultClassNames();

	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn(
				'bg-background group/calendar p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=popover-content]:bg-transparent',
				className,
			)}
			captionLayout={captionLayout}
			locale={locale}
			formatters={{
				formatMonthDropdown: (date) => date.toLocaleString(locale?.code, { month: 'short' }),
				...formatters,
			}}
			classNames={{
				root: cn('w-fit', defaultClassNames.root),
				months: cn('relative flex flex-col gap-4 md:flex-row', defaultClassNames.months),
				month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
				nav: cn(
					'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
					defaultClassNames.nav,
				),
				button_previous: cn(
					buttonVariants({ variant: buttonVariant }),
					'size-(--cell-size) p-0 select-none aria-disabled:opacity-50',
					defaultClassNames.button_previous,
				),
				button_next: cn(
					buttonVariants({ variant: buttonVariant }),
					'size-(--cell-size) p-0 select-none aria-disabled:opacity-50',
					defaultClassNames.button_next,
				),
				month_caption: cn(
					'flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)',
					defaultClassNames.month_caption,
				),
				caption_label: cn('text-sm font-medium select-none', defaultClassNames.caption_label),
				month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
				weekdays: cn('flex', defaultClassNames.weekdays),
				weekday: cn(
					'text-muted-foreground flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal select-none',
					defaultClassNames.weekday,
				),
				week: cn('mt-2 flex w-full', defaultClassNames.week),
				day: cn(
					'group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none',
					defaultClassNames.day,
				),
				today: cn(
					'bg-muted text-foreground rounded-(--cell-radius) data-[selected=true]:rounded-none',
					defaultClassNames.today,
				),
				outside: cn(
					'text-muted-foreground aria-selected:text-muted-foreground',
					defaultClassNames.outside,
				),
				disabled: cn('text-muted-foreground opacity-50', defaultClassNames.disabled),
				hidden: cn('invisible', defaultClassNames.hidden),
				...classNames,
			}}
			components={{
				Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
					<div data-slot="calendar" ref={rootRef} className={cn(rootClassName)} {...rootProps} />
				),
				Chevron: ({ className: iconClassName, orientation, ...iconProps }) => {
					if (orientation === 'left') {
						return <ChevronLeftIcon className={cn('size-4', iconClassName)} {...iconProps} />;
					}
					if (orientation === 'right') {
						return <ChevronRightIcon className={cn('size-4', iconClassName)} {...iconProps} />;
					}
					return <ChevronDownIcon className={cn('size-4', iconClassName)} {...iconProps} />;
				},
				DayButton: (dayProps) => <CalendarDayButton {...dayProps} />,
				...components,
			}}
			{...props}
		/>
	);
}

/** One day in the month grid. */
function CalendarDayButton({
	className,
	day,
	modifiers,
	...props
}: React.ComponentProps<typeof DayButton>) {
	const defaultClassNames = getDefaultClassNames();
	const ref = React.useRef<HTMLButtonElement>(null);

	React.useEffect(() => {
		if (modifiers.focused) {
			ref.current?.focus();
		}
	}, [modifiers.focused]);

	return (
		<Button
			ref={ref}
			variant="ghost"
			size="icon"
			data-day={day.date.toLocaleDateString()}
			data-selected-single={modifiers.selected && !modifiers.range_start && !modifiers.range_end}
			className={cn(
				'group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px]',
				defaultClassNames.day,
				className,
			)}
			{...props}
		/>
	);
}

export { Calendar, CalendarDayButton };

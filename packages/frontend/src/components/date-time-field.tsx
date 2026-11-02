import { format } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { zhCN } from 'date-fns/locale/zh-CN';
import { zhTW } from 'date-fns/locale/zh-TW';
import { ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { getLocale } from '../lib/i18n/index.ts';
import { m } from '../paraglide/messages.js';

/** date-fns locale for the month grid and the date button. */
const dayLocale = () => {
	const locale = getLocale();
	if (locale === 'zh-Hant') {
		return zhTW;
	}
	if (locale === 'zh') {
		return zhCN;
	}
	return enUS;
};

/** `HH:MM:SS` for the time input, or empty when the instant is unset. */
const clockValue = (value: Date | undefined) => {
	if (value === undefined) {
		return '';
	}
	const hour = String(value.getHours()).padStart(2, '0');
	const minute = String(value.getMinutes()).padStart(2, '0');
	const second = String(value.getSeconds()).padStart(2, '0');
	return `${hour}:${minute}:${second}`;
};

/** Copies a chosen day and applies a time-input value. */
const withClock = (day: Date, time: string) => {
	const [hour = '0', minute = '0', second = '0'] = time.split(':');
	const next = new Date(day);
	next.setHours(Number(hour), Number(minute), Number(second), 0);
	return next;
};

/** Date picker and time input. The parent hears a value once both parts are set. */
export const DateTimeField = ({
	id,
	label,
	value,
	onChange,
	invalid,
}: {
	id: string;
	label: string;
	value: Date | undefined;
	onChange: (next: Date) => void;
	invalid: boolean;
}) => {
	const [open, setOpen] = useState(false);
	const [day, setDay] = useState<Date | undefined>(value);
	const [time, setTime] = useState(clockValue(value));
	const locale = dayLocale();
	const timeId = `${id}-time`;

	const chooseDay = (next: Date | undefined) => {
		if (next === undefined) {
			return;
		}
		setDay(next);
		setOpen(false);
		if (time !== '') {
			onChange(withClock(next, time));
		}
	};

	const chooseTime = (next: string) => {
		setTime(next);
		if (day !== undefined && next !== '') {
			onChange(withClock(day, next));
		}
	};

	return (
		<FieldGroup className="flex-row">
			<Field className="min-w-0 flex-1" data-invalid={invalid || undefined}>
				<FieldLabel htmlFor={id}>{label}</FieldLabel>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger
						render={
							<Button
								id={id}
								type="button"
								variant="outline"
								aria-invalid={invalid}
								aria-required
								data-empty={day === undefined}
								className="data-[empty=true]:text-muted-foreground w-full justify-between font-normal"
							/>
						}
					>
						{day === undefined ? label : format(day, 'PPP', { locale })}
						<ChevronDownIcon data-icon="inline-end" />
					</PopoverTrigger>
					<PopoverContent align="start" className="w-auto overflow-hidden p-0">
						<Calendar
							mode="single"
							locale={locale}
							selected={day}
							onSelect={chooseDay}
							{...(day === undefined ? {} : { defaultMonth: day })}
						/>
					</PopoverContent>
				</Popover>
			</Field>
			<Field className="w-32" data-invalid={invalid || undefined}>
				<FieldLabel htmlFor={timeId}>{m.time()}</FieldLabel>
				<Input
					id={timeId}
					type="time"
					step="1"
					value={time}
					aria-invalid={invalid}
					aria-required
					onChange={(event) => {
						chooseTime(event.target.value);
					}}
					className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
				/>
			</Field>
		</FieldGroup>
	);
};

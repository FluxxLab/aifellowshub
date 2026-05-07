import { useEffect } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import Label from './Label';
import { CalenderIcon, TimeIcon } from '../../icons';
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
 id: string;
 /**
  * "time" gives a time-only picker (HH:mm, 24-hour). "single" / "multiple"
  * / "range" are the standard flatpickr date-picker modes.
  */
 mode?:"single"|"multiple"|"range"|"time";
 onChange?: Hook | Hook[];
 defaultDate?: DateOption;
 label?: string;
 placeholder?: string;
 /** Block dates earlier than this — handy for "future only" forms. */
 minDate?: DateOption;
};

export default function DatePicker({
 id,
 mode,
 onChange,
 label,
 defaultDate,
 placeholder,
 minDate,
}: PropsType) {
 const timeOnly = mode === "time";

 useEffect(() => {
 const flatPickr = flatpickr(`#${id}`, {
 mode: timeOnly ? "single" : (mode || "single"),
 static: true,
 monthSelectorType: "static",
 enableTime: timeOnly,
 noCalendar: timeOnly,
 // 12-hour display with AM/PM in the UI; the underlying input value
 // stays in 24-hour H:i so the form's `${date}T${time}` parse still
 // produces a valid ISO Date.
 time_24hr: false,
 altInput: timeOnly,
 altFormat: timeOnly ? "h:i K" : undefined,
 dateFormat: timeOnly ? "H:i" : "Y-m-d",
 defaultDate,
 minDate,
 onChange,
 });

 return () => {
 if (!Array.isArray(flatPickr)) {
 flatPickr.destroy();
 }
 };
 }, [mode, timeOnly, onChange, id, defaultDate, minDate]);

 return (
 <div>
 {label && <Label htmlFor={id}>{label}</Label>}

 <div className="relative">
 <input
 id={id}
 placeholder={placeholder}
 className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20"/>

 <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2">
 {timeOnly ? (
 <TimeIcon className="size-6"/>
 ) : (
 <CalenderIcon className="size-6"/>
 )}
 </span>
 </div>
 </div>
 );
}

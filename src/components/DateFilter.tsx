import { useState } from "react";
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateFilterProps {
  onFilter: (from: Date | undefined, to: Date | undefined) => void;
}

export function DateFilter({ onFilter }: DateFilterProps) {
  const [from, setFrom] = useState<Date>();
  const [to, setTo] = useState<Date>();

  const handleFromChange = (date: Date | undefined) => {
    setFrom(date);
    onFilter(date, to);
  };

  const handleToChange = (date: Date | undefined) => {
    setTo(date);
    onFilter(from, date);
  };

  const clear = () => {
    setFrom(undefined);
    setTo(undefined);
    onFilter(undefined, undefined);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("gap-2 border-border text-foreground text-sm h-9", !from && "text-muted-foreground")}>
            <CalendarIcon className="w-3.5 h-3.5" />
            {from ? format(from, "dd MMM yyyy", { locale: fr }) : "Du"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={from} onSelect={handleFromChange} initialFocus className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("gap-2 border-border text-foreground text-sm h-9", !to && "text-muted-foreground")}>
            <CalendarIcon className="w-3.5 h-3.5" />
            {to ? format(to, "dd MMM yyyy", { locale: fr }) : "Au"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={to} onSelect={handleToChange} initialFocus className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>

      {(from || to) && (
        <Button size="sm" variant="ghost" onClick={clear} className="text-muted-foreground h-9">
          <X className="w-3.5 h-3.5" /> Effacer
        </Button>
      )}
    </div>
  );
}

export function filterByDateRange<T>(items: T[], dateKey: keyof T, from?: Date, to?: Date): T[] {
  if (!from && !to) return items;
  return items.filter((item) => {
    const d = new Date(item[dateKey] as string);
    if (from && to) return isWithinInterval(d, { start: startOfDay(from), end: endOfDay(to) });
    if (from) return d >= startOfDay(from);
    if (to) return d <= endOfDay(to);
    return true;
  });
}

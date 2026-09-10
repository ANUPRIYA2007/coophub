"use client";
import * as React from "react";
import type { DropdownProps } from "react-day-picker";
import { Calendar } from "@/components/ui/v-calendar-5-utils/calendar";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/v-calendar-5-utils/select";

function CalendarDropdown(props: DropdownProps) {
  const { options, value, onChange, "aria-label": ariaLabel } = props;

  const handleValueChange = (newValue: string | null) => {
    if (onChange && newValue) {
      const syntheticEvent = {
        target: { value: newValue },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  const items =
    options?.map((option) => ({
      disabled: option.disabled,
      label: option.label,
      value: option.value.toString(),
    })) ?? [];

  return (
    <Select
      aria-label={ariaLabel}
      onValueChange={handleValueChange}
      value={value?.toString()}
    >
      <SelectTrigger className="min-w-none h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {items.map((item) => (
          <SelectItem
            disabled={item.disabled}
            key={item.value}
            value={item.value}
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
}

export default function Particle({
  selected,
  onSelect,
  className,
  startMonth = new Date(1930, 0),
  endMonth = new Date(2030, 11),
}: {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  startMonth?: Date;
  endMonth?: Date;
}) {
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(new Date());
  const date = selected !== undefined ? selected : internalDate;

  const handleSelect = (newDate: Date | undefined) => {
    if (selected === undefined) {
      setInternalDate(newDate);
    }
    if (onSelect) {
      onSelect(newDate);
    }
  };

  return (
    <Calendar
      captionLayout="dropdown"
      components={{ Dropdown: CalendarDropdown }}
      endMonth={endMonth}
      mode="single"
      onSelect={handleSelect}
      selected={date}
      startMonth={startMonth}
      className={className}
    />
  );
}

export { Particle, Particle as Calendar5, CalendarDropdown };

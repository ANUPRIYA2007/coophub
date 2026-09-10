import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function DarkCalendar({ selected, onSelect, minDate }) {
  const today = new Date();
  today.setHours(0,0,0,0);

  const [viewMonth, setViewMonth] = useState(selected ? selected.getMonth() : today.getMonth());
  const [viewYear, setViewYear] = useState(selected ? selected.getFullYear() : today.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const currentMinDate = minDate || today;

  // Generate calendar days grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i) });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, isCurrentMonth: true, date: new Date(viewYear, viewMonth, d) });
    }

    // Next month leading days (fill to 42 cells = 6 rows)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, isCurrentMonth: false, date: new Date(viewYear, viewMonth + 1, d) });
    }

    return days;
  }, [viewMonth, viewYear]);

  const isSameDay = (d1, d2) =>
    d1 && d2 && d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const isDisabled = (date) => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    return d < currentMinDate;
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const yearRange = useMemo(() => {
    const years = [];
    const startYear = today.getFullYear();
    for (let y = startYear; y <= startYear + 5; y++) years.push(y);
    return years;
  }, []);

  return (
    <div style={{
      background: '#0a0a0a',
      borderRadius: '16px',
      padding: '16px',
      width: '300px',
      fontFamily: "'Inter', system-ui, sans-serif",
      userSelect: 'none',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      {/* Header: Nav + Month/Year Dropdowns */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={prevMonth}
          style={{
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '6px', transition: 'all 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >
          <ChevronLeft size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Month Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => { setShowMonthPicker(!showMonthPicker); setShowYearPicker(false); }}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s'
              }}
            >
              {MONTH_NAMES[viewMonth]}
              <ChevronDown size={12} style={{ opacity: 0.5 }} />
            </button>
            {showMonthPicker && (
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                marginTop: '4px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '6px', zIndex: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '2px', minWidth: '160px', boxShadow: '0 12px 24px rgba(0,0,0,0.5)'
              }}>
                {MONTH_NAMES.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setViewMonth(i); setShowMonthPicker(false); }}
                    style={{
                      background: i === viewMonth ? '#FF7900' : 'transparent',
                      color: i === viewMonth ? '#fff' : 'rgba(255,255,255,0.7)',
                      border: 'none', borderRadius: '6px', padding: '5px 4px', fontSize: '11px',
                      fontWeight: i === viewMonth ? '700' : '500', cursor: 'pointer', transition: 'all 0.1s'
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => { setShowYearPicker(!showYearPicker); setShowMonthPicker(false); }}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s'
              }}
            >
              {viewYear}
              <ChevronDown size={12} style={{ opacity: 0.5 }} />
            </button>
            {showYearPicker && (
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                marginTop: '4px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '6px', zIndex: 10, display: 'flex', flexDirection: 'column',
                gap: '2px', minWidth: '80px', boxShadow: '0 12px 24px rgba(0,0,0,0.5)'
              }}>
                {yearRange.map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { setViewYear(y); setShowYearPicker(false); }}
                    style={{
                      background: y === viewYear ? '#FF7900' : 'transparent',
                      color: y === viewYear ? '#fff' : 'rgba(255,255,255,0.7)',
                      border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '12px',
                      fontWeight: y === viewYear ? '700' : '500', cursor: 'pointer', textAlign: 'center'
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={nextMonth}
          style={{
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '6px', transition: 'all 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', marginBottom: '6px' }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: '11px', fontWeight: '600',
            color: 'rgba(255,255,255,0.35)', padding: '4px 0', letterSpacing: '0.5px'
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {calendarDays.map((cell, idx) => {
          const isToday = isSameDay(cell.date, today);
          const isSelected = isSameDay(cell.date, selected);
          const disabled = !cell.isCurrentMonth || isDisabled(cell.date);

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelect(cell.date)}
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: isSelected ? '10px' : '8px',
                fontSize: '13px',
                fontWeight: isSelected || isToday ? '700' : '400',
                cursor: disabled ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                background: isSelected
                  ? '#ffffff'
                  : 'transparent',
                color: isSelected
                  ? '#0a0a0a'
                  : disabled
                  ? 'rgba(255,255,255,0.15)'
                  : isToday
                  ? '#FF7900'
                  : cell.isCurrentMonth
                  ? 'rgba(255,255,255,0.85)'
                  : 'rgba(255,255,255,0.2)',
                boxShadow: isSelected ? '0 2px 8px rgba(255,255,255,0.15)' : 'none',
                margin: '0 auto',
              }}
              onMouseEnter={e => {
                if (!disabled && !isSelected) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={e => {
                if (!disabled && !isSelected) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = isToday
                    ? '#FF7900'
                    : cell.isCurrentMonth
                    ? 'rgba(255,255,255,0.85)'
                    : 'rgba(255,255,255,0.2)';
                }
              }}
            >
              {cell.day}
              {isToday && !isSelected && (
                <span style={{
                  position: 'absolute', bottom: '3px', width: '3px', height: '3px',
                  borderRadius: '50%', background: '#FF7900'
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DatePickerDropdown({
  value,
  onChange,
  disabled = false,
  minDate,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const parseDate = (str) => {
    if (!str) return undefined;
    const parts = str.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return undefined;
  };

  const selectedDate = parseDate(value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDate = (date) => {
    if (!date) return;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    if (onChange) {
      onChange({ target: { name: 'preferred_date', value: formatted } });
    }
    setIsOpen(false);
  };

  const selectPreset = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    handleSelectDate(d);
  };

  const formatDisplay = (d) => {
    if (!d) return 'Select preferred date';
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            : isOpen
            ? 'bg-white border-orange-500 ring-2 ring-orange-500/20 shadow-sm text-navy-900'
            : value
            ? 'bg-white border-navy-200 hover:border-orange-400 text-navy-900'
            : 'bg-white border-navy-200 hover:border-orange-400 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            value ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'
          }`}>
            <CalendarIcon size={16} />
          </div>
          <div>
            <span className="block text-xs font-medium" style={{ color: '#64748b' }}>Preferred Date</span>
            <span className="block text-sm font-semibold truncate" style={{ color: value ? '#0B1220' : '#94a3b8' }}>
              {formatDisplay(selectedDate)}
            </span>
          </div>
        </div>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: isOpen ? '#FF7900' : '#94a3b8' }} />
      </button>

      {/* Floating Popover */}
      {isOpen && !disabled && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: '8px',
          borderRadius: '16px', overflow: 'visible',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          {/* Quick Presets */}
          <div style={{
            display: 'flex', gap: '6px', marginBottom: '8px'
          }}>
            {[
              { label: 'Today', offset: 0 },
              { label: 'Tomorrow', offset: 1 },
              { label: 'In 2 Days', offset: 2 }
            ].map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => selectPreset(p.offset)}
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: '#1a1a1a',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FF7900'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <DarkCalendar
            selected={selectedDate}
            onSelect={handleSelectDate}
            minDate={minDate}
          />
        </div>
      )}
    </div>
  );
}

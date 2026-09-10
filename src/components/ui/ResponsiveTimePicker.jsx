import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, Check, Sun, Sunset, Moon } from 'lucide-react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { ThemeProvider, createTheme } from '@mui/material/styles';

dayjs.extend(customParseFormat);

// Custom MUI theme aligned with COOP HUB brand
const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#FF7900', // COOP HUB Orange
    },
    text: {
      primary: '#050A12',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: ['Inter', 'system-ui', 'sans-serif'].join(','),
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

export default function ResponsiveTimePicker({
  value,
  onChange,
  disabled = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Convert HH:mm to Dayjs or null
  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    return dayjs(`2026-01-01T${timeStr}`);
  };

  const selectedDayjs = parseTime(value);

  // Close popup on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMuiChange = (newVal) => {
    if (newVal && newVal.isValid()) {
      const formatted = newVal.format('HH:mm');
      if (onChange) {
        onChange({ target: { name: 'preferred_time', value: formatted } });
      }
    }
  };

  const handlePresetSelect = (timeStr) => {
    if (onChange) {
      onChange({ target: { name: 'preferred_time', value: timeStr } });
    }
    setIsOpen(false);
  };

  const formatDisplay = (timeStr) => {
    if (!timeStr) return 'Select preferred time';
    const parsed = dayjs(`2026-01-01T${timeStr}`);
    if (parsed.isValid()) {
      return parsed.format('hh:mm A');
    }
    return timeStr;
  };

  const presets = [
    { label: '09:00 AM', value: '09:00', icon: Sun, period: 'Morning' },
    { label: '11:30 AM', value: '11:30', icon: Sun, period: 'Late Morning' },
    { label: '02:00 PM', value: '14:00', icon: Sunset, period: 'Afternoon' },
    { label: '04:30 PM', value: '16:30', icon: Sunset, period: 'Late Afternoon' },
    { label: '06:30 PM', value: '18:30', icon: Moon, period: 'Evening' },
  ];

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
            <Clock size={16} />
          </div>
          <div>
            <span className="block text-xs text-muted font-medium">Preferred Time</span>
            <span className="block text-sm font-semibold text-navy-900 truncate">
              {formatDisplay(value)}
            </span>
          </div>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
      </button>

      {/* Floating Popover Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 sm:right-auto right-0 z-50 mt-2 p-4 bg-white rounded-2xl shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 sm:w-80 w-[calc(100vw-3rem)]">
          {/* Quick Slot Presets */}
          <div className="mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Popular Service Slots
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((slot) => {
                const isSelected = value === slot.value;
                const IconComponent = slot.icon;
                return (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => handlePresetSelect(slot.value)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : 'bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <IconComponent size={12} className={isSelected ? 'text-white' : 'text-slate-400'} />
                      {slot.label}
                    </span>
                    {isSelected && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[10px] font-bold text-slate-400">or custom time</span>
            </div>
          </div>

          {/* MUI X TimePicker Integration */}
          <div className="flex flex-col items-center">
            <ThemeProvider theme={muiTheme}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  value={selectedDayjs}
                  onChange={handleMuiChange}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      placeholder: 'Pick exact time',
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '600',
                          '&.Mui-focused fieldset': {
                            borderColor: '#FF7900',
                          },
                        },
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </ThemeProvider>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full py-2 bg-navy-900 text-white text-xs font-bold rounded-xl hover:bg-navy-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import {
    Zap,
    Snowflake,
    Droplets,
    Tv,
    Paintbrush,
    UtensilsCrossed,
    HeartHandshake,
    Sprout,
    Wrench,
    AlertTriangle,
    ShieldCheck,
    GraduationCap,
    Car,
    Hammer,
    Sparkles
} from 'lucide-react';

export default function ServiceCategoryIcon({ category, name, className = "w-7 h-7 text-navy-600 group-hover:text-orange-500 transition-colors" }) {
    const key = `${category || ''} ${name || ''}`.toLowerCase();

    if (key.includes('domestic') || key.includes('cook') || key.includes('maid')) {
        return <UtensilsCrossed className={className} size={28} />;
    }
    if (key.includes('caregiver') || key.includes('nurse') || key.includes('elder') || key.includes('patient')) {
        return <HeartHandshake className={className} size={28} />;
    }
    if (key.includes('garden') || key.includes('plant') || key.includes('landscap')) {
        return <Sprout className={className} size={28} />;
    }
    if (key.includes('emergency') || key.includes('24/7') || key.includes('urgent')) {
        return <AlertTriangle className={className} size={28} />;
    }
    if (key.includes('on-demand') || key.includes('instant') || key.includes('quick')) {
        return <Zap className={className} size={28} />;
    }
    if (key.includes('verified') || key.includes('cooperative workers') || key.includes('society')) {
        return <ShieldCheck className={className} size={28} />;
    }
    if (key.includes('training') || key.includes('certification') || key.includes('skill')) {
        return <GraduationCap className={className} size={28} />;
    }
    if (key.includes('technician') || key.includes('cctv') || key.includes('equipment')) {
        return <Wrench className={className} size={28} />;
    }
    if (key.includes('electric') || key.includes('wiring') || key.includes('fan')) {
        return <Zap className={className} size={28} />;
    }
    if (key.includes('ac') || key.includes('cool') || key.includes('refrigerat')) {
        return <Snowflake className={className} size={28} />;
    }
    if (key.includes('plumb') || key.includes('pipe') || key.includes('tap') || key.includes('water')) {
        return <Droplets className={className} size={28} />;
    }
    if (key.includes('appliance') || key.includes('washing') || key.includes('fridge')) {
        return <Tv className={className} size={28} />;
    }
    if (key.includes('paint') || key.includes('polish') || key.includes('wall')) {
        return <Paintbrush className={className} size={28} />;
    }
    if (key.includes('driver') || key.includes('chauffeur') || key.includes('car')) {
        return <Car className={className} size={28} />;
    }
    if (key.includes('custom') || key.includes('trade') || key.includes('mason')) {
        return <Hammer className={className} size={28} />;
    }

    return <Sparkles className={className} size={28} />;
}

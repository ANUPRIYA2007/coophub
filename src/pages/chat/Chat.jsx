import React from 'react';
import RequestChat from '../requests/RequestChat';

/**
 * Customer Chat Route wrapper for /chat/:id
 * Directs directly to the live verified customer <-> pillar chat interface
 */
export default function Chat() {
    return <RequestChat />;
}

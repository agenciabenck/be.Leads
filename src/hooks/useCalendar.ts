import { useState, useEffect, useMemo } from 'react';
import { getUserData, setUserData } from '@/utils/storageUtils';
import { CalendarEvent } from '@/types/types';

export const useCalendar = (userId: string | undefined) => {
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

    useEffect(() => {
        if (userId) {
            setCalendarEvents(getUserData<CalendarEvent[]>(userId, 'calendar', []));
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            setUserData(userId, 'calendar', calendarEvents);
        }
    }, [calendarEvents, userId]);

    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return calendarEvents
            .filter(e => new Date(e.date + 'T00:00:00') >= today)
            .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
            .slice(0, 3);
    }, [calendarEvents]);

    const addEvent = (event: Omit<CalendarEvent, 'id'>) => {
        const newEvent = { ...event, id: Math.random().toString(36).substr(2, 9) };
        setCalendarEvents(prev => [...prev, newEvent]);
    }

    const clearAllEvents = () => {
        setCalendarEvents([]);
    }

    return {
        calendarEvents,
        setCalendarEvents,
        upcomingEvents,
        addEvent,
        clearAllEvents
    };
};

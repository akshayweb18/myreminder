'use client';

// ============================================================
// FullCalendarWrapper — loads FullCalendar + all plugins in one
// module context to avoid the "Class constructor cannot be invoked
// without 'new'" error that occurs when plugins are statically imported
// while FullCalendar itself is dynamically imported.
// ============================================================

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, EventDropArg, EventClickArg } from '@fullcalendar/core';

interface FullCalendarWrapperProps {
  events: EventInput[];
  onEventDrop: (arg: EventDropArg) => void;
  onEventClick: (arg: EventClickArg) => void;
  onDateClick: (arg: { dateStr: string }) => void;
}

export default function FullCalendarWrapper({
  events,
  onEventDrop,
  onEventClick,
  onDateClick,
}: FullCalendarWrapperProps) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
      }}
      editable={true}
      selectable={true}
      events={events}
      eventDrop={onEventDrop}
      eventClick={onEventClick}
      dateClick={onDateClick}
      height="auto"
      eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: 'short' }}
    />
  );
}

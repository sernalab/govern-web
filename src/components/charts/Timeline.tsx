import { useRef, useEffect, useState } from 'preact/hooks';

interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
  type?: 'inicio' | 'investigacion' | 'juicio' | 'sentencia';
}

interface Props {
  events: TimelineEvent[];
}

const typeColors: Record<string, { bg: string; border: string; text: string }> = {
  inicio: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600' },
  investigacion: { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-600' },
  juicio: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-600' },
  sentencia: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-600' },
};

const typeLabels: Record<string, string> = {
  inicio: 'Inici',
  investigacion: 'Investigació',
  juicio: 'Judici',
  sentencia: 'Sentència',
};

function formatTimelineDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ca-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Timeline({ events }: Props) {
  // Sort events by date
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div class="relative">
      {/* Vertical line */}
      <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div class="space-y-8">
        {sortedEvents.map((event, index) => {
          const colors = typeColors[event.type || 'inicio'] || typeColors.inicio;

          return (
            <div key={index} class="relative pl-12">
              {/* Dot */}
              <div
                class={`absolute left-2.5 top-1 w-3.5 h-3.5 rounded-full ${colors.bg} border-2 border-white z-10 shadow-sm`}
              />

              {/* Content */}
              <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div class="flex items-center gap-3 mb-2">
                  <time class="text-sm text-gray-500 font-mono">
                    {formatTimelineDate(event.date)}
                  </time>
                  {event.type && (
                    <span
                      class={`text-xs px-2 py-0.5 rounded-full border ${colors.border} ${colors.text} bg-transparent`}
                    >
                      {typeLabels[event.type] || event.type}
                    </span>
                  )}
                </div>
                <h3 class="text-gray-900 font-semibold">{event.title}</h3>
                {event.description && (
                  <p class="text-sm text-gray-500 mt-1">{event.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

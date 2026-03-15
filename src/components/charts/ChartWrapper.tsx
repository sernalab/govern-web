import type { ComponentChildren } from 'preact';

interface ChartWrapperProps {
  children: ComponentChildren;
  height?: string;
  loading?: boolean;
}

export default function ChartWrapper({ children, height = '300px', loading = false }: ChartWrapperProps) {
  return (
    <div
      class="relative w-full rounded-lg bg-white border border-gray-200 p-4"
      style={{ minHeight: height }}
    >
      {children}
      {loading && (
        <div class="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            <span class="text-xs text-gray-400">Carregant...</span>
          </div>
        </div>
      )}
    </div>
  );
}

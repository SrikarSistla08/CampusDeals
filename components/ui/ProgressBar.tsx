'use client'

interface ProgressBarProps {
  progress: number
  label?: string
}

export default function ProgressBar({ progress, label = 'Progress' }: ProgressBarProps) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      {/* eslint-disable-next-line react/forbid-dom-props */}
      <div
        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
        // @ts-expect-error - Dynamic width requires inline style
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-label={`${label}: ${progress}%`}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}


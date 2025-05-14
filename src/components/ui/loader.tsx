import clsx from 'clsx'

const Loader = ({ className }: { className: string }) => {
  return (
    // p-[1.65rem]
    <div className={clsx(className, '')}>
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 100 100">
        <circle
          fill="none"
          strokeWidth="15"
          className="stroke-current opacity-40"
          cx="50"
          cy="50"
          r="40"
        />
        <circle
          fill="none"
          strokeWidth="15"
          className="stroke-current"
          strokeDasharray="250"
          strokeDashoffset="210"
          cx="50"
          cy="50"
          r="40"
        />
      </svg>
    </div>
  )
}

export default Loader

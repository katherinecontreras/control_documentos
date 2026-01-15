export default function Card({
  as = 'button',
  onClick,
  children,
  className = '',
  disabled = false,
}) {
  const base =
    'text-left bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-purple-300 transition-all'

  const classes = [base, disabled ? 'opacity-60 cursor-not-allowed hover:shadow-sm' : '', className]
    .filter(Boolean)
    .join(' ')

  if (as === 'div') {
    return <div className={classes}>{children}</div>
  }

  return (
    <button type="button" onClick={onClick} className={classes} disabled={disabled}>
      {children}
    </button>
  )
}


import type { ApplicationStatus } from '../../types'
import { STATUS_CONFIG } from '../../utils/statusConfig'

interface Props {
  status: ApplicationStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const { bg, text, border, darkBg, darkText, darkBorder } = STATUS_CONFIG[status]
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-flex items-center rounded-full border font-medium whitespace-nowrap ${bg} ${text} ${border} ${darkBg} ${darkText} ${darkBorder} ${padding}`}>
      {status}
    </span>
  )
}

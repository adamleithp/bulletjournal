import { useState, useRef, useEffect, useCallback } from 'react'
import { Square, Circle, Minus, X, Save, Plus } from 'lucide-react'
import type { BulletItem, BulletType } from '@/lib/database.types'
import { getToday } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DatePickerDropdown } from './date-picker-dropdown'
import { BulletIcon } from './bullet-icon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Toggle, ToggleGroup, Toolbar } from '@base-ui/react'
import { BulletItemTypeToggle } from './bullet-item-type-toggle'
import { BulletIconForm } from './bullet-icon-form'

const bulletTypes: {
  type: BulletType
  icon: React.ReactNode
  label: string
}[] = [
  { type: 'task', icon: <Square className="size-3.5" />, label: 'Task' },
  { type: 'note', icon: <Minus className="size-3.5" />, label: 'Note' },
  { type: 'event', icon: <Circle className="size-3.5" />, label: 'Event' },
]

type BulletItemFormProps = {
  /** Existing item for edit mode. If undefined, form is in create mode. */
  item?: BulletItem
  /** Default date for new items */
  defaultDate?: string
  /** Called when creating a new item */
  onCreate?: (content: string, type: BulletType, date: string) => Promise<void>
  /** Called when updating an existing item */
  onSave?: (content: string, type: BulletType, date: string) => Promise<void>
  /** Called when cancelling */
  onCancel: () => void
  /** Called when form loses focus without changes (edit mode only) */
  onBlurClose?: () => void
  /** Class name for the container */
  className?: string
}

export const BulletItemForm = ({
  item,
  defaultDate,
  onCreate,
  onSave,
  onCancel,
  onBlurClose,
  className,
}: BulletItemFormProps) => {
  const isEditMode = !!item
  const [isCompleted, setIsCompleted] = useState(item?.completed ?? false)
  const [content, setContent] = useState(item?.content ?? '')
  const [selectedType, setSelectedType] = useState<BulletType>(
    item?.type ?? 'task',
  )
  const [selectedDate, setSelectedDate] = useState(
    item?.date ?? defaultDate ?? getToday(),
  )

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      if (isEditMode) {
        inputRef.current.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length,
        )
      }
    }
  }, [isEditMode])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [content])

  const hasChanges = isEditMode
    ? content.trim() !== item.content ||
      selectedDate !== item.date ||
      selectedType !== item.type
    : false

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) return

    if (isEditMode && onSave) {
      await onSave(content.trim(), selectedType, selectedDate)
    } else if (onCreate) {
      await onCreate(content.trim(), selectedType, selectedDate)
      // Reset form for next entry in create mode
      setContent('')
      inputRef.current?.focus()
    }
  }, [content, selectedType, selectedDate, isEditMode, onCreate, onSave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      } else if (e.key === 'Escape') {
        onCancel()
      }
    },
    [handleSubmit, onCancel],
  )

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      const currentTarget = e.currentTarget
      requestAnimationFrame(() => {
        const activeElement = document.activeElement
        // Check if focus moved to a dropdown menu portal
        const isInDropdownPortal = activeElement?.closest(
          '[data-slot="dropdown-menu-content"]',
        )

        if (currentTarget.contains(activeElement) || isInDropdownPortal) {
          return
        }

        // In create mode, close if no content
        if (!isEditMode && !content.trim()) {
          onCancel()
          return
        }
      })
    },
    [content, isEditMode, hasChanges, onCancel, onBlurClose],
  )

  return (
    <div
      ref={containerRef}
      className={cn('bullet-item-form', className)}
      onBlur={handleBlur}
    >
      {/* Content input */}
      <div className="flex items-start gap-2">
      
      {/* presentational icon */}
      <BulletIconForm
          item={{
            id: item?.id ?? '',
            type: selectedType,
            completed: isCompleted,
            migrated: false,
          }}
          onToggleComplete={async () => {
            setIsCompleted(!isCompleted)
          }}
        />

        {/* Type selector row */}
        {/* <Select
          defaultValue={selectedType}
          items={bulletTypes.map(({ type, icon, label }) => ({
            value: type,
            label: label,
            icon: icon,
          }))}
        >
          <SelectTrigger
            aria-label="Select date"
            className="p-1 h-4 "
            size="sm"
            showIcon={false}
          >
            <SelectValue>
              <BulletIcon type={selectedType} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="p-1">
            {bulletTypes.map(({ type, label }) => (
              <SelectItem
                key={type}
                value={type}
                onClick={() => setSelectedType(type)}
                aria-label={`Select ${label}`}
              >
                <BulletIcon type={type} />
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select> */}

        {/* content input */}
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isEditMode ? 'Enter content...' : "What's on your mind?"}
          className={cn(
            'min-h-6 flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none',
            'placeholder:text-muted-foreground',
          )}
          rows={1}
          aria-label={isEditMode ? 'Edit bullet content' : 'New item content'}
        />
      </div>

      <div className="flex h-px bg-border -mx-2"/>

      <div className="flex items-center gap-1 justify-between">
        <div className="flex items-center gap-1 -ml-1">
          <BulletItemTypeToggle 
            selectedType={selectedType} 
            setSelectedType={setSelectedType} 
           />
          <DatePickerDropdown value={selectedDate} onChange={setSelectedDate} />
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onCancel}
            aria-label="Cancel"
          >
            <span className="sr-only">Cancel</span>
            <X className="size-3.5" />
          </Button>
          <Button
            size="icon-xs"
            onClick={handleSubmit}
            disabled={!content.trim()}
            aria-label={isEditMode ? 'Save' : 'Add'}
          >
            <span className="sr-only">{isEditMode ? 'Save' : 'Add'}</span>
            {isEditMode ? <Save className="size-3.5" /> : <Plus className="size-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

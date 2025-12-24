import { BulletType } from "./database.types"
import { BulletIcon } from "@/components/bullet-journal/bullet-icon"

export const STATIC_BULLET_TYPES: {
    type: BulletType
    icon: React.ReactNode
    label: string
}[] = [
  {
    type: 'task',
    icon: <BulletIcon type="task" />,
    label: 'Task'
  },
  {
    type: 'note',
    icon: <BulletIcon type="note" />,
    label: 'Note'
  },
  {
    type: 'event',
    icon: <BulletIcon type="event" />,
    label: 'Event'
  },
]
import { Toggle, ToggleGroup } from '@base-ui/react'
import { BulletType } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { STATIC_BULLET_TYPES } from '@/lib/constants'

export const BulletItemTypeToggle = ({
  selectedType,
  setSelectedType,
}: {
  selectedType: BulletType
  setSelectedType: (type: BulletType) => void
}) => {
  return (
    <ToggleGroup 
        defaultValue={[selectedType]} 
        onValueChange={(groupValue: string[]) => setSelectedType(groupValue[0] as BulletType)}
    >
      {STATIC_BULLET_TYPES.map(({ type, icon, label }) => (
        <Toggle
          key={type}
          value={type}
          onFocus={() => setSelectedType(type)}
          render={(props, state) => {
            return (
              <Button
                variant="ghost"
                size="xs"
                className="px-1"
                {...props}
                aria-pressed={state.pressed}
              >
                {icon}
                {label}
              </Button>
            )
          }}
        />
      ))}
    </ToggleGroup>
  )
}

import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { Tooltip } from '@base-ui/react'
import { ArrowBigDown } from 'lucide-react'
import appCss from '../styles.css?url'

export const tooltipHandle = Tooltip.createHandle<{ text: string }>()

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Bullet Journal',
      },
      {
        name: 'description',
        content:
          'A minimal bullet journal app for managing your tasks, notes, and events',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
  }),

  shellComponent: RootDocument,
  component: RootComponent,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen antialiased isolate">
        <Tooltip.Provider>
          {children}

          <Tooltip.Root handle={tooltipHandle}>
            {({ payload }) => {
              return (
                <Tooltip.Portal>
                  <Tooltip.Positioner
                    sideOffset={10}
                    className="
                h-(--positioner-height) w-(--positioner-width)
                max-w-(--available-width)
                transition-[top,left,right,bottom,transform]
                duration-[0.35s]
                ease-[cubic-bezier(0.22,1,0.36,1)]
                data-instant:transition-none"
                  >
                    <Tooltip.Popup
                      className="
                  relative
                  h-(--popup-height,auto) w-(--popup-width,auto)
                  max-w-[500px]
                  rounded-md
                  bg-[canvas]
                  text-sm
                  origin-(--transform-origin)
                  shadow-lg shadow-gray-200 outline-1 outline-gray-200
                  transition-[width,height,opacity,scale]
                  duration-[0.35s]
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  data-ending-style:opacity-0 data-ending-style:scale-90
                  data-instant:transition-none
                  data-starting-style:opacity-0 data-starting-style:scale-90
                  dark:shadow-none dark:outline-gray-300 dark:-outline-offset-1"
                    >
                      <Tooltip.Arrow
                        className="
                    flex
                    transition-[left]
                    duration-[0.35s]
                    ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-instant:transition-none
                    data-[side=bottom]:-top-2 data-[side=bottom]:rotate-0
                    data-[side=left]:right-[-13px] data-[side=left]:rotate-90
                    data-[side=right]:left-[-13px] data-[side=right]:-rotate-90
                    data-[side=top]:-bottom-2 data-[side=top]:rotate-180"
                      >
                        <ArrowBigDown />
                      </Tooltip.Arrow>

                      <Tooltip.Viewport
                        className="
                    [--viewport-inline-padding:0.5rem]
                    relative
                    h-full w-full
                    overflow-clip
                    px-[var(--viewport-inline-padding)] py-1
                    [&_[data-previous]]:w-[calc(var(--popup-width)-2*var(--viewport-inline-padding))]
                    [&_[data-previous]]:translate-x-0
                    [&_[data-previous]]:opacity-100
                    [&_[data-previous]]:transition-[translate,opacity]
                    [&_[data-previous]]:duration-[350ms,175ms]
                    [&_[data-previous]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                    [&_[data-current]]:w-[calc(var(--popup-width)-2*var(--viewport-inline-padding))]
                    [&_[data-current]]:translate-x-0
                    [&_[data-current]]:opacity-100
                    [&_[data-current]]:transition-[translate,opacity]
                    [&_[data-current]]:duration-[350ms,175ms]
                    [&_[data-current]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:-translate-x-1/2
                    data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:opacity-0
                    data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:translate-x-1/2
                    data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:opacity-0
                    [[data-instant]_&_[data-previous]]:transition-none
                    [[data-instant]_&_[data-current]]:transition-none
                    data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:translate-x-1/2
                    data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:opacity-0
                    data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:-translate-x-1/2
                    data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:opacity-0"
                      >
                        {payload !== undefined && <>{payload.text}</>}
                      </Tooltip.Viewport>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              )
            }}
          </Tooltip.Root>
        </Tooltip.Provider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  return (
    <div className="flex min-h-screen flex-col">
      <Outlet />
    </div>
  )
}

"use client"

import * as React from "react"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const [position, setPosition] = React.useState<ToasterProps["position"]>("top-right")

  React.useEffect(() => {
    const handleResize = () => {
      setPosition(window.innerWidth < 768 ? "top-center" : "top-right")
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={position}
      expand={true}
      closeButton
      visibleToasts={4}
      toastOptions={{
        classNames: {
          // MONO/INK base: sharp corners, bold black frame, no shadow — sonner's
          // own richColors palette (soft pastel green/red/blue) clashed with the
          // site's black/white + Vespa-red design language, so it's off in favor
          // of these explicit overrides.
          toast: "!rounded-none !border-2 !border-black !bg-white !shadow-none !gap-3",
          title: "!text-foreground !font-bold",
          description: "!text-muted-foreground",
          // Error/warning get the Vespa-red treatment (border + icon + title) —
          // the same "red marks trouble" rule already used for OOS/pending badges.
          error: "!border-brand [&_[data-title]]:!text-brand",
          warning: "!border-brand [&_[data-title]]:!text-brand",
          closeButton: "!bg-white !border-2 !border-black !rounded-none !text-foreground hover:!bg-black hover:!text-white !left-auto !right-1 !top-2 !transform-none",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-foreground" />,
        info: <InfoIcon className="size-4 text-foreground" />,
        warning: <TriangleAlertIcon className="size-4 text-brand" />,
        error: <OctagonXIcon className="size-4 text-brand" />,
        loading: <Loader2Icon className="size-4 animate-spin text-foreground" />,
      }}
      {...props}
    />
  )
}

export { Toaster }

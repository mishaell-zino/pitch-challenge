"use client"

import { useSettings } from "@/components/settings-provider"

// A keyboard-accessible skip link so screen-reader and keyboard users can jump
// straight to the conversation without tabbing through the header controls.
export function SkipToChat() {
  const { t } = useSettings()
  return (
    <a
      href="#conversation"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-base focus:font-medium focus:text-primary-foreground"
    >
      {t("a11y.skipToChat")}
    </a>
  )
}

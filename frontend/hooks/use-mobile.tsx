"use client"

import { useState, useEffect } from "react"
import { Dimensions } from "react-native"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(true) // Default to mobile for React Native

  useEffect(() => {
    const updateLayout = () => {
      const { width } = Dimensions.get("window")
      setIsMobile(width < MOBILE_BREAKPOINT)
    }

    // Initial check
    updateLayout()

    // Listen for orientation changes
    const subscription = Dimensions.addEventListener("change", updateLayout)

    return () => subscription?.remove()
  }, [])

  return isMobile
}

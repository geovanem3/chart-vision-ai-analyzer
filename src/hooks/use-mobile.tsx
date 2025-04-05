
import * as React from "react"

// Breakpoints para diferentes tamanhos de tela
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Check immediately on mount
    setIsMobile(window.innerWidth < BREAKPOINTS.MOBILE)
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.MOBILE)
    }
    
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Check immediately on mount
    setIsTablet(
      window.innerWidth >= BREAKPOINTS.MOBILE && 
      window.innerWidth < BREAKPOINTS.TABLET
    )
    
    const handleResize = () => {
      setIsTablet(
        window.innerWidth >= BREAKPOINTS.MOBILE && 
        window.innerWidth < BREAKPOINTS.TABLET
      )
    }
    
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return isTablet
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Check immediately on mount
    setIsDesktop(window.innerWidth >= BREAKPOINTS.DESKTOP)
    
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= BREAKPOINTS.DESKTOP)
    }
    
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return isDesktop
}

export function useViewportSize() {
  const [size, setSize] = React.useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  React.useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    
    // Check immediately on mount
    handleResize()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

// New hook for detecting device pixel ratio (for better rendering on high-DPI screens)
export function useDevicePixelRatio() {
  const [dpr, setDpr] = React.useState<number>(
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  )

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`
    )

    const updatePixelRatio = () => {
      setDpr(window.devicePixelRatio || 1)
    }

    mediaQuery.addEventListener('change', updatePixelRatio)
    return () => mediaQuery.removeEventListener('change', updatePixelRatio)
  }, [])

  return dpr
}

// New hook for detecting orientation
export function useOrientation() {
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth 
      ? 'portrait' 
      : 'landscape'
  )

  React.useEffect(() => {
    const handleResize = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      )
    }
    
    // Check immediately on mount
    handleResize()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return orientation
}

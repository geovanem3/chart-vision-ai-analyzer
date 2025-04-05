
import * as React from "react"

// Breakpoints para diferentes tamanhos de tela
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.MOBILE - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.MOBILE)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < BREAKPOINTS.MOBILE)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(min-width: ${BREAKPOINTS.MOBILE}px) and (max-width: ${BREAKPOINTS.TABLET - 1}px)`
    )
    const onChange = () => {
      setIsTablet(
        window.innerWidth >= BREAKPOINTS.MOBILE && 
        window.innerWidth < BREAKPOINTS.TABLET
      )
    }
    mql.addEventListener("change", onChange)
    setIsTablet(
      window.innerWidth >= BREAKPOINTS.MOBILE && 
      window.innerWidth < BREAKPOINTS.TABLET
    )
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isTablet
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.DESKTOP}px)`)
    const onChange = () => {
      setIsDesktop(window.innerWidth >= BREAKPOINTS.DESKTOP)
    }
    mql.addEventListener("change", onChange)
    setIsDesktop(window.innerWidth >= BREAKPOINTS.DESKTOP)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isDesktop
}

export function useViewportSize() {
  const [size, setSize] = React.useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  React.useEffect(() => {
    const onResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return size
}

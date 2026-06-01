import { useWindowDimensions, Platform } from 'react-native';

export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
};

export const MAX_CONTENT_WIDTH = 1200;
export const SIDEBAR_WIDTH = 240;

/**
 * Central hook for responsive layouts across app and web.
 * Use this in any screen or component to adapt to screen size.
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const isTablet = width >= BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isMobile = width < BREAKPOINTS.tablet;

  return {
    isWeb,
    isMobile,
    isTablet,
    isDesktop,
    windowWidth: width,
    windowHeight: height,
  };
};

/**
 * Returns a content max-width and horizontal padding for centered web layouts.
 */
export const useContentWidth = () => {
  const { windowWidth, isDesktop } = useResponsive();
  if (isDesktop) {
    return Math.min(windowWidth - SIDEBAR_WIDTH, MAX_CONTENT_WIDTH);
  }
  return windowWidth;
};

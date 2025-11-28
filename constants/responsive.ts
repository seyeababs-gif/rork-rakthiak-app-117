import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

export const BREAKPOINTS = {
  mobile: 600,
  tablet: 900,
  desktop: 1200,
  largeDesktop: 1600,
} as const;

export const getDeviceType = () => {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  if (width < BREAKPOINTS.desktop) return 'desktop';
  return 'largeDesktop';
};

export const isMobile = () => width < BREAKPOINTS.mobile;
export const isTablet = () => width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
export const isDesktop = () => width >= BREAKPOINTS.tablet;
export const isLargeDesktop = () => width >= BREAKPOINTS.largeDesktop;

export const getResponsiveValue = <T,>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
  largeDesktop?: T;
}): T => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'largeDesktop':
      return values.largeDesktop ?? values.desktop ?? values.tablet ?? values.mobile;
    case 'desktop':
      return values.desktop ?? values.tablet ?? values.mobile;
    case 'tablet':
      return values.tablet ?? values.mobile;
    default:
      return values.mobile;
  }
};

export const getGridColumns = () => {
  return getResponsiveValue({
    mobile: 2,
    tablet: 3,
    desktop: 4,
    largeDesktop: 5,
  });
};

export const getProductCardWidth = () => {
  const columns = getGridColumns();
  const gap = getResponsiveValue({ mobile: 12, tablet: 16, desktop: 16, largeDesktop: 20 });
  const containerPadding = getResponsiveValue({ mobile: 16, tablet: 20, desktop: 32, largeDesktop: 40 });
  const maxContainerWidth = getResponsiveValue({ mobile: width, tablet: width, desktop: width, largeDesktop: BREAKPOINTS.largeDesktop });
  
  const availableWidth = Math.min(width, maxContainerWidth) - (containerPadding * 2);
  const cardWidth = (availableWidth - (gap * (columns - 1))) / columns;
  
  const maxCardWidth = getResponsiveValue({ mobile: 200, tablet: 280, desktop: 300, largeDesktop: 320 });
  return Math.min(cardWidth, maxCardWidth);
};

export const getButtonHeight = () => {
  return getResponsiveValue({
    mobile: 48,
    tablet: 52,
    desktop: 56,
  });
};

export const getButtonFontSize = () => {
  return getResponsiveValue({
    mobile: 16,
    tablet: 17,
    desktop: 18,
  });
};

export const getInputHeight = () => {
  return getResponsiveValue({
    mobile: 48,
    tablet: 52,
    desktop: 56,
  });
};

export const getHeaderHeight = () => {
  return getResponsiveValue({
    mobile: 'auto' as const,
    tablet: 'auto' as const,
    desktop: 'auto' as const,
  });
};

export const getContainerPadding = () => {
  return getResponsiveValue({
    mobile: 16,
    tablet: 20,
    desktop: 32,
    largeDesktop: 40,
  });
};

export const getMaxContainerWidth = (): number | string => {
  return getResponsiveValue<number | string>({
    mobile: '100%',
    tablet: '100%',
    desktop: 1400,
    largeDesktop: 1600,
  });
};

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
  if (width < 400) return 2;
  if (width < BREAKPOINTS.mobile) return 2;
  if (width < BREAKPOINTS.tablet) return 3;
  if (width < BREAKPOINTS.desktop) return 4;
  if (width < BREAKPOINTS.largeDesktop) return 5;
  return 6;
};

export const getProductCardWidth = () => {
  const columns = getGridColumns();
  const gap = width < BREAKPOINTS.mobile ? 12 : (width < BREAKPOINTS.desktop ? 16 : 20);
  const containerPadding = width < BREAKPOINTS.mobile ? 16 : (width < BREAKPOINTS.desktop ? 20 : 20);
  
  const maxContainerWidth = width < BREAKPOINTS.desktop ? width : 1600;
  const containerWidth = Math.min(width, maxContainerWidth);
  const availableWidth = containerWidth - (containerPadding * 2);
  const totalGapWidth = gap * (columns - 1);
  const cardWidth = (availableWidth - totalGapWidth) / columns;
  
  const maxCardWidth = 320;
  const minCardWidth = width < 400 ? 140 : (width < BREAKPOINTS.mobile ? 150 : 180);
  
  return Math.max(Math.min(cardWidth, maxCardWidth), minCardWidth);
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

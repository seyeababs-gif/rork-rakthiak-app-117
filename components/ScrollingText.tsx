import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, LayoutChangeEvent, Platform } from 'react-native';

interface ScrollingTextProps {
  message: string;
  speed?: number;
  backgroundColor?: string;
  textColor?: string;
  height?: number;
  fontSize?: number;
}

export default function ScrollingText({
  message,
  speed = 50,
  backgroundColor = 'transparent',
  textColor = '#FFD700',
  height = 24,
  fontSize = 13,
}: ScrollingTextProps) {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [textWidth, setTextWidth] = useState<number>(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (containerWidth === 0 || textWidth === 0) return;

    if (animationRef.current) {
      animationRef.current.stop();
    }

    scrollAnim.setValue(containerWidth);

    const distance = containerWidth + textWidth;
    const duration = (distance / speed) * 1000;

    const animation = Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: -textWidth,
        duration: duration,
        useNativeDriver: Platform.OS !== 'web',
        isInteraction: false,
      })
    );

    animationRef.current = animation;
    animation.start();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [containerWidth, textWidth, message, speed, scrollAnim]);

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const handleTextLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setTextWidth(width);
  };

  if (!message) return null;

  return (
    <View
      style={[styles.container, { backgroundColor, height }]}
      onLayout={handleContainerLayout}
    >
      <Animated.View
        style={[
          styles.textContainer,
          {
            transform: [{ translateX: scrollAnim }],
          },
        ]}
        onLayout={handleTextLayout}
      >
        <Text
          style={[styles.text, { color: textColor, fontSize }]}
          numberOfLines={1}
        >
          ✨ {message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    width: '100%',
  },
  textContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  text: {
    fontWeight: '700' as const,
    whiteSpace: 'nowrap' as any,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

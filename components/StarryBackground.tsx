import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const STARS = (() => {
  const stars: { x: number; y: number; r: number; opacity: number; key: number }[] = [];
  for (let i = 0; i < 130; i++) {
    const seed = i + 1;
    const x = ((seed * 73.14 * 7.3 + seed * 3.7) % width + width) % width;
    const y = ((seed * 137.508 * 9.1 + seed * 5.3) % height + height) % height;
    const r = 0.5 + ((seed * 0.618034) % 1.5);
    const opacity = 0.1 + ((seed * 0.38196) % 0.6);
    stars.push({ x, y, r, opacity, key: i });
  }
  return stars;
})();

export function StarryBackground({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0C0C0C', '#111111', '#130D07']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      {STARS.map((star) => (
        <View
          key={star.key}
          style={{
            position: 'absolute',
            left: star.x,
            top: star.y,
            width: star.r * 2,
            height: star.r * 2,
            borderRadius: star.r,
            opacity: star.opacity,
            backgroundColor: '#FFFFFF',
          }}
        />
      ))}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
});

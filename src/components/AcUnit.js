import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';

export default function AcUnit({ isPowerOn, targetTemp }) {
  // Animation for airflow lines
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPowerOn) {
      const createLoop = (anim, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1800,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const anim1 = createLoop(waveAnim1, 0);
      const anim2 = createLoop(waveAnim2, 800);

      anim1.start();
      anim2.start();

      return () => {
        anim1.stop();
        anim2.stop();
      };
    } else {
      waveAnim1.setValue(0);
      waveAnim2.setValue(0);
    }
  }, [isPowerOn]);

  return (
    <View style={styles.container}>
      {/* Precision Straight AC Chassis (MIMO Aesthetic) */}
      <View style={styles.acChassis}>
        <Svg width="300" height="76" viewBox="0 0 300 76">
          {/* Main Enclosure - Straight 0-radius */}
          <Rect x="0" y="0" width="300" height="76" fill="#121212" stroke="#2a2a2a" strokeWidth="1" />
          
          {/* Top Grille Linear Slots */}
          <Line x1="16" y1="12" x2="284" y2="12" stroke="#222222" strokeWidth="1.5" strokeDasharray="6 4" />
          <Line x1="16" y1="18" x2="284" y2="18" stroke="#222222" strokeWidth="1.5" strokeDasharray="6 4" />
          
          {/* Lower Vent Louver - Straight */}
          <Rect x="12" y="52" width="276" height="14" fill="#090909" stroke="#262626" strokeWidth="1" />
          <Line x1="12" y1="58" x2="288" y2="58" stroke="#1f1f1f" strokeWidth="1" />

          {/* Technical Alignment Crosshairs */}
          <Line x1="150" y1="36" x2="150" y2="40" stroke="#333333" strokeWidth="1" />
          <Line x1="148" y1="38" x2="152" y2="38" stroke="#333333" strokeWidth="1" />
        </Svg>

        {/* Brand Monospace Badge */}
        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>HISENSE // INVERTER</Text>
        </View>

        {/* LED Digital Temperature Segment (Sharp box on right) */}
        {isPowerOn && (
          <View style={styles.ledDisplay}>
            <Text style={styles.ledDigits}>{targetTemp || 26}°C</Text>
          </View>
        )}
      </View>

      {/* Airflow Flow Streams (Clean Straight Indicators) */}
      {isPowerOn && (
        <View style={styles.airflowContainer}>
          <Animated.View
            style={[
              styles.airflowBar,
              {
                opacity: waveAnim1.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0, 0.8, 0],
                }),
                transform: [
                  {
                    translateY: waveAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 14],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.airflowBar,
              styles.airflowBarSubtle,
              {
                opacity: waveAnim2.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0, 0.5, 0],
                }),
                transform: [
                  {
                    translateY: waveAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 18],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
    width: '100%',
  },
  acChassis: {
    width: 300,
    height: 76,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#121212',
  },
  brandBadge: {
    position: 'absolute',
    left: 14,
    top: 28,
  },
  brandText: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  ledDisplay: {
    position: 'absolute',
    right: 14,
    top: 24,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
  },
  ledDigits: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  airflowContainer: {
    width: 270,
    height: 22,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 2,
    overflow: 'hidden',
  },
  airflowBar: {
    width: 240,
    height: 1,
    backgroundColor: '#ffffff',
    marginTop: 2,
  },
  airflowBarSubtle: {
    width: 200,
    backgroundColor: '#888888',
  },
});

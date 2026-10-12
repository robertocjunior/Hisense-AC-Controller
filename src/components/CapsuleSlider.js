import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import * as Haptics from 'expo-haptics';

const MIN_TEMP = 16;
const MAX_TEMP = 30;
const THUMB_WIDTH = 48;

export default function CapsuleSlider({ temperature, onTempChange, isPowerOn }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [draggingTemp, setDraggingTemp] = useState(null);

  const trackRef = useRef(null);
  const trackPosRef = useRef({ pageX: 0, width: 0 });
  const touchStartXRef = useRef(0);
  const activeTempRef = useRef(temperature);
  const lastEmittedTempRef = useRef(temperature);

  useEffect(() => {
    activeTempRef.current = temperature;
  }, [temperature]);

  const displayTemp = draggingTemp !== null ? draggingTemp : temperature;
  const pct = Math.max(0, Math.min(1, (displayTemp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)));

  const updateFromTouchX = (touchX) => {
    const w = trackPosRef.current.width || trackWidth;
    if (w <= THUMB_WIDTH) return;

    const maxMove = w - THUMB_WIDTH;
    const clampedPos = Math.max(0, Math.min(maxMove, touchX - THUMB_WIDTH / 2));
    const newPct = clampedPos / maxMove;
    const computedTemp = Math.round(MIN_TEMP + newPct * (MAX_TEMP - MIN_TEMP));

    if (computedTemp !== activeTempRef.current) {
      activeTempRef.current = computedTemp;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDraggingTemp(computedTemp);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isPowerOn,
      onStartShouldSetPanResponderCapture: () => isPowerOn,
      onMoveShouldSetPanResponder: () => isPowerOn,
      onMoveShouldSetPanResponderCapture: () => isPowerOn,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: (evt, gestureState) => {
        if (!isPowerOn) return;

        // Refresh track position
        trackRef.current?.measure((x, y, w, h, pageX) => {
          if (w > 0) trackPosRef.current = { pageX, width: w };
        });

        let touchX;
        if (trackPosRef.current.pageX > 0 && trackPosRef.current.width > 0) {
          touchX = evt.nativeEvent.pageX - trackPosRef.current.pageX;
        } else {
          touchX = evt.nativeEvent.locationX;
        }

        touchStartXRef.current = touchX;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        updateFromTouchX(touchX);
      },

      onPanResponderMove: (evt, gestureState) => {
        if (!isPowerOn) return;

        let touchX;
        if (trackPosRef.current.pageX > 0 && trackPosRef.current.width > 0) {
          touchX = evt.nativeEvent.pageX - trackPosRef.current.pageX;
        } else {
          touchX = touchStartXRef.current + gestureState.dx;
        }

        updateFromTouchX(touchX);
      },

      onPanResponderRelease: () => {
        if (!isPowerOn) return;

        const finalTemp = activeTempRef.current;
        setDraggingTemp(null);

        if (finalTemp !== lastEmittedTempRef.current) {
          lastEmittedTempRef.current = finalTemp;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onTempChange(finalTemp);
        }
      },

      onPanResponderTerminate: () => {
        setDraggingTemp(null);
      },
    })
  ).current;

  const maxMove = Math.max(0, trackWidth - THUMB_WIDTH);
  const thumbLeft = maxMove * pct;
  const fillWidth = thumbLeft + THUMB_WIDTH / 2;

  return (
    <View style={styles.container}>
      {/* Big Digital Temperature Readout */}
      <View style={styles.digitsRow}>
        <Text style={[styles.tempDigits, !isPowerOn && styles.tempDigitsDisabled]}>
          {displayTemp}
        </Text>
        <Text style={[styles.tempDegree, !isPowerOn && styles.tempDegreeDisabled]}>°C</Text>
      </View>

      {/* Pure Full-Width Slider Track (No +/- Buttons) */}
      <View
        ref={trackRef}
        style={[styles.track, !isPowerOn && styles.trackDisabled]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setTrackWidth(w);
          trackRef.current?.measure((x, y, width, height, pageX) => {
            if (width > 0) {
              trackPosRef.current = { pageX, width };
            }
          });
        }}
        {...panResponder.panHandlers}
      >
        {/* Fill from left to thumb */}
        <View style={[styles.fill, { width: fillWidth }]} />

        {/* High-Contrast White Thumb */}
        <View
          style={[
            styles.thumb,
            { left: thumbLeft },
            draggingTemp !== null && styles.thumbActive,
            !isPowerOn && styles.thumbDisabled,
          ]}
        >
          <View style={styles.thumbHandleLine} />
          <View style={[styles.thumbHandleLine, { marginLeft: 3 }]} />
        </View>
      </View>

      {/* Minimum / Maximum scale markings */}
      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>16°C</Text>
        <Text style={styles.scaleText}>30°C</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tempDigits: {
    color: '#ffffff',
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    lineHeight: 70,
  },
  tempDigitsDisabled: {
    color: '#444444',
  },
  tempDegree: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginLeft: 4,
  },
  tempDegreeDisabled: {
    color: '#444444',
  },
  track: {
    width: '100%',
    height: 52,
    backgroundColor: '#121212',
    borderRadius: 0,
    position: 'relative',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
  },
  trackDisabled: {
    opacity: 0.35,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#222222',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_WIDTH,
    height: 50,
    borderRadius: 0,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    top: 0,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  thumbActive: {
    backgroundColor: '#ffffff',
    elevation: 4,
  },
  thumbDisabled: {
    backgroundColor: '#555555',
    borderColor: '#555555',
  },
  thumbHandleLine: {
    width: 2,
    height: 18,
    backgroundColor: '#000000',
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
    marginTop: 8,
  },
  scaleText: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

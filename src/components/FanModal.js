import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const SPEEDS = [
  { code: '0', name: 'Auto', desc: 'Inteligente', icon: 'sync', index: '00' },
  { code: '5', name: 'Low', desc: 'Silencioso', icon: 'fan-speed-1', index: '01' },
  { code: '6', name: 'Mid-Low', desc: 'Suave', icon: 'fan-speed-2', index: '02' },
  { code: '7', name: 'Medium', desc: 'Normal', icon: 'fan-speed-3', index: '03' },
  { code: '8', name: 'Mid-High', desc: 'Intenso', icon: 'fan', index: '04' },
  { code: '9', name: 'High', desc: 'Máximo', icon: 'weather-windy', index: '05' },
];

export default function FanModal({ visible, currentSpeed, isMute, onSelect, onClose }) {
  const handleSelect = (code) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(code);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <Text style={styles.title}>VELOCIDADE DO VENTILADOR</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.grid}>
                {SPEEDS.map((s) => {
                  const isSelected = !isMute && String(currentSpeed) === s.code;
                  return (
                    <TouchableOpacity
                      key={s.code}
                      style={[styles.card, isSelected && styles.cardSelected]}
                      onPress={() => handleSelect(s.code)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cardTopRow}>
                        <MaterialCommunityIcons
                          name={s.icon}
                          size={20}
                          color={isSelected ? '#000000' : '#888888'}
                        />
                      </View>
                      <Text style={[styles.speedName, isSelected && styles.speedNameSelected]}>
                        {s.name.toUpperCase()}
                      </Text>
                      <Text style={[styles.speedDesc, isSelected && styles.speedDescSelected]}>
                        {s.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0a0a0a',
    borderRadius: 0,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  title: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 0,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: '#121212',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#222222',
    minHeight: 82,
    justifyContent: 'space-between',
  },
  cardSelected: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indexText: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  indexSelected: {
    color: '#000000',
  },
  speedName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  speedNameSelected: {
    color: '#000000',
  },
  speedDesc: {
    color: '#777777',
    fontSize: 10,
    marginTop: 2,
  },
  speedDescSelected: {
    color: '#333333',
  },
});

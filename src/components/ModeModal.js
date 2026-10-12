import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const MODES = [
  { code: '2', name: 'Cool', desc: 'Refrigeração ativa', icon: 'snowflake', index: '01' },
  { code: '1', name: 'Heat', desc: 'Aquecimento ambiente', icon: 'white-balance-sunny', index: '02' },
  { code: '3', name: 'Dry', desc: 'Desumidificação inteligente', icon: 'water-percent', index: '03' },
  { code: '0', name: 'Fan', desc: 'Circulação de ventilação', icon: 'fan', index: '04' },
  { code: '4', name: 'Auto', desc: 'Controle térmico autônomo', icon: 'sync', index: '05' },
];

export default function ModeModal({ visible, currentMode, onSelect, onClose }) {
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
                <Text style={styles.title}>MODO DE OPERAÇÃO</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.optionsList}>
                {MODES.map((m) => {
                  const isSelected = String(currentMode) === m.code;
                  return (
                    <TouchableOpacity
                      key={m.code}
                      style={[styles.optionItem, isSelected && styles.optionSelected]}
                      onPress={() => handleSelect(m.code)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.iconBox}>
                        <MaterialCommunityIcons
                          name={m.icon}
                          size={20}
                          color={isSelected ? '#000000' : '#ffffff'}
                        />
                      </View>
                      <View style={styles.textBox}>
                        <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                          {m.name.toUpperCase()}
                        </Text>
                        <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>
                          {m.desc}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.activeTag}>
                          <Text style={styles.activeTagText}>ATIVO</Text>
                        </View>
                      )}
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
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#222222',
    gap: 12,
  },
  optionSelected: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  indexText: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  indexSelected: {
    color: '#000000',
  },
  iconBox: {
    width: 24,
    alignItems: 'center',
  },
  textBox: {
    flex: 1,
  },
  optionName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  optionNameSelected: {
    color: '#000000',
  },
  optionDesc: {
    color: '#777777',
    fontSize: 11,
    marginTop: 2,
  },
  optionDescSelected: {
    color: '#333333',
  },
  activeTag: {
    backgroundColor: '#000000',
    borderRadius: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function DeviceModal({ visible, appliances, currentPuid, onSelect, onClose }) {
  const handleSelect = (app) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(app);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <Text style={styles.title}>SELECIONAR APARELHO</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.list}>
                {appliances.map((app) => {
                  const isSelected = app.puid === currentPuid;
                  const isPowerOn = app.status?.t_power == '1';
                  return (
                    <TouchableOpacity
                      key={app.puid}
                      style={[styles.item, isSelected && styles.itemSelected]}
                      onPress={() => handleSelect(app)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.iconBox}>
                        <MaterialCommunityIcons
                          name="air-conditioner"
                          size={20}
                          color={isSelected ? '#000000' : '#ffffff'}
                        />
                      </View>

                      <View style={styles.info}>
                        <Text style={[styles.name, isSelected && styles.nameSelected]}>
                          {(app.name || 'Ar Condicionado').toUpperCase()}
                        </Text>
                        <Text style={[styles.room, isSelected && styles.roomSelected]}>
                          {app.room || 'Cômodo'} // {isPowerOn ? 'LIGADO' : 'DESLIGADO'}
                        </Text>
                      </View>

                      {isSelected && (
                        <View style={styles.activeTag}>
                          <Text style={styles.activeTagText}>SELECIONADO</Text>
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
  list: {
    gap: 8,
  },
  item: {
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
  itemSelected: {
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
  info: {
    flex: 1,
  },
  name: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nameSelected: {
    color: '#000000',
  },
  room: {
    color: '#777777',
    fontSize: 11,
    marginTop: 2,
  },
  roomSelected: {
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

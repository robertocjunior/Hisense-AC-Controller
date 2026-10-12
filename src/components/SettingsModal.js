import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getSavedEmail } from '../api';

export default function SettingsModal({ visible, onClose, onLogout }) {
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (visible) {
      getSavedEmail().then(setEmail);
    }
  }, [visible]);

  const handleLogoutPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onClose();
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>CONFIGURAÇÕES</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Account Box */}
              <View style={styles.accountBox}>
                <Text style={styles.accountLabel}>CONTA ATIVA</Text>
                <Text style={styles.accountEmail}>{email ? email.toLowerCase() : 'Conectado'}</Text>
              </View>

              {/* Logout Button: White with Black Text */}
              <TouchableOpacity
                style={styles.btnLogout}
                onPress={handleLogoutPress}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="logout-variant" size={18} color="#000000" />
                <Text style={styles.btnLogoutText}>DESCONECTAR CONTA</Text>
              </TouchableOpacity>
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
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
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
  accountBox: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 0,
    padding: 16,
    marginBottom: 16,
  },
  accountLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  accountEmail: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnLogout: {
    height: 48,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnLogoutText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

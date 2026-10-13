import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Keyboard,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import {
  checkAuthOrAppliances,
  login,
  sendControlCommand,
  logout,
} from './src/api';
import AcUnit from './src/components/AcUnit';
import CapsuleSlider from './src/components/CapsuleSlider';
import ModeModal from './src/components/ModeModal';
import FanModal from './src/components/FanModal';
import DeviceModal from './src/components/DeviceModal';
import SettingsModal from './src/components/SettingsModal';

const MODE_NAMES = { '2': 'Cool', '1': 'Heat', '3': 'Dry', '0': 'Fan', '4': 'Auto' };
const MODE_ICONS = {
  '2': 'snowflake',
  '1': 'white-balance-sunny',
  '3': 'water-percent',
  '0': 'fan',
  '4': 'sync',
};

const FAN_NAMES = {
  '0': 'Auto',
  '5': 'Low',
  '6': 'Mid-Low',
  '7': 'Medium',
  '3': 'Medium',
  '8': 'Mid-High',
  '9': 'High',
};

export default function App() {
  // App state
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [appliances, setAppliances] = useState([]);
  const [currentAppliance, setCurrentAppliance] = useState(null);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Modals state
  const [showModeModal, setShowModeModal] = useState(false);
  const [showFanModal, setShowFanModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState(null);

  // Timestamp of last user action to avoid polling overwrite
  const lastUserActionTime = useRef(0);
  const passwordInputRef = useRef(null);
  const loginShiftAnim = useRef(new Animated.Value(0)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        const kbHeight = (e && e.endCoordinates && e.endCoordinates.height) || 280;
        const shift = Math.min(Math.max(kbHeight * 0.45, 110), 135);
        Animated.timing(loginShiftAnim, {
          toValue: -shift,
          duration: 220,
          useNativeDriver: true,
        }).start();
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        Animated.timing(loginShiftAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start();
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial auth check on mount
  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    setLoading(true);
    try {
      const authRes = await checkAuthOrAppliances();
      if (authRes.authenticated) {
        setAuthenticated(true);
        setAppliances(authRes.appliances);
        if (authRes.appliances.length > 0) {
          const target =
            authRes.appliances.find((a) => (a.name || '').toLowerCase().includes('quarto')) ||
            authRes.appliances[0];
          setCurrentAppliance(target);
        }
      } else {
        setAuthenticated(false);
      }
    } catch (err) {
      console.warn('Bootstrap error:', err.message);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // 2. Regular background polling every 15s
  useEffect(() => {
    if (!authenticated || !currentAppliance) return;

    const interval = setInterval(async () => {
      if (Date.now() - lastUserActionTime.current < 5000) return;

      try {
        const res = await checkAuthOrAppliances();
        if (res.authenticated && res.appliances) {
          setAppliances(res.appliances);
          const fresh = res.appliances.find((a) => a.puid === currentAppliance.puid);
          if (fresh) {
            setCurrentAppliance(fresh);
          }
        }
      } catch (e) {
        console.warn('Polling warning:', e.message);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [authenticated, currentAppliance]);

  // 3. User Login (Direct to ConnectLife Cloud)
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setLoginError('Por favor preencha seu e-mail e senha da conta ConnectLife.');
      return;
    }
    setLoggingIn(true);
    setLoginError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const apps = await login(email.trim(), password.trim());
      setAppliances(apps);
      if (apps.length > 0) {
        const target =
          apps.find((a) => (a.name || '').toLowerCase().includes('quarto')) || apps[0];
        setCurrentAppliance(target);
      }
      setAuthenticated(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('CONECTADO COM SUCESSO');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLoginError(err.message || 'Falha ao autenticar.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {}
    setAuthenticated(false);
    setAppliances([]);
    setCurrentAppliance(null);
    showToast('DESCONECTADO COM SUCESSO');
  };

  // 4. Optimistic Control Engine (0ms feedback + rollback on rejection)
  const dispatchOptimistic = async (optimisticProps, serverPayload = null) => {
    if (!currentAppliance) return;
    lastUserActionTime.current = Date.now();

    const payloadToSend = serverPayload || optimisticProps;
    const rollbackStatus = JSON.parse(JSON.stringify(currentAppliance.status || {}));

    const updatedStatus = { ...currentAppliance.status, ...optimisticProps };
    setCurrentAppliance({
      ...currentAppliance,
      status: updatedStatus,
    });

    try {
      const updatedApps = await sendControlCommand(currentAppliance.puid, payloadToSend);
      if (updatedApps && updatedApps.length > 0) {
        setAppliances(updatedApps);
        const fresh = updatedApps.find((a) => a.puid === currentAppliance.puid);
        if (fresh) {
          setCurrentAppliance({
            ...fresh,
            status: {
              ...(currentAppliance?.status || {}),
              ...(fresh.status || {}),
              ...optimisticProps,
            },
          });
        }
      }
    } catch (err) {
      console.warn('Rollback triggered:', err.message);
      setCurrentAppliance({
        ...currentAppliance,
        status: rollbackStatus,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('COMANDO REJEITADO // ESTADO RESTAURADO');
    }
  };

  // --- Handlers for user actions ---
  const togglePower = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const cur = currentAppliance?.status?.t_power == '1' ? '1' : '0';
    const next = cur === '1' ? '0' : '1';
    dispatchOptimistic({ t_power: next });
  };

  const setTargetTemp = (val) => {
    const next = Math.max(16, Math.min(30, val));
    const opt = { t_temp: String(next) };
    if (currentAppliance?.status?.t_super == '1') {
      opt.t_super = '0';
    }
    dispatchOptimistic(opt);
  };

  const adjustTemp = (delta) => {
    const cur = parseInt(currentAppliance?.status?.t_temp || '26', 10);
    setTargetTemp(cur + delta);
  };

  const setMode = (code) => {
    const opt = { t_work_mode: String(code) };
    if (code !== '2' && currentAppliance?.status?.t_super == '1') {
      opt.t_super = '0';
    }
    dispatchOptimistic(opt);
  };

  const setFanSpeed = (speedCode) => {
    const opt = {
      t_fan_speed: String(speedCode),
      t_fan_mute: '0',
    };
    if (speedCode !== '9' && currentAppliance?.status?.t_super == '1') {
      opt.t_super = '0';
    }
    dispatchOptimistic(opt);
  };

  const toggleSwing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cur = currentAppliance?.status?.t_up_down == '1' ? '1' : '0';
    const next = cur === '1' ? '0' : '1';
    dispatchOptimistic({ t_up_down: next });
  };

  const toggleFastCooling = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isCurrentlyOn = currentAppliance?.status?.t_super == '1';
    if (!isCurrentlyOn) {
      const mode = currentAppliance?.status?.t_work_mode;
      const isHeat = mode === '1';
      const turboTemp = isHeat ? '30' : '16';
      const targetMode = isHeat ? '1' : '2';

      const opt = {
        t_super: '1',
        t_temp: turboTemp,
        t_work_mode: targetMode,
        t_fan_speed: '9',
        t_fan_mute: '0',
        t_eco: '0',
        t_sleep: '0',
      };

      dispatchOptimistic(opt, {
        t_super: '1',
      });
    } else {
      dispatchOptimistic({ t_super: '0' });
    }
  };

  const toggleQuiet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isCurrentlyOn = currentAppliance?.status?.t_fan_mute == '1';
    if (!isCurrentlyOn) {
      dispatchOptimistic(
        {
          t_fan_mute: '1',
          t_super: '0',
          t_fan_speed: '5',
        },
        { t_fan_mute: '1' }
      );
    } else {
      dispatchOptimistic({ t_fan_mute: '0' });
    }
  };

  const toggleSleep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isCurrentlyOn = currentAppliance?.status?.t_sleep == '1';
    const next = isCurrentlyOn ? '0' : '1';
    dispatchOptimistic({ t_sleep: next, t_super: '0' }, { t_sleep: next });
  };

  const toggleEco = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isCurrentlyOn = currentAppliance?.status?.t_eco == '1';
    const next = isCurrentlyOn ? '0' : '1';
    dispatchOptimistic({ t_eco: next, t_super: '0' }, { t_eco: next });
  };

  // Appliance state extraction
  const statusObj = currentAppliance?.status || currentAppliance?.statusList || {};
  const isPowerOn = statusObj.t_power == '1';
  const isFastCooling = statusObj.t_super == '1';
  const workMode = String(statusObj.t_work_mode || '2');
  const targetTemp = isFastCooling
    ? (workMode === '1' ? 30 : 16)
    : parseInt(statusObj.t_temp || '26', 10);
  const rawAmbient =
    statusObj.f_temp_in ??
    statusObj.t_indoortemp_detection ??
    statusObj.t_temp_indoor ??
    statusObj.f_temp_indoor ??
    statusObj.f_temp;
  const ambientTemp =
    rawAmbient != null && rawAmbient !== ''
      ? String(rawAmbient).includes('°')
        ? String(rawAmbient)
        : `${rawAmbient}°C`
      : '--°C';
  const curFan = String(statusObj.t_fan_speed || '0');
  const isMute = statusObj.t_fan_mute == '1';
  const isSwing = statusObj.t_up_down == '1';
  const isSleep = statusObj.t_sleep == '1';
  const isEco = statusObj.t_eco == '1';

  const fanLabel = isMute ? 'Quiet' : FAN_NAMES[curFan] || 'Auto';

  // ----------------------------------------------------
  // RENDER: Loading Splash
  // ----------------------------------------------------
  if (loading) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
        <View style={styles.splashLogoBox}>
          <Text style={styles.splashLogoLetter}>H</Text>
        </View>
        <Text style={styles.splashTitle}>HISENSE</Text>
        <ActivityIndicator size="small" color="#ffffff" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // ----------------------------------------------------
  // RENDER: Login Screen (Xiaomi MIMO Minimalist Style)
  // ----------------------------------------------------
  if (!authenticated) {
    return (
      <SafeAreaView style={styles.loginSafeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
        <View style={styles.loginContainer}>
          <Animated.View
            style={[
              styles.loginAnimatedWrapper,
              { transform: [{ translateY: loginShiftAnim }] },
            ]}
          >
            {/* Header Brand */}
            <View style={styles.loginHeader}>
              <View style={styles.brandLogoBox}>
                <Text style={styles.brandLogoLetter}>H</Text>
              </View>
              <Text style={styles.loginTitle}>CONNECTLIFE</Text>
              <Text style={styles.loginSubtitle}>Controle de Climatização</Text>
            </View>

            {/* Login Box */}
            <View style={styles.loginCard}>
              {loginError ? (
                <View style={styles.errorBadge}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#ef4444" />
                  <Text style={styles.errorText}>{loginError}</Text>
                </View>
              ) : null}

              <Text style={styles.fieldLabel}>E-MAIL</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="seu.email@exemplo.com"
                placeholderTextColor="#555555"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>SENHA</Text>
              <TextInput
                ref={passwordInputRef}
                style={styles.fieldInput}
                placeholder="••••••••••••"
                placeholderTextColor="#555555"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              {/* White Button with Black Text */}
              <TouchableOpacity
                style={[styles.loginBtn, loggingIn && { opacity: 0.6 }]}
                onPress={handleLogin}
                disabled={loggingIn}
                activeOpacity={0.8}
              >
                {loggingIn ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.loginBtnText}>ENTRAR</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------
  // RENDER: Main AC Controller Dashboard (MIMO Aesthetic)
  // ----------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />

      {/* Floating Status Banner */}
      {toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <View style={styles.mainContainer}>
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          {/* Room info & Ambient Temp */}
          <View style={styles.headerLeft}>
            <Text style={styles.roomLabel}>
              {(currentAppliance?.room || currentAppliance?.name || 'Ar Condicionado').toUpperCase()}
            </Text>
            <View style={styles.ambientBadge}>
              <Text style={styles.ambientLabel}>AMBIENTE</Text>
              <Text style={styles.ambientText}>{ambientTemp}</Text>
            </View>
          </View>

          {/* Action buttons (Settings & Power) */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.squareIconBtn}
              onPress={() => setShowSettingsModal(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="cog-outline" size={20} color="#ffffff" />
            </TouchableOpacity>

            {/* Power Button: White with Black Icon when ON */}
            <TouchableOpacity
              style={[styles.powerBtn, isPowerOn && styles.powerBtnActive]}
              onPress={togglePower}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name="power"
                size={22}
                color={isPowerOn ? '#000000' : '#666666'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Device Switcher Bar */}
        <TouchableOpacity
          style={styles.deviceBar}
          onPress={() => setShowDeviceModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.deviceBarLeft}>
            <MaterialCommunityIcons name="air-conditioner" size={16} color="#888888" />
            <Text style={styles.deviceBarText} numberOfLines={1}>
              {(currentAppliance?.name || 'Ar Condicionado').toUpperCase()}
            </Text>
          </View>
          <View style={styles.deviceBarRight}>
            <Text style={styles.deviceBarAction}>TROCAR</Text>
          </View>
        </TouchableOpacity>

        {/* Top Controls Row: [ MODO ] [ VENTILAÇÃO ] */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBox, !isPowerOn && styles.controlBoxDisabled]}
            onPress={() => isPowerOn && setShowModeModal(true)}
            disabled={!isPowerOn}
            activeOpacity={0.7}
          >
            <Text style={styles.controlBoxSub}>MODO</Text>
            <View style={styles.controlBoxInner}>
              <MaterialCommunityIcons
                name={MODE_ICONS[workMode] || 'snowflake'}
                size={16}
                color="#ffffff"
              />
              <Text style={styles.controlBoxValue}>
                {(MODE_NAMES[workMode] || 'Cool').toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlBox,
              (!isPowerOn || workMode === '3') && styles.controlBoxDisabled,
            ]}
            onPress={() => isPowerOn && workMode !== '3' && setShowFanModal(true)}
            disabled={!isPowerOn || workMode === '3'}
            activeOpacity={0.7}
          >
            <Text style={styles.controlBoxSub}>VENTILAÇÃO</Text>
            <View style={styles.controlBoxInner}>
              <MaterialCommunityIcons name="fan" size={16} color="#ffffff" />
              <Text style={styles.controlBoxValue}>{fanLabel.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Architectural Split AC Vector Graphic */}
        <AcUnit isPowerOn={isPowerOn} targetTemp={targetTemp} />

        {/* DYNAMIC CENTER CONTROL PANEL */}
        <View style={styles.centerPanel}>
          {!isPowerOn ? (
            <View style={styles.stateNotice}>
              <Text style={styles.stateNoticeTitle}>DESLIGADO</Text>
              <Text style={styles.stateNoticeSub}>
                Toque no botão de energia para ligar o aparelho
              </Text>
            </View>
          ) : workMode === '3' ? (
            <View style={styles.stateNotice}>
              <Text style={styles.stateNoticeTitle}>DESUMIDIFICAÇÃO</Text>
              <Text style={styles.stateNoticeSub}>
                Velocidade e temperatura ajustadas automaticamente
              </Text>
            </View>
          ) : workMode === '0' ? (
            <View style={styles.stateNotice}>
              <Text style={styles.stateNoticeTitle}>VENTILAÇÃO</Text>
              <Text style={styles.stateNoticeSub}>
                Apenas circulação de ar com velocidade {fanLabel.toUpperCase()}
              </Text>
            </View>
          ) : workMode === '4' ? (
            <View style={styles.stateNotice}>
              <Text style={styles.stateNoticeTitle}>MODO AUTOMÁTICO</Text>
              <Text style={styles.stateNoticeSub}>
                Temperatura ajustada automaticamente por sensores
              </Text>
            </View>
          ) : (
            /* COOL & HEAT: Straight Precision Temperature Slider */
            <CapsuleSlider
              temperature={targetTemp}
              onTempChange={setTargetTemp}
              isPowerOn={isPowerOn}
            />
          )}
        </View>

        {/* BOTTOM ACTION PRESETS TILES (Straight Borders, White when Active) */}
        {isPowerOn && (
          <View style={styles.presetsSection}>
            <Text style={styles.presetsSectionTitle}>FUNÇÕES</Text>
            <View style={styles.tilesContainer}>
              {/* Swing Tile */}
              <TouchableOpacity
                style={[styles.tileCard, isSwing && styles.tileCardActive]}
                onPress={toggleSwing}
                activeOpacity={0.7}
              >
                <View style={styles.tileHeader}>
                  <MaterialCommunityIcons
                    name="swap-vertical"
                    size={20}
                    color={isSwing ? '#000000' : '#888888'}
                  />
                  <Text style={[styles.tileIndex, isSwing && styles.tileIndexActive]}>01</Text>
                </View>
                <Text style={[styles.tileLabel, isSwing && styles.tileLabelActive]}>
                  SWING{'\n'}
                  <Text style={[styles.tileSub, isSwing && styles.tileSubActive]}>
                    {isSwing ? 'ON' : 'OFF'}
                  </Text>
                </Text>
              </TouchableOpacity>

              {/* Fast Cooling / Turbo (Cool & Heat modes) */}
              {(workMode === '2' || workMode === '1') && (
                <TouchableOpacity
                  style={[styles.tileCard, isFastCooling && styles.tileCardActive]}
                  onPress={toggleFastCooling}
                  activeOpacity={0.7}
                >
                  <View style={styles.tileHeader}>
                    <MaterialCommunityIcons
                      name="lightning-bolt"
                      size={20}
                      color={isFastCooling ? '#000000' : '#888888'}
                    />
                    <Text style={[styles.tileIndex, isFastCooling && styles.tileIndexActive]}>02</Text>
                  </View>
                  <Text style={[styles.tileLabel, isFastCooling && styles.tileLabelActive]}>
                    TURBO{'\n'}
                    <Text style={[styles.tileSub, isFastCooling && styles.tileSubActive]}>
                      {isFastCooling ? 'ON' : 'OFF'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              )}

              {/* Quiet Mode (Cool, Heat, Fan modes) */}
              {(workMode === '2' || workMode === '1' || workMode === '0') && (
                <TouchableOpacity
                  style={[styles.tileCard, isMute && styles.tileCardActive]}
                  onPress={toggleQuiet}
                  activeOpacity={0.7}
                >
                  <View style={styles.tileHeader}>
                    <MaterialCommunityIcons
                      name="volume-mute"
                      size={20}
                      color={isMute ? '#000000' : '#888888'}
                    />
                    <Text style={[styles.tileIndex, isMute && styles.tileIndexActive]}>03</Text>
                  </View>
                  <Text style={[styles.tileLabel, isMute && styles.tileLabelActive]}>
                    SILÊNCIO{'\n'}
                    <Text style={[styles.tileSub, isMute && styles.tileSubActive]}>
                      {isMute ? 'ON' : 'OFF'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              )}

              {/* Sleep Mode (Cool, Heat, Dry modes) */}
              {(workMode === '2' || workMode === '1' || workMode === '3') && (
                <TouchableOpacity
                  style={[styles.tileCard, isSleep && styles.tileCardActive]}
                  onPress={toggleSleep}
                  activeOpacity={0.7}
                >
                  <View style={styles.tileHeader}>
                    <MaterialCommunityIcons
                      name="moon-waning-crescent"
                      size={20}
                      color={isSleep ? '#000000' : '#888888'}
                    />
                    <Text style={[styles.tileIndex, isSleep && styles.tileIndexActive]}>04</Text>
                  </View>
                  <Text style={[styles.tileLabel, isSleep && styles.tileLabelActive]}>
                    SLEEP{'\n'}
                    <Text style={[styles.tileSub, isSleep && styles.tileSubActive]}>
                      {isSleep ? 'ON' : 'OFF'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              )}

              {/* Energy Saving / Eco (Cool, Heat, Auto modes) */}
              {(workMode === '2' || workMode === '1' || workMode === '4') && (
                <TouchableOpacity
                  style={[styles.tileCard, isEco && styles.tileCardActive]}
                  onPress={toggleEco}
                  activeOpacity={0.7}
                >
                  <View style={styles.tileHeader}>
                    <MaterialCommunityIcons
                      name="leaf"
                      size={20}
                      color={isEco ? '#000000' : '#888888'}
                    />
                    <Text style={[styles.tileIndex, isEco && styles.tileIndexActive]}>05</Text>
                  </View>
                  <Text style={[styles.tileLabel, isEco && styles.tileLabelActive]}>
                    ECO{'\n'}
                    <Text style={[styles.tileSub, isEco && styles.tileSubActive]}>
                      {isEco ? 'ON' : 'OFF'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* MODALS */}
      <ModeModal
        visible={showModeModal}
        currentMode={workMode}
        onSelect={setMode}
        onClose={() => setShowModeModal(false)}
      />

      <FanModal
        visible={showFanModal}
        currentSpeed={curFan}
        isMute={isMute}
        onSelect={setFanSpeed}
        onClose={() => setShowFanModal(false)}
      />

      <DeviceModal
        visible={showDeviceModal}
        appliances={appliances}
        currentPuid={currentAppliance?.puid}
        onSelect={setCurrentAppliance}
        onClose={() => setShowDeviceModal(false)}
      />

      <SettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onServerSaved={() => bootstrap()}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 4 : 8,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: Platform.OS === 'android' ? 24 : 28,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogoBox: {
    width: 68,
    height: 68,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  splashLogoLetter: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-CondensedBold' : 'sans-serif-black',
    includeFontPadding: false,
    textAlign: 'center',
    lineHeight: 46,
  },
  brandLogoBox: {
    width: 44,
    height: 44,
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandLogoLetter: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-CondensedBold' : 'sans-serif-black',
    includeFontPadding: false,
    textAlign: 'center',
    lineHeight: 30,
  },
  splashTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 14,
  },
  toast: {
    position: 'absolute',
    top: 50,
    zIndex: 999,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  toastText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1c',
  },
  headerLeft: {
    flex: 1,
  },
  systemTag: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  roomLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ambientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  ambientLabel: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  ambientText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  squareIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerBtn: {
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerBtnActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  deviceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 0,
    marginBottom: 8,
  },
  deviceBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  deviceBarIndex: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '700',
  },
  deviceBarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deviceBarRight: {
    paddingLeft: 8,
  },
  deviceBarAction: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 6,
  },
  controlBox: {
    flex: 1,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  controlBoxDisabled: {
    opacity: 0.35,
  },
  controlBoxSub: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  controlBoxInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlBoxValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerPanel: {
    width: '100%',
    minHeight: 120,
    justifyContent: 'center',
    marginVertical: 4,
  },
  stateNotice: {
    backgroundColor: '#111111',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#222222',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  stateNoticeTag: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  stateNoticeTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stateNoticeSub: {
    color: '#777777',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  presetsSection: {
    width: '100%',
    marginTop: 10,
    marginBottom: 4,
  },
  presetsSectionTitle: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    justifyContent: 'space-between',
  },
  tileCard: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minHeight: 74,
    justifyContent: 'space-between',
  },
  tileCardActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileIndex: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
  },
  tileIndexActive: {
    color: '#000000',
  },
  tileLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  tileLabelActive: {
    color: '#000000',
  },
  tileSub: {
    fontSize: 9,
    color: '#777777',
    fontWeight: '600',
  },
  tileSubActive: {
    color: '#333333',
  },

  // ----------------------------------------------------
  // Login Styles (MIMO Style)
  // ----------------------------------------------------
  loginSafeArea: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 4 : 8,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loginAnimatedWrapper: {
    width: '100%',
  },
  loginHeader: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  loginHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  brandLogoBoxCompact: {
    width: 32,
    height: 32,
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoLetterCompact: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-CondensedBold' : 'sans-serif-black',
    includeFontPadding: false,
    textAlign: 'center',
    lineHeight: 22,
  },
  loginTitleCompact: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandTagBox: {
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
    marginBottom: 12,
    backgroundColor: '#111111',
  },
  brandTagText: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  loginTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loginSubtitle: {
    color: '#666666',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  loginCard: {
    backgroundColor: '#0d0d0d',
    borderRadius: 0,
    padding: 18,
    borderWidth: 1,
    borderColor: '#262626',
  },
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 0,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  cloudBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  fieldLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#141414',
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  fieldInputMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputHelp: {
    color: '#555555',
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#170c0c',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 0,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  loginBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 0,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  loginBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});

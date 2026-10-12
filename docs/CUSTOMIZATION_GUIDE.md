# Guia de Customização / Customization Guide
## Como Criar o Seu Próprio App com a Aparência que Você Quiser
### How to Build Your Own AC App with Any Look & Feel

Este guia ensina, passo a passo, como qualquer pessoa pode personalizar e recriar a interface deste aplicativo para deixá-lo com o visual, cores e estilo que desejar (Minimalista, Dark OLED, Neumorfismo, Cyberpunk, Tema Claro, etc.).

---

## 1. Visão Geral da Arquitetura

O aplicativo foi desenhado de forma **100% modular e serverless (direto na nuvem)**:

```
┌────────────────────────────────────────────────────────┐
│                      INTERFACE                         │
│   App.js (Dashboard principal / Tela de Login)          │
│   ├── AcUnit.js (Ilustração vetorial do Split)         │
│   ├── CapsuleSlider.js (Slider tátil de temperatura)    │
│   ├── ModeModal.js (Seleção de modo)                   │
│   └── FanModal.js (Seleção de ventilação)              │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   MOTOR DE CONTROLE                    │
│   src/api.js (Autenticação direta ConnectLife Cloud)    │
│   - Feedback instantâneo (0ms)                         │
│   - Rollback automático se o comando falhar            │
│   - Polling de telemetria a cada 15 segundos           │
└────────────────────────────────────────────────────────┘
```

> **Vantagem**: Você não precisa mexer na lógica de rede ou de comunicação com a nuvem (`src/api.js`). Basta alterar os arquivos de interface para transformar completamente o visual do seu app!

---

## 2. Como Mudar o Tema e as Cores

Todas as cores e estilos do app usam `StyleSheet` padrão do React Native.

### Paleta de Cores Atual (Minimalista MiMo Dark)
- Fundo: `#000000`
- Superfícies / Cards: `#111111`
- Bordas: `#222222`
- Texto Primário / Acentos: `#ffffff`
- Texto Secundário: `#666666` e `#888888`

### Exemplo 1: Criando um Tema Claro (Light Minimal)
No arquivo `App.js`, você pode alterar os estilos do objeto `styles`:

```javascript
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc', // Fundo claro suave
  },
  tileCard: {
    backgroundColor: '#ffffff', // Cards brancos
    borderColor: '#e2e8f0',     // Bordas sutis
    // ...
  },
  tileCardActive: {
    backgroundColor: '#0284c7', // Azul destaque quando ativo
    borderColor: '#0284c7',
  },
  tileLabel: {
    color: '#0f172a',
    // ...
  },
  tileLabelActive: {
    color: '#ffffff',
  },
});
```

---

## 3. Customizando o Split AC (`src/components/AcUnit.js`)

O componente `AcUnit.js` renderiza o ar-condicionado na tela:

- **Bordas Arredondadas**:
  Se quiser que o chassi pareça mais arredondado, mude `borderRadius`:
  ```javascript
  acChassis: {
    width: 300,
    height: 76,
    borderRadius: 16, // De 0 para cantos arredondados
    backgroundColor: '#1e293b',
  }
  ```

- **Animação das Ondas de Ar**:
  As ondas de ar quando o aparelho está ligado são controladas por `waveAnim1` e `waveAnim2`. Você pode alterar a cor das ondas:
  ```javascript
  airWave: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)', // Azul ciano luminoso
  }
  ```

- **Substituir por uma Imagem ou Modelo 3D**:
  Você pode simplesmente trocar os elementos `<View>` por um `<Image>` com uma renderização do seu modelo específico de ar-condicionado:
  ```jsx
  <Image
    source={require('../../assets/my-ac-model.png')}
    style={{ width: 320, height: 100, resizeMode: 'contain' }}
  />
  ```

---

## 4. Customizando o Slider de Temperatura (`src/components/CapsuleSlider.js`)

O slider é sensível ao toque contínuo com feedback háptico (vibração):

- **Tamanho dos Dígitos de Temperatura**:
  No `styles.tempDigits`:
  ```javascript
  tempDigits: {
    fontSize: 72, // Aumente ou diminua conforme seu gosto
    color: '#ffffff',
  }
  ```

- **Formato da Barra (Pill ou Retangular)**:
  Para deixar a barra arredondada no formato de pílula:
  ```javascript
  track: {
    height: 52,
    borderRadius: 26, // Metade da altura = bordas em pílula perfeita
    overflow: 'hidden',
  },
  thumb: {
    borderRadius: 25, // Thumb circular
  }
  ```

- **Cor do Preenchimento**:
  Altere a cor de `styles.fill` para qualquer gradiente ou cor de destaque (ex: `#3b82f6` para azul ou `#10b981` para verde).

---

## 5. Adicionando ou Removendo Funções (`App.js`)

O bloco de funções renderiza os botões dinamicamente conforme os recursos do seu modelo:
- `isSwing` (`toggleSwing`)
- `isFastCooling` (`toggleFastCooling`)
- `isMute` (`toggleQuiet`)
- `isSleep` (`toggleSleep`)
- `isEco` (`toggleEco`)

Se você quiser criar um novo botão personalizado, basta adicionar um card no `tilesContainer`:

```jsx
<TouchableOpacity
  style={[styles.tileCard, meuEstado && styles.tileCardActive]}
  onPress={minhaFuncao}
  activeOpacity={0.7}
>
  <View style={styles.tileHeader}>
    <MaterialCommunityIcons name="star-outline" size={20} color="#888888" />
    <Text style={styles.tileIndex}>06</Text>
  </View>
  <Text style={styles.tileLabel}>
    MEU MODO{'\n'}
    <Text style={styles.tileSub}>{meuEstado ? 'ON' : 'OFF'}</Text>
  </Text>
</TouchableOpacity>
```

---

## 6. Mudando o Ícone e o Nome do Aplicativo

1. **Nome do Aplicativo**:
   Edite `app.json`:
   ```json
   {
     "expo": {
       "name": "Meu Controle AC",
       "slug": "meu-ac-controller"
     }
   }
   ```
2. **Ícones do Aplicativo**:
   Substitua os arquivos na pasta `assets/`:
   - `assets/icon.png`: Ícone padrão quadrado (1024x1024 PNG).
   - `assets/android-icon-foreground.png`: Ícone frontal adaptativo do Android (fundo transparente, 432x432 ou 1024x1024).
   - `assets/android-icon-monochrome.png`: Ícone para temas monocromáticos do Android 13+.

---

## 7. Como Compilar a Sua Versão Customizada

Consulte o documento completo [`docs/BUILD_GUIDE.md`](./BUILD_GUIDE.md) para ver como testar no celular e gerar o arquivo APK final com o comando:

```bash
cd android && ./gradlew assembleRelease
```

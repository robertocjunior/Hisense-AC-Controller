# Guia de Compilação e Build / Build Guide
## Como Compilar o Hisense AC Controller
### How to Build the Hisense AC Controller from Source

Este guia explica como configurar o ambiente e compilar o seu próprio APK do zero.

---

## 1. Pré-Requisitos

Para compilar o aplicativo no seu computador (Linux, macOS ou Windows via WSL2):

1. **Node.js**: Versão 18 ou superior (`node -v`)
2. **Java Development Kit (JDK)**: Versão 17 (`java -version`)
3. **Android SDK**: `cmdline-tools`, `platform-tools` e `platforms;android-34` instalados.
   - Variável de ambiente configurada:
     ```bash
     export ANDROID_HOME=$HOME/android-sdk # ou o caminho do seu SDK
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```

---

## 2. Instalação das Dependências

Clone este repositório e instale as dependências JavaScript/React Native:

```bash
git clone https://github.com/robertocjunior/Hisense-AC-Controller.git
cd Hisense-AC-Controller
npm install
```

---

## 3. Executando em Modo Desenvolvimento

Se você quiser testar modificações no código com **Hot Reload** em tempo real no seu celular ou emulador:

```bash
npx expo start
```

Pressione `a` para abrir no emulador Android conectado ou escaneie o QR Code pelo aplicativo **Expo Go**.

---

## 4. Compilando o APK de Produção (Release)

O projeto já inclui toda a estrutura nativa Android configurada no diretório `android/`. Você pode compilar um APK standalone (que pode ser instalado diretamente em qualquer celular Android sem necessidade de Expo Go ou computador) com um único comando:

```bash
cd android
./gradlew assembleRelease --no-daemon
```

> **Dica**: No Windows PowerShell, use `.\gradlew assembleRelease --no-daemon`.

### Onde encontrar o arquivo APK gerado:
Após o término do comando com `BUILD SUCCESSFUL`, o APK compilado estará em:
```
android/app/build/outputs/apk/release/app-release.apk
```

Basta renomear este arquivo para `Hisense-AC-Controller.apk` e transferi-lo para o seu celular Android!

---

## 5. Instalando no Celular via ADB (Opcional)

Se o seu smartphone Android estiver conectado via USB com a Depuração USB ativada:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

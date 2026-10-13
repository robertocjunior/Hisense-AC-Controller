# Hisense AC Controller ❄️📱

[![GitHub Release](https://img.shields.io/github/v/release/robertocjunior/Hisense-AC-Controller?style=for-the-badge&color=blue)](https://github.com/robertocjunior/Hisense-AC-Controller/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-white?style=for-the-badge)](./LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Android-green?style=for-the-badge&logo=android)](https://github.com/robertocjunior/Hisense-AC-Controller/releases)
[![React Native](https://img.shields.io/badge/Framework-React%20Native%20%2F%20Expo-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev/)

> **Aplicativo Android moderno, independente e de comunicação direta na nuvem para controle de aparelhos de ar-condicionado Hisense / ConnectLife.**

---

## ⚠️ AVISO LEGAL E ISENÇÃO DE RESPONSABILIDADE / LEGAL DISCLAIMER

> [!IMPORTANT]
> **PROJETO COMUNITÁRIO INDEPENDENTE (OPEN SOURCE)**
> 
> 1. Este projeto é uma iniciativa comunitária de código aberto e **NÃO** possui qualquer vínculo, afiliação, autorização, patrocínio ou endosso da **Hisense Co., Ltd.**, **ConnectLife** ou de qualquer uma de suas subsidiárias.
> 2. Os termos **"Hisense"**, **"ConnectLife"**, bem como eventuais marcas registradas, nomes de produtos e logotipos mencionados pertencem exclusivamente aos seus respectivos titulares de direitos. O uso destes nomes neste repositório destina-se unicamente à **identificação de compatibilidade e finalidades de interoperabilidade técnica**.
> 3. Este software foi desenvolvido de forma independente através de análise de interoperabilidade de comunicações de rede públicas (amparado pelo Art. 6º, § 1º da Lei Federal Brasileira nº 9.609/1998 e Seção 1201(f) do DMCA norte-americano), sem distribuição de firmware proprietário ou código protegido de terceiros.
> 4. O software é fornecido "no estado em que se encontra" (*AS IS*), sem garantias de qualquer natureza. O usuário utiliza com suas próprias credenciais sob sua própria responsabilidade.

---

## 📥 Download do Aplicativo (APK)

Você pode baixar diretamente a versão compilada e pronta para instalar no seu celular Android:

➡️ **[Baixar Hisense-AC-Controller.apk (Versão 1.0.1)](https://github.com/robertocjunior/Hisense-AC-Controller/releases/download/v1.0.1/Hisense-AC-Controller.apk)**

*(Ou acesse a aba [Releases](https://github.com/robertocjunior/Hisense-AC-Controller/releases) para ver todas as versões).*

---

## ✨ Destaques e Funcionalidades

- **Nenhum Servidor Local Necessário (100% Serverless)**:
  O aplicativo conecta-se diretamente à API em nuvem da ConnectLife via HTTPS seguro. Não há necessidade de intermediários locais, Docker, Home Assistant ou computadores ligados na sua casa.
- **Feedback Tátil Instantâneo (0ms)**:
  Respostas de interface imediatas com vibração háptica (*Haptic Feedback*) ao deslizar ou tocar, com rollback automático caso o comando seja rejeitado pelo aparelho.
- **Leitura em Tempo Real da Temperatura Ambiente**:
  Exibe a temperatura ambiente capturada pelo sensor interno da evaporadora (`f_temp_in`), além da temperatura alvo definida.
- **Interface Minimalista Xiaomi MiMo**:
  Design elegante de alto contraste preto e branco, com tipografia tabular nítida, linhas retas limpas e layout de tela única 100% fixo (sem rolagem ou distrações).
- **Controle Completo dos Recursos**:
  - Liga / Desliga
  - Slider contínuo de temperatura (16°C a 30°C)
  - Modos de operação: Frio (*Cool*), Quente (*Heat*), Desumidificação (*Dry*), Ventilação (*Fan*) e Automático (*Auto*)
  - Velocidade da ventilação: Auto, Baixa, Média, Alta
  - Funções rápidas: Swing vertical, Turbo, Silêncio, Modo Noturno (*Sleep*) e Economia (*Eco*)
  - Seleção e alternância rápida entre múltiplos aparelhos cadastrados na sua conta
- **Ícone Adaptativo Moderno (Android 13+)**:
  Ícone temático com logotipo geométrico "H" em fundo preto com suporte nativo aos temas monocromáticos do Android.

---

## 🛠️ Como Criar o Seu Próprio App Customizado

Criamos manuais detalhados para quem deseja personalizar ou criar seu próprio visual:

1. 🎨 **[Guia Completo de Customização](./docs/CUSTOMIZATION_GUIDE.md)**:
   Aprenda a mudar cores, criar temas claros/escuros, personalizar o desenho do ar-condicionado, mudar os sliders e adicionar novos botões.
2. 🔌 **[Especificação da API ConnectLife Cloud](./docs/API_SPECIFICATION.md)**:
   Tabela completa de propriedades de telemetria (`t_temp`, `f_temp_in`, `t_power`, etc.) e endpoints REST.
3. 🔨 **[Guia de Compilação do Código Fonte (Build Guide)](./docs/BUILD_GUIDE.md)**:
   Como rodar o projeto localmente com Node.js/Expo e gerar seus próprios APKs com Gradle.

---

## 🚀 Instalação Rápida a partir do Código

Se preferir compilar o código você mesmo:

```bash
# 1. Clonar o repositório
git clone https://github.com/robertocjunior/Hisense-AC-Controller.git
cd Hisense-AC-Controller

# 2. Instalar dependências
npm install

# 3. Rodar em desenvolvimento
npx expo start

# 4. Ou gerar o APK de Release
cd android && ./gradlew assembleRelease
```

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [`LICENSE`](./LICENSE) para obter mais informações sobre termos e isenções legais.

# Especificação da API ConnectLife Cloud
## ConnectLife Cloud Reverse-Engineered API Specification

Este documento documenta os endpoints, fluxos de autenticação e formato das propriedades de telemetria dos aparelhos Hisense / ConnectLife, obtidos através de análise de interoperabilidade.

---

## 1. Endpoints Base e Headers Padrão

- **Servidor Global / EU / BR**: `https://api.connectlife.io` ou `https://api.connectlife-appliances.com`
- **Porta**: `443` (HTTPS com TLS 1.2+)

### Headers Comuns Obrigatórios
```http
Content-Type: application/json
Accept: application/json
appId: connectlife
login-source: android
os-type: android
software-version: 2.1.0
client-type: mobile
```

---

## 2. Autenticação (`POST /api/v1/user/login`)

### Requisição
```http
POST /api/v1/user/login HTTP/1.1
Host: api.connectlife.io
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "SenhaDoUsuario",
  "loginType": "normal"
}
```

### Resposta de Sucesso
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "d7a8e...",
    "userId": "12345678",
    "expireTime": 86400
  }
}
```

> **Autenticação em Requisições Subsequentes**:
> Adicione o header: `Authorization: Bearer <token>` em todas as requisições autenticadas.

---

## 3. Descoberta de Aparelhos (`GET /api/v1/appliance/list`)

### Requisição
```http
GET /api/v1/appliance/list HTTP/1.1
Host: api.connectlife.io
Authorization: Bearer <token>
```

### Resposta
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "puid": "A1B2C3D4E5F67890",
      "deviceId": "00000000-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "name": "Ar Condicionado Quarto",
      "room": "Quarto",
      "online": true,
      "deviceType": "009",
      "properties": {
        "t_power": "1",
        "t_work_mode": "2",
        "t_temp": "24",
        "f_temp_in": "25",
        "t_fan_speed": "0",
        "t_up_down_swing": "1",
        "t_eco": "0",
        "t_sleep": "0",
        "t_mute": "0",
        "t_turbo": "0"
      }
    }
  ]
}
```

---

## 4. Dicionário de Propriedades de Ar-Condicionado (Split)

| Propriedade | Tipo | Valores Permitidos | Descrição |
| :--- | :--- | :--- | :--- |
| `t_power` | String | `"0"`, `"1"` | Estado de energia: `"0"` = Desligado, `"1"` = Ligado |
| `t_temp` | String | `"16"` a `"30"` | Temperatura alvo em Celsius |
| `f_temp_in` | String | Ex: `"23"`, `"24.5"` | Sensor de temperatura ambiente interno |
| `t_work_mode` | String | `"2"`, `"1"`, `"3"`, `"0"`, `"4"` | Modo: `"2"` = Cool (Frio), `"1"` = Heat (Quente), `"3"` = Dry (Desumidificar), `"0"` = Fan (Ventilação), `"4"` = Auto |
| `t_fan_speed` | String | `"0"`, `"1"`, `"2"`, `"3"` | Velocidade: `"0"` = Auto, `"1"` = Baixa, `"2"` = Média, `"3"` = Alta |
| `t_up_down_swing` | String | `"0"`, `"1"` | Oscilação vertical das aletas (Swing) |
| `t_eco` | String | `"0"`, `"1"` | Modo economia de energia |
| `t_turbo` | String | `"0"`, `"1"` | Modo turbo / resfriamento rápido |
| `t_mute` | String | `"0"`, `"1"` | Modo silencioso |
| `t_sleep` | String | `"0"`, `"1"` | Modo noturno |

---

## 5. Envio de Comandos (`POST /api/v1/appliance/control`)

### Requisição
```http
POST /api/v1/appliance/control HTTP/1.1
Host: api.connectlife.io
Authorization: Bearer <token>
Content-Type: application/json

{
  "puid": "A1B2C3D4E5F67890",
  "properties": {
    "t_temp": "22",
    "t_work_mode": "2"
  }
}
```

### Resposta
```json
{
  "code": 0,
  "msg": "success"
}
```

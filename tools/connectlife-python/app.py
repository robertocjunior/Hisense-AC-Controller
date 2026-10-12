import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from connectlife.api import (
    ConnectLifeApi,
    LifeConnectAuthError,
    LifeConnectTermsNotAcceptedError,
    LifeConnectError,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hisense-ac-controller")

app = FastAPI(title="Hisense AC Controller", version="1.0.0")

SESSION_FILE = Path("/app/session.json")

# In-memory storage for active ConnectLife API instance
current_api: Optional[ConnectLifeApi] = None
saved_credentials: Optional[Dict[str, str]] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class ControlRequest(BaseModel):
    puid: str
    properties: Dict[str, str]


def format_appliance(a) -> Dict[str, Any]:
    return {
        "puid": a.puid,
        "deviceId": a.device_id,
        "name": a.device_nickname or "Ar Condicionado",
        "room": a.room_name or "Geral",
        "type": str(a.device_type),
        "typeCode": a.device_type_code,
        "status": a.status_list,
    }


async def get_or_restore_api() -> Optional[ConnectLifeApi]:
    global current_api, saved_credentials
    if current_api is not None:
        return current_api

    if SESSION_FILE.exists():
        try:
            data = json.loads(SESSION_FILE.read_text())
            api = ConnectLifeApi(data["username"], data["password"])
            await api.login()
            current_api = api
            saved_credentials = data
            logger.info("Sessão ConnectLife restaurada com sucesso do arquivo.")
            return current_api
        except Exception as e:
            logger.warning("Falha ao restaurar sessão anterior: %s", e)
    return None


@app.post("/api/login")
async def login(req: LoginRequest):
    global current_api, saved_credentials
    try:
        api = ConnectLifeApi(req.username, req.password)
        await api.login()
        appliances = await api.get_appliances()
        current_api = api
        saved_credentials = {"username": req.username, "password": req.password}
        try:
            SESSION_FILE.write_text(json.dumps(saved_credentials))
        except Exception as e:
            logger.warning("Não foi possível salvar session.json: %s", e)
        
        return {
            "status": "ok",
            "message": "Autenticado com sucesso!",
            "appliances": [format_appliance(a) for a in appliances],
        }
    except LifeConnectTermsNotAcceptedError:
        raise HTTPException(
            status_code=403,
            detail="É necessário abrir o aplicativo ConnectLife e aceitar os Termos de Serviço atualizados antes de continuar.",
        )
    except LifeConnectAuthError as e:
        raise HTTPException(status_code=401, detail=f"Erro de autenticação: {str(e)}")
    except Exception as e:
        logger.exception("Erro ao autenticar")
        raise HTTPException(status_code=500, detail=f"Falha ao conectar: {str(e)}")


@app.get("/api/appliances")
async def get_appliances():
    api = await get_or_restore_api()
    if not api:
        raise HTTPException(status_code=401, detail="Não autenticado. Faça login primeiro.")
    try:
        appliances = await api.get_appliances()
        return {
            "status": "ok",
            "appliances": [format_appliance(a) for a in appliances],
        }
    except LifeConnectAuthError:
        global current_api
        current_api = None
        raise HTTPException(status_code=401, detail="Sessão expirada. Faça login novamente.")
    except Exception as e:
        logger.exception("Erro ao buscar aparelhos")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/control")
async def control_appliance(req: ControlRequest):
    api = await get_or_restore_api()
    if not api:
        raise HTTPException(status_code=401, detail="Não autenticado. Faça login primeiro.")
    try:
        logger.info("Enviando propriedades para %s: %s", req.puid, req.properties)
        await api.update_appliance(req.puid, req.properties)
        # Brief wait for device gateway acknowledgment
        await asyncio.sleep(0.3)
        appliances = await api.get_appliances()
        return {
            "status": "ok",
            "message": "Comando enviado com sucesso!",
            "appliances": [format_appliance(a) for a in appliances],
        }
    except Exception as e:
        logger.exception("Erro ao enviar comando")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/logout")
async def logout():
    global current_api, saved_credentials
    current_api = None
    saved_credentials = None
    if SESSION_FILE.exists():
        try:
            SESSION_FILE.unlink()
        except Exception:
            pass
    return {"status": "ok", "message": "Desconectado."}


# Serve SPA frontend
@app.get("/")
async def root():
    return FileResponse("/app/static/index.html")


app.mount("/static", StaticFiles(directory="/app/static"), name="static")

@echo off
cd /d "%~dp0python_backend"
python -m venv .venv
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python run.py

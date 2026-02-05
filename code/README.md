# PixelProof – AI Deepfake Detection Prototype

## Overview
PixelProof is an AI-powered deepfake detection system that allows users to upload
images and receive real-time authenticity analysis using deep learning.

## Tech Stack
- Frontend: React (Vite, TypeScript)
- Backend: FastAPI (Python)
- AI Model: TensorFlow (MobileNetV2)
- Computer Vision: OpenCV

## How to Run Backend
cd code/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py

Backend runs at: http://127.0.0.1:8000/docs

## How to Run Frontend
cd code/frontend
npm install
npm run dev

Frontend runs at: http://localhost:5173

## API
POST /analyze
- Input: Image file
- Output: Fake / Real classification

## Model
The deepfake detection model is trained using transfer learning with MobileNetV2
and saved as an `.h5` file for inference.

## Prototype Status
End-to-end pipeline is functional:
Frontend → Backend API → AI Model → Result



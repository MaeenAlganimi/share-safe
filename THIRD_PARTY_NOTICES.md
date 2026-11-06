# Third-party runtime assets

- Tesseract.js worker and Tesseract.js Core are distributed under Apache License 2.0. Source: https://github.com/naptha/tesseract.js and https://github.com/naptha/tesseract.js-core
- English `eng.traineddata` is from `tessdata_fast`, distributed under Apache License 2.0. Source: https://github.com/tesseract-ocr/tessdata_fast
- `@mediapipe/tasks-vision` runtime/WASM is distributed under Apache License 2.0. Source: https://github.com/google-ai-edge/mediapipe
- `face_detector.tflite` is the MediaPipe BlazeFace Short Range model from the MediaPipe model collection. Source: https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite

These assets are included so the browser can run inference without contacting third-party hosts. Review upstream license notices when updating assets.

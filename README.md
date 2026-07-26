# Receipt Maker

Web app to upload or paste a receipt photo, extract text / colors / approximate fonts into editable layers, edit the receipt, export PNG, and save reusable templates.

## Run

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Use

1. **Upload** or **paste** (⌘/Ctrl+V) a receipt image
2. Click **Analyze text** to run OCR and create editable text layers
3. Click any line to change content, font, size, color, or template role
4. Toggle **Hide original text** to cover the printed text under editable layers
5. **Export PNG** or **Save template** for reuse
6. Open a template from the left panel (starter blank receipt included)

## Stack

Vite · React · TypeScript · Fabric.js · Tesseract.js · localStorage templates

# CodeGen 6B Model

Placeholder directory for the CodeGen 6B local model files.

## Setup

Download the model weights from Hugging Face:

```bash
pip install huggingface_hub
python -c "from huggingface_hub import snapshot_download; snapshot_download('Salesforce/codegen-6B-mono', local_dir='.')"
```

## Configuration

```typescript
import { LocalModelProvider } from '../../src/providers/localModel.provider';

const provider = new LocalModelProvider({
  modelPath: './models/codegen-6b',
  modelName: 'codegen-6b',
  contextLength: 2048,
  device: 'cuda',
  quantization: '4bit',
});
```

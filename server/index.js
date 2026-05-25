import 'dotenv/config';
import express from 'express';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true
  }
});

const port = Number(process.env.PORT || 10000);
const docPassword = process.env.DOC_PASSWORD || '20324';
const firestoreDatabaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
const documentRef = initFirestore().collection('document').doc('sharedDoc');

const defaultDoc = {
  slides: [
    {
      id: 'slide-1',
      content: '<h2>공용 문서</h2><p>비밀번호 인증 후 함께 내용을 수정할 수 있습니다.</p>'
    }
  ],
  updatedAt: new Date().toISOString()
};

let sharedDoc;
try {
  sharedDoc = await readDocument();
} catch (error) {
  console.error('Firestore 연결에 실패했습니다.');
  console.error('Firebase Console에서 Firestore Database를 먼저 생성했는지 확인하세요.');
  console.error(error.message);
  process.exit(1);
}
const editorTokens = new Set();

app.use(express.json({ limit: '2mb' }));
app.use(express.static(distDir));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, storage: 'firebase-firestore' });
});

app.get('/api/document', (_request, response) => {
  response.json(sharedDoc);
});

app.post('/api/auth', (request, response) => {
  const password = String(request.body?.password ?? '');

  if (password !== docPassword) {
    response.status(401).json({ ok: false, message: '비밀번호가 틀렸습니다.' });
    return;
  }

  const token = randomUUID();
  editorTokens.add(token);
  response.json({ ok: true, token });
});

app.get('*', (_request, response) => {
  response.sendFile(path.join(distDir, 'index.html'));
});

io.on('connection', (socket) => {
  socket.emit('document:sync', sharedDoc);

  socket.on('document:save', async ({ token, slides } = {}, ack) => {
    if (!editorTokens.has(token)) {
      ack?.({ ok: false, message: '편집 권한이 없습니다.' });
      return;
    }

    if (!Array.isArray(slides)) {
      ack?.({ ok: false, message: '슬라이드 데이터가 올바르지 않습니다.' });
      return;
    }

    sharedDoc = {
      slides: normalizeSlides(slides),
      updatedAt: new Date().toISOString()
    };

    try {
      await writeDocument(sharedDoc);
      socket.broadcast.emit('document:sync', sharedDoc);
      ack?.({ ok: true, updatedAt: sharedDoc.updatedAt });
    } catch (error) {
      ack?.({ ok: false, message: error.message });
    }
  });
});

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Shared document server listening on ${port}`);
  console.log(`Firestore database: ${firestoreDatabaseId}`);
});

function initFirestore() {
  if (admin.apps.length > 0) {
    return getFirestore(admin.app(), firestoreDatabaseId);
  }

  const encodedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (encodedServiceAccount) {
    const serviceAccount = JSON.parse(Buffer.from(encodedServiceAccount, 'base64').toString('utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    return getFirestore(admin.app(), firestoreDatabaseId);
  }

  if (rawServiceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(rawServiceAccount))
    });
    return getFirestore(admin.app(), firestoreDatabaseId);
  }

  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID
  });
  return getFirestore(admin.app(), firestoreDatabaseId);
}

async function readDocument() {
  const snapshot = await documentRef.get();

  if (!snapshot.exists) {
    await writeDocument(defaultDoc);
    return defaultDoc;
  }

  const data = snapshot.data();
  return {
    slides: normalizeSlides(data?.slides),
    updatedAt: data?.updatedAt || new Date().toISOString()
  };
}

async function writeDocument(document) {
  await documentRef.set(document, { merge: true });
}

function normalizeSlides(slides) {
  if (!Array.isArray(slides)) {
    return defaultDoc.slides;
  }

  const cleanSlides = slides
    .filter((slide) => slide && typeof slide.id === 'string')
    .map((slide) => ({
      id: slide.id,
      content: String(slide.content ?? '')
    }));

  return cleanSlides.length > 0 ? cleanSlides : defaultDoc.slides;
}

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
export let auth = null;
export let db = null;
if (firebaseConfigured) {
  const app = getApps()[0] || initializeApp(config);
  auth = getAuth(app);
  auth.languageCode = 'pt-BR';
  db = getFirestore(app);
  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && !globalThis.__checkpointEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    globalThis.__checkpointEmulators = true;
  }
}

export function friendlyError(error) {
  const messages = {
    'auth/email-already-in-use': 'Este e-mail já tem uma conta. Use a opção Entrar.',
    'auth/invalid-email': 'Informe um e-mail válido.',
    'auth/weak-password': 'Use uma senha mais forte, com pelo menos 6 caracteres.',
    'auth/password-does-not-meet-requirements': 'A senha não atende à política configurada no Firebase.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
    'auth/network-request-failed': 'Não foi possível conectar. Confira sua conexão.',
    'auth/operation-not-allowed': 'Ative o login por e-mail e senha no Firebase Authentication.',
    'auth/invalid-api-key': 'Confira a configuração do Firebase no arquivo .env.',
    'permission-denied': 'Sem permissão para salvar. Confira as regras do Firestore no guia do projeto.',
    'unavailable': 'O serviço está indisponível. Confira sua conexão e tente novamente.',
  };
  return messages[error?.code] || error?.message || 'Não foi possível concluir. Tente novamente.';
}

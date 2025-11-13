import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../database/firebaseconfig';

export async function safeUpdateDoc(collectionName, id, data) {
  if (!collectionName || typeof collectionName !== 'string') {
    console.warn('safeUpdateDoc: invalid collectionName', collectionName);
    throw new Error('Invalid collection name');
  }
  if (!id) {
    console.warn('safeUpdateDoc: missing id for collection', collectionName);
    throw new Error('Missing document id');
  }
  return updateDoc(doc(db, collectionName, id), data);
}

export async function safeDeleteDoc(collectionName, id) {
  if (!collectionName || typeof collectionName !== 'string') {
    console.warn('safeDeleteDoc: invalid collectionName', collectionName);
    throw new Error('Invalid collection name');
  }
  if (!id) {
    console.warn('safeDeleteDoc: missing id for collection', collectionName);
    throw new Error('Missing document id');
  }
  return deleteDoc(doc(db, collectionName, id));
}

export async function safeGetDoc(collectionName, id) {
  if (!collectionName || typeof collectionName !== 'string') {
    console.warn('safeGetDoc: invalid collectionName', collectionName);
    return null;
  }
  if (!id) {
    console.warn('safeGetDoc: missing id for collection', collectionName);
    return null;
  }
  try {
    return await getDoc(doc(db, collectionName, id));
  } catch (e) {
    console.error('safeGetDoc error', e);
    return null;
  }
}

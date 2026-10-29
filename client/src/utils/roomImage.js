const DATABASE_NAME = 'messiah-room-images';
const STORE_NAME = 'roomImages';

function openRoomImageDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is unavailable in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open room image cache.'));
    request.onblocked = () => reject(new Error('Room image cache upgrade is blocked.'));
  });
}

export async function cacheRoomImages(rooms) {
  const images = rooms.filter((room) => room.id != null && room.room_image);
  if (images.length === 0) return;

  const database = await openRoomImageDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      images.forEach((room) => {
        store.put({ id: String(room.id), room_image: room.room_image });
      });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Unable to cache room images.'));
      transaction.onabort = () => reject(transaction.error || new Error('Room image cache update was aborted.'));
    });
  } finally {
    database.close();
  }
}

export async function getCachedRoomImages(roomIds) {
  if (roomIds.length === 0) return new Map();

  const database = await openRoomImageDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const images = new Map();

      roomIds.forEach((id) => {
        const request = store.get(String(id));
        request.onsuccess = () => {
          if (request.result?.room_image) {
            images.set(String(id), request.result.room_image);
          }
        };
      });
      transaction.oncomplete = () => resolve(images);
      transaction.onerror = () => reject(transaction.error || new Error('Unable to read room image cache.'));
      transaction.onabort = () => reject(transaction.error || new Error('Room image cache read was aborted.'));
    });
  } finally {
    database.close();
  }
}
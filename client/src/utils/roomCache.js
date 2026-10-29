export function cacheRooms(rooms) {
  const cacheableRooms = rooms.map((room) => {
    const cacheableRoom = { ...room };
    cacheableRoom._hasRoomImage = Boolean(room.room_image);
    delete cacheableRoom.room_image;
    return cacheableRoom;
  });

  try {
    localStorage.setItem('roomsCache', JSON.stringify(cacheableRooms));
  } catch (error) {
    console.warn('Unable to update room cache:', error);
  }
}

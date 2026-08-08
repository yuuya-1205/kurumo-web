import { configureStore } from '@reduxjs/toolkit'
import { saveFavoriteIds } from '../api/favoriteStorage'
import { favoritesSlice } from './favoritesSlice'

export const store = configureStore({
  reducer: {
    [favoritesSlice.reducerPath]: favoritesSlice.reducer,
  },
})

/*
 * お気に入りが変わったら保存する。
 * slice の中で localStorage を触ると reducer が純粋でなくなるので、
 * 購読して外側から書き出す。書き出し自体は adapter 層の関数に任せる。
 */
let savedIds = store.getState().favorites.ids
store.subscribe(() => {
  const { ids } = store.getState().favorites
  if (ids !== savedIds) {
    savedIds = ids
    saveFavoriteIds(ids)
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

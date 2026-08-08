import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { loadFavoriteIds } from '../api/favoriteStorage'

type FavoritesState = {
  /** お気に入りに入っている店舗 ID。順序は保持しない */
  ids: number[]
}

// 初期値は保存済みのものから。読み出しは adapter 層に任せる。
const initialState: FavoritesState = { ids: loadFavoriteIds() }

/**
 * お気に入りの状態。
 * 一覧を離れても残るよう、画面ではなく store に置いている。
 */
export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    toggled(state, action: PayloadAction<number>) {
      const id = action.payload
      if (state.ids.includes(id)) {
        state.ids = state.ids.filter((value) => value !== id)
      } else {
        state.ids.push(id)
      }
    },
  },
  selectors: {
    /** その店舗がお気に入りかどうか */
    selectIsFavorite: (state, id: number) => state.ids.includes(id),
    selectFavoriteIds: (state) => state.ids,
  },
})

export const { toggled } = favoritesSlice.actions
export const { selectIsFavorite, selectFavoriteIds } = favoritesSlice.selectors

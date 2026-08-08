import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './index'

/*
 * 型を付けた版。画面からは素の useDispatch / useSelector ではなくこちらを使う。
 * 毎回 RootState を書かずに済む。
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()

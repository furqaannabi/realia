import { create } from 'zustand'

type State = {
    user: any
}
type Action = {
    updateUser: (user: any) => void
}
const useAuth = create<State & Action>((set) => ({
    user: null,
    updateUser: (user: any) => set(() => ({ user: user }))
}))


export default useAuth

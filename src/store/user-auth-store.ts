import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type UserAuthStoreType } from "@/types";

const userAuthStore = create(
    persist<UserAuthStoreType>(
        (set) => ({
            user: null,
            userExists: false,
            setUser: (user) => set({ user: user, userExists: true }),
            reset: () => set({ user: null, userExists: false }),
        }),
        { 
            name: "user-auth-store", 
            storage: createJSONStorage(() => AsyncStorage) 
        }
    )
);

export { userAuthStore };





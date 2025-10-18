import { createSlice } from '@reduxjs/toolkit';

interface SessionState {
  isExpiredDialogOpen: boolean;
}

const initialState: SessionState = {
  isExpiredDialogOpen: false,
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    showSessionExpiredDialog: (state) => {
      state.isExpiredDialogOpen = true;
    },
    hideSessionExpiredDialog: (state) => {
      state.isExpiredDialogOpen = false;
    },
  },
});

export const { showSessionExpiredDialog, hideSessionExpiredDialog } = sessionSlice.actions;

export default sessionSlice.reducer;
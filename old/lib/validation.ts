export const isEmailValid = (email: string) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/.test(email.trim());

export const isPasswordValid = (password: string) => {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password.trim());
};

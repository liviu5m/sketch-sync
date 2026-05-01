export type User = {
  id: number;
};

export type UserData = {
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export type LoginUserData = {
  email: string;
  password: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
}

export class UserEntity {
  constructor(private user: User) {}

  getEmail(): string {
    return this.user.email;
  }

  changeEmail(newEmail: string): void {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(newEmail)) {
      throw new Error("Invalid email format");
    }
    this.user.email = newEmail;
  }
}

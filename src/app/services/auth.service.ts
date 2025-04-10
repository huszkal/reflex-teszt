import { Injectable } from '@angular/core';
import { Auth, User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser: User | null = null;

  constructor(private auth: Auth) {
    onAuthStateChanged(this.auth, user => {
      this.currentUser = user;
    });
  }

  login(email: string, password: string): Promise<User> {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then(cred => {
        this.currentUser = cred.user;
        return cred.user;
      });
  }

  register(email: string, password: string): Promise<User> {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then(cred => {
        this.currentUser = cred.user;
        return cred.user;
      });
  }

  logout(): Promise<void> {
    return signOut(this.auth).then(() => {
      this.currentUser = null;
    });
  }
}

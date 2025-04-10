import { Injectable } from '@angular/core';
import { Auth, User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router'; // <<< HOZZÁADJUK
import { doc, setDoc , Firestore} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser: User | null = null;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private auth: Auth, private router: Router, private firestore: Firestore) {
    onAuthStateChanged(this.auth, user => {
      this.currentUser = user;
      this.currentUserSubject.next(user); // <<< FONTOS
    });
  }

  login(email: string, password: string): Promise<User> {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then(cred => {
        this.currentUser = cred.user;
        this.currentUserSubject.next(cred.user); // <<< FONTOS
        this.router.navigate(['/game']);
        return cred.user;
      });
  }

  register(email: string, password: string): Promise<User> {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then(async cred => {
        this.currentUser = cred.user;
        this.currentUserSubject.next(cred.user); // <<< FONTOS

        const userRef = doc(this.firestore, 'users', cred.user.uid);
        await setDoc(userRef, {
          email: cred.user.email,
          points: 0,
          createdAt: new Date(),
        });

        this.router.navigate(['/login']);
        return cred.user;
      });
  }

  logout(): Promise<void> {
    return signOut(this.auth).then(() => {
      this.currentUser = null;
      this.currentUserSubject.next(null); // <<< FONTOS
      this.router.navigate(['/login']);
    });
  }
}

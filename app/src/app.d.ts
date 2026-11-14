import type { User } from '$lib/notes/types';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
    }
  }
}

export {};

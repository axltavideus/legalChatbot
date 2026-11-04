/**
 * Root page — redirect to /tanya if logged in, /login otherwise.
 * The middleware handles this redirect, but this is a fallback.
 */
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/login');
}


// Custom type declarations for non-standard HTML attributes

import 'react';

declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    // Apple/WebKit passwordrules attribute for password generation
    // https://developer.apple.com/password-rules/
    passwordRules?: string;
  }
}

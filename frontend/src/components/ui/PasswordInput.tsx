import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './Input';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Applied to the wrapper, so layout utilities such as `mt-2` behave normally. */
  className?: string;
  inputClassName?: string;
}

/**
 * Password input with a visibility toggle. Typing a long password blind is the
 * most common cause of the "invalid credentials" round trip, so let people look.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = '', inputClassName = '', ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className={`relative ${className}`}>
        <Input
          ref={ref}
          {...props}
          type={visible ? 'text' : 'password'}
          className={`pr-11 ${inputClassName}`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-600 transition hover:text-slate-300"
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

import { Link } from 'react-router-dom';
import { Compass } from '@phosphor-icons/react';
import { Message } from '../components/ui/Message';
import { Button } from '../components/ui/Button';

// The not found page. Every screen in the Figma has a real route, so this only shows for a
// mistyped or old address.
export function NotFound() {
  return (
    <Message
      icon={<Compass weight="fill" className="h-10 w-10 text-ink3" aria-hidden />}
      title="This page does not exist"
      body="The address may be mistyped, or the page has moved. The lobby has everything else."
      action={
        <Button asChild variant="secondary">
          <Link to="/lobby">Go to the lobby</Link>
        </Button>
      }
    />
  );
}

import { MessageCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { useStartConversation } from './api';

/** Opens the thread with a connected person. The server enforces the connection, so this only needs to handle errors. */
export function MessageButton({ userId, variant = 'outline' }: { userId: string; variant?: 'outline' | 'default' }) {
  const navigate = useNavigate();
  const start = useStartConversation();
  return (
    <Button
      variant={variant}
      disabled={start.isPending}
      onClick={() =>
        start.mutate(userId, {
          onSuccess: ({ id }) => navigate(`/messages/${id}`),
          onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not open the chat. Try again.'),
        })
      }
    >
      {start.isPending ? <Loader2 className="animate-spin" /> : <MessageCircle />} Message
    </Button>
  );
}

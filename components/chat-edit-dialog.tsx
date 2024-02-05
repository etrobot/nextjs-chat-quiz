'use client'
import Textarea from 'react-textarea-autosize'
import * as React from 'react'
import { type DialogProps } from '@radix-ui/react-dialog'
import { toast } from 'react-hot-toast'
import { ServerActionResult, type Chat } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter
} from '@/components/ui/dialog'
import { IconSpinner } from '@/components/ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'

interface ChatEditDialogProps extends DialogProps {
  jsonCode: string
}

export function ChatEditDialog({
  jsonCode,
  ...props
}: ChatEditDialogProps) {
  const [editedTxt, setEditedTxt] = React.useState("");
  React.useEffect(() => {
    setEditedTxt(jsonCode);
  }, [jsonCode]);
  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
            edit the json and save
        </DialogHeader>
        <div className="p-4 space-y-1 text-sm border rounded-md">
        <Textarea
          value={editedTxt}
          onChange={(e) => setEditedTxt(e.target.value)}
          spellCheck={false}
          className="max-h-[50vh] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
        />
        </div>
        <DialogFooter className="items-center">
          <Button
            onClick={async () => {
              const storedMessages = localStorage.getItem('messages');
              console.log(storedMessages)
              if (storedMessages) {
                const messages = JSON.parse(storedMessages);
                const title=messages[0].content.substring(0, 100);
                const id = window.location.pathname.split('/').slice(-1)[0]
                const createdAt = Date.now();
                const path = `/chat/${id}`
                const payload = {
                  id,
                  title,
                  createdAt,
                  path,
                  messages: [
                    ...messages.slice(0,-1),
                    {
                      content: "```json\n" + editedTxt+"\n```",
                      role: 'assistant'
                    }
                  ]
                }
                const response = await fetch('/api/edit', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(payload)
                });
                
                const statusCode = await response.status;
                if(statusCode === 200){
                  window.location.reload();
                }
              }
            }}
          >Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

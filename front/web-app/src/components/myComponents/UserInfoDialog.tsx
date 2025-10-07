"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UserInfoDialogProps {
  user: {
    role: string;
    name: string;
    email?: string;
    phone?: string;
    status: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserInfoDialog({ user, isOpen, onClose }: UserInfoDialogProps) {
  if (!user) return null; // Não renderiza se não houver usuário

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Information</DialogTitle>
          <DialogDescription>
            Details about the selected user.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email || "No email provided"}</p>
          <p><strong>Phone:</strong> {user.phone || "No phone provided"}</p>
          <p><strong>Status:</strong> {user.status}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

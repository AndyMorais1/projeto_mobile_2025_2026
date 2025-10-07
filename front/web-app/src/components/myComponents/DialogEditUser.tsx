"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";

export function DialogEditUser({
  user,
  onUserUpdated,
}: {
  user: {
    id?: string;
    role?: string;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
    photo?: string;
  };
  onUserUpdated: (updatedUser: any) => void;
}) {
  const [role, setRole] = React.useState<string>(user.role ?? "CLIENT");
  const [name, setName] = React.useState<string>(user.name ?? "");
  const [email, setEmail] = React.useState<string>(user.email ?? "");
  const [phone, setPhone] = React.useState<string>(user.phone ?? "");
  const [status, setStatus] = React.useState<string>(user.status ?? "PENDING");
  const [image, setImage] = React.useState<File | null>(null);
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const handleOpen = (open: boolean) => {
    if (open) {
      setRole(user.role ?? "CLIENT");
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
      setStatus(user.status ?? "PENDING");
      setImage(null);
    }
    setIsOpen(open);
  };

  const isDisabled = user.role?.toLowerCase() === "admin";

  const handleUpdateUser = () => {
    const updatedUser = {
      ...user,
      role,
      name,
      email,
      phone,
      status,
      photo: image ? URL.createObjectURL(image) : user.photo,
    };
    onUserUpdated(updatedUser);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="icon"
          disabled={isDisabled}
        >
          <Pencil className="text-blue-600" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Edit the details of the user.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Role */}
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <Select
              onValueChange={setRole}
              value={role}
              disabled={isDisabled}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLIENT">Client</SelectItem>
                <SelectItem value="AGENT">Agent</SelectItem>
                <SelectItem value="ADMIN" disabled>
                  Admin
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={setStatus} value={status}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Form */}
          <form>
            <div className="grid gap-4">
              {/* Name */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  type="text"
                  className="col-span-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isDisabled}
                />
              </div>

              {/* Email & Phone */}
              {(role === "CLIENT" || role === "AGENT") && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      className="col-span-3"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isDisabled}
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      className="col-span-3"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isDisabled}
                    />
                  </div>
                </>
              )}

              {/* Profile Image Upload */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">Profile Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  className="col-span-3"
                  onChange={(e) =>
                    setImage(e.target.files ? e.target.files[0] : null)
                  }
                />
              </div>

              {/* Preview atual */}
              {user.photo && !image && (
                <div className="flex justify-center">
                  <img
                    src={user.photo}
                    alt="Current Photo"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                </div>
              )}

              {/* Preview nova imagem */}
              {image && (
                <div className="flex justify-center">
                  <img
                    src={URL.createObjectURL(image)}
                    alt="New Photo"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                </div>
              )}
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleUpdateUser}
            disabled={!role || !name || isDisabled}
          >
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
